import logger from '../utils/logger';
import { db } from "../db";
import { eq, and, desc, asc, count, sql, gte, lte } from "drizzle-orm";
import {
  courses,
  lessons,
  quizzes,
  quizQuestions,
  courseEnrollments,
  lessonProgress,
  quizAttempts,
  learningAchievements,
  learningAnalytics,
  certificates,
  users,
  type Course,
  type Lesson,
  type Quiz,
  type QuizQuestion,
  type CourseEnrollment,
  type LessonProgress,
  type QuizAttempt,
  type LearningAchievement,
  type Certificate,
  type InsertLesson,
  type InsertQuiz,
  type InsertQuizQuestion,
  type InsertCourseEnrollment,
  type InsertLessonProgress,
  type InsertQuizAttempt,
  type InsertLearningAchievement,
  type InsertLearningAnalytics,
  type InsertCertificate,
} from "@shared/schema";
import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';

export interface QuizSubmission {
  quizId: string;
  answers: Record<string, string | string[]>; // questionId -> answer(s)
  timeSpent?: number;
}

export interface QuizResult {
  attemptId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  isPassed: boolean;
  feedback: Array<{
    questionId: string;
    isCorrect: boolean;
    explanation?: string;
    userAnswer: string | string[];
    correctAnswer: string | string[];
  }>;
}

export interface LearningPath {
  courseId: string;
  lessons: Array<{
    lesson: Lesson;
    isCompleted: boolean;
    progress: number;
    quizzes: Array<{
      quiz: Quiz;
      attempts: number;
      bestScore?: number;
      isPassed: boolean;
    }>;
  }>;
  overallProgress: number;
  estimatedTimeRemaining: number;
}

export interface UserLearningStats {
  totalCoursesEnrolled: number;
  totalCoursesCompleted: number;
  totalLessonsCompleted: number;
  totalQuizzesPassed: number;
  totalTimeSpent: number;
  averageQuizScore: number;
  achievements: LearningAchievement[];
  currentStreak: number;
  certificates: Certificate[];
}

export interface CertificateData {
  studentName: string;
  courseName: string;
  completionDate: Date;
  score?: number;
  certificateNumber: string;
  verificationCode: string;
  organizationName?: string;
  instructorName?: string;
}

export class LearningManagementService {
  // Course Management
  async getCourseWithContent(courseId: string): Promise<Course & { lessons: Lesson[]; quizzes: Quiz[] } | null> {
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!course) return null;

    const courseLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(asc(lessons.order));

    const courseQuizzes = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.courseId, courseId));

    return {
      ...course,
      lessons: courseLessons,
      quizzes: courseQuizzes
    };
  }

  async createLesson(lessonData: InsertLesson): Promise<Lesson> {
    const [lesson] = await db
      .insert(lessons)
      .values(lessonData)
      .returning();
    return lesson;
  }

  async updateLesson(lessonId: string, updates: Partial<InsertLesson>): Promise<Lesson | null> {
    const [updated] = await db
      .update(lessons)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(lessons.id, lessonId))
      .returning();
    return updated || null;
  }

  async deleteLesson(lessonId: string): Promise<boolean> {
    const result = await db
      .delete(lessons)
      .where(eq(lessons.id, lessonId));
    return (result.rowCount || 0) > 0;
  }

  // Quiz Engine
  async createQuiz(quizData: InsertQuiz): Promise<Quiz> {
    const [quiz] = await db
      .insert(quizzes)
      .values(quizData)
      .returning();
    return quiz;
  }

  async addQuizQuestion(questionData: InsertQuizQuestion): Promise<QuizQuestion> {
    const [question] = await db
      .insert(quizQuestions)
      .values(questionData)
      .returning();
    return question;
  }

  async getQuizWithQuestions(quizId: string): Promise<(Quiz & { questions: QuizQuestion[] }) | null> {
    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId));

    if (!quiz) return null;

    const questions = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(asc(quizQuestions.order));

    return {
      ...quiz,
      questions
    };
  }

  async submitQuiz(userId: string, submission: QuizSubmission): Promise<QuizResult> {
    const quizWithQuestions = await this.getQuizWithQuestions(submission.quizId);
    if (!quizWithQuestions) {
      throw new Error("Quiz not found");
    }

    // Get previous attempts count
    const [attemptCount] = await db
      .select({ count: count() })
      .from(quizAttempts)
      .where(and(
        eq(quizAttempts.userId, userId),
        eq(quizAttempts.quizId, submission.quizId)
      ));

    const attemptNumber = (attemptCount?.count || 0) + 1;

    // Check max attempts
    if (quizWithQuestions.maxAttempts && attemptNumber > quizWithQuestions.maxAttempts) {
      throw new Error("Maximum quiz attempts exceeded");
    }

    // Score the quiz
    const feedback: QuizResult['feedback'] = [];
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    for (const question of quizWithQuestions.questions) {
      const userAnswer = submission.answers[question.id];
      const isCorrect = this.checkAnswer(question, userAnswer);
      
      if (isCorrect) {
        correctAnswers++;
        earnedPoints += question.points;
      }
      totalPoints += question.points;

      feedback.push({
        questionId: question.id,
        isCorrect,
        explanation: quizWithQuestions.showCorrectAnswers ? question.explanation || undefined : undefined,
        userAnswer,
        correctAnswer: quizWithQuestions.showCorrectAnswers ? question.correctAnswers || [] : []
      });
    }

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const isPassed = score >= quizWithQuestions.passingScore;

    // Save quiz attempt
    const [attempt] = await db
      .insert(quizAttempts)
      .values({
        userId,
        quizId: submission.quizId,
        courseId: quizWithQuestions.courseId,
        attemptNumber,
        completedAt: new Date(),
        score,
        totalQuestions: quizWithQuestions.questions.length,
        correctAnswers,
        timeSpent: submission.timeSpent,
        isPassed,
        answers: submission.answers
      })
      .returning();

    // Track learning analytics
    await this.trackLearningActivity(userId, {
      courseId: quizWithQuestions.courseId || undefined,
      timeSpent: submission.timeSpent || 0,
      activitiesCompleted: 1,
      questionsAnswered: quizWithQuestions.questions.length,
      correctAnswersCount: correctAnswers,
      engagementScore: this.calculateEngagementScore(score, submission.timeSpent),
      learningPath: `quiz:${submission.quizId}`
    });

    // Award achievements
    await this.checkAndAwardAchievements(userId, {
      type: 'quiz_completion',
      courseId: quizWithQuestions.courseId || undefined,
      score,
      isPassed
    });

    return {
      attemptId: attempt.id,
      score,
      totalQuestions: quizWithQuestions.questions.length,
      correctAnswers,
      isPassed,
      feedback
    };
  }

  private checkAnswer(question: QuizQuestion, userAnswer: string | string[]): boolean {
    if (!userAnswer || !question.correctAnswers) return false;

    const correctAnswers = question.correctAnswers;
    
    switch (question.type) {
      case 'multiple_choice':
      case 'true_false':
        return typeof userAnswer === 'string' && correctAnswers.includes(userAnswer);
      
      case 'short_answer':
        if (typeof userAnswer !== 'string') return false;
        return correctAnswers.some(correct => 
          userAnswer.toLowerCase().trim() === correct.toLowerCase().trim()
        );
      
      case 'matching':
      case 'drag_drop':
        if (!Array.isArray(userAnswer)) return false;
        return JSON.stringify(userAnswer.sort()) === JSON.stringify(correctAnswers.sort());
      
      default:
        return false;
    }
  }

  // Course Enrollment & Progress
  async enrollUserInCourse(userId: string, courseId: string): Promise<CourseEnrollment> {
    // Check if already enrolled
    const [existing] = await db
      .select()
      .from(courseEnrollments)
      .where(and(
        eq(courseEnrollments.userId, userId),
        eq(courseEnrollments.courseId, courseId)
      ));

    if (existing) {
      return existing;
    }

    const [enrollment] = await db
      .insert(courseEnrollments)
      .values({
        userId,
        courseId,
        enrolledAt: new Date()
      })
      .returning();

    return enrollment;
  }

  async updateLessonProgress(
    userId: string,
    lessonId: string,
    progressData: Partial<InsertLessonProgress>
  ): Promise<LessonProgress> {
    const [existing] = await db
      .select()
      .from(lessonProgress)
      .where(and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.lessonId, lessonId)
      ));

    if (existing) {
      const [updated] = await db
        .update(lessonProgress)
        .set(progressData)
        .where(eq(lessonProgress.id, existing.id))
        .returning();
      return updated;
    } else {
      const [lesson] = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, lessonId));

      const [progress] = await db
        .insert(lessonProgress)
        .values({
          userId,
          lessonId,
          courseId: lesson.courseId,
          ...progressData
        })
        .returning();
      return progress;
    }
  }

  async getLearningPath(userId: string, courseId: string): Promise<LearningPath> {
    // Get course lessons
    const courseLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(asc(lessons.order));

    // Get user progress for each lesson
    const lessonData = await Promise.all(
      courseLessons.map(async (lesson) => {
        const [progress] = await db
          .select()
          .from(lessonProgress)
          .where(and(
            eq(lessonProgress.userId, userId),
            eq(lessonProgress.lessonId, lesson.id)
          ));

        // Get lesson quizzes
        const lessonQuizzes = await db
          .select()
          .from(quizzes)
          .where(eq(quizzes.lessonId, lesson.id));

        const quizData = await Promise.all(
          lessonQuizzes.map(async (quiz) => {
            const attempts = await db
              .select()
              .from(quizAttempts)
              .where(and(
                eq(quizAttempts.userId, userId),
                eq(quizAttempts.quizId, quiz.id)
              ))
              .orderBy(desc(quizAttempts.score));

            const bestScore = attempts[0]?.score;
            const isPassed = attempts.some(attempt => attempt.isPassed);

            return {
              quiz,
              attempts: attempts.length,
              bestScore: bestScore || undefined,
              isPassed
            };
          })
        );

        return {
          lesson,
          isCompleted: progress?.isCompleted || false,
          progress: progress?.progress || 0,
          quizzes: quizData
        };
      })
    );

    // Calculate overall progress
    const totalLessons = courseLessons.length;
    const completedLessons = lessonData.filter(l => l.isCompleted).length;
    const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    // Estimate remaining time
    const remainingLessons = lessonData.filter(l => !l.isCompleted);
    const estimatedTimeRemaining = remainingLessons.reduce(
      (total, lesson) => total + (lesson.lesson.estimatedDuration || 30),
      0
    );

    return {
      courseId,
      lessons: lessonData,
      overallProgress,
      estimatedTimeRemaining
    };
  }

  // Learning Analytics
  async trackLearningActivity(userId: string, activity: Omit<InsertLearningAnalytics, 'userId'>): Promise<void> {
    await db
      .insert(learningAnalytics)
      .values({
        userId,
        ...activity
      });
  }

  private calculateEngagementScore(score: number, timeSpent?: number): number {
    let engagement = score; // Base score (0-100)
    
    if (timeSpent) {
      // Bonus for reasonable time spent (not too fast, not too slow)
      const timeBonus = Math.min(timeSpent / 60, 10); // Up to 10 points for time
      engagement = Math.min(engagement + timeBonus, 100);
    }
    
    return Math.round(engagement);
  }

  async getUserLearningStats(userId: string): Promise<UserLearningStats> {
    const [enrollmentStats] = await db
      .select({
        totalEnrolled: count(courseEnrollments.id),
        totalCompleted: count(sql`CASE WHEN ${courseEnrollments.status} = 'completed' THEN 1 END`)
      })
      .from(courseEnrollments)
      .where(eq(courseEnrollments.userId, userId));

    const [lessonStats] = await db
      .select({
        totalCompleted: count(lessonProgress.id)
      })
      .from(lessonProgress)
      .where(and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.isCompleted, true)
      ));

    const [quizStats] = await db
      .select({
        totalPassed: count(sql`CASE WHEN ${quizAttempts.isPassed} = true THEN 1 END`),
        avgScore: sql<number>`AVG(${quizAttempts.score})`
      })
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId));

    const [timeStats] = await db
      .select({
        totalTime: sql<number>`SUM(${learningAnalytics.timeSpent})`
      })
      .from(learningAnalytics)
      .where(eq(learningAnalytics.userId, userId));

    const achievements = await db
      .select()
      .from(learningAchievements)
      .where(eq(learningAchievements.userId, userId))
      .orderBy(desc(learningAchievements.earnedAt));

    const userCertificates = await db
      .select()
      .from(certificates)
      .where(and(
        eq(certificates.userId, userId),
        eq(certificates.isRevoked, false)
      ))
      .orderBy(desc(certificates.issuedAt));

    // Calculate current streak (consecutive days of learning activity)
    const recentActivity = await db
      .select({ date: sql<string>`DATE(${learningAnalytics.sessionDate})` })
      .from(learningAnalytics)
      .where(eq(learningAnalytics.userId, userId))
      .orderBy(desc(learningAnalytics.sessionDate))
      .limit(30);

    const currentStreak = this.calculateLearningStreak(recentActivity.map(a => a.date));

    return {
      totalCoursesEnrolled: enrollmentStats?.totalEnrolled || 0,
      totalCoursesCompleted: enrollmentStats?.totalCompleted || 0,
      totalLessonsCompleted: lessonStats?.totalCompleted || 0,
      totalQuizzesPassed: quizStats?.totalPassed || 0,
      totalTimeSpent: timeStats?.totalTime || 0,
      averageQuizScore: Math.round(quizStats?.avgScore || 0),
      achievements,
      currentStreak,
      certificates: userCertificates
    };
  }

  private calculateLearningStreak(activityDates: string[]): number {
    if (activityDates.length === 0) return 0;

    const uniqueDates = Array.from(new Set(activityDates)).sort((a, b) => b.localeCompare(a));
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const dateStr of uniqueDates) {
      const activityDate = new Date(dateStr);
      const diffDays = Math.floor((currentDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === streak) {
        streak++;
      } else if (diffDays === streak + 1) {
        // Skip today if no activity yet
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  // Achievements System
  async checkAndAwardAchievements(
    userId: string,
    context: {
      type: 'quiz_completion' | 'course_completion' | 'lesson_completion';
      courseId?: string;
      score?: number;
      isPassed?: boolean;
    }
  ): Promise<LearningAchievement[]> {
    const newAchievements: LearningAchievement[] = [];

    // Perfect Score Achievement
    if (context.type === 'quiz_completion' && context.score === 100) {
      const achievement = await this.awardAchievement(userId, {
        type: 'perfect_score',
        title: 'Perfect Score!',
        description: 'Scored 100% on a quiz',
        pointsAwarded: 50,
        courseId: context.courseId,
        badgeColor: '#FFD700'
      });
      if (achievement) newAchievements.push(achievement);
    }

    // Fast Learner Achievement (complete lesson quickly)
    if (context.type === 'lesson_completion') {
      const achievement = await this.awardAchievement(userId, {
        type: 'fast_learner',
        title: 'Fast Learner',
        description: 'Completed a lesson efficiently',
        pointsAwarded: 25,
        courseId: context.courseId,
        badgeColor: '#00FF00'
      });
      if (achievement) newAchievements.push(achievement);
    }

    // Course Completion Achievement
    if (context.type === 'course_completion') {
      const achievement = await this.awardAchievement(userId, {
        type: 'course_completion',
        title: 'Course Master',
        description: 'Completed an entire course',
        pointsAwarded: 100,
        courseId: context.courseId,
        badgeColor: '#8B5CF6'
      });
      if (achievement) newAchievements.push(achievement);
    }

    return newAchievements;
  }

  private async awardAchievement(
    userId: string,
    achievementData: Omit<InsertLearningAchievement, 'userId'>
  ): Promise<LearningAchievement | null> {
    // Check if user already has this achievement for this course
    const [existing] = await db
      .select()
      .from(learningAchievements)
      .where(and(
        eq(learningAchievements.userId, userId),
        eq(learningAchievements.type, achievementData.type),
        achievementData.courseId ? eq(learningAchievements.courseId, achievementData.courseId) : sql`TRUE`
      ));

    if (existing) return null;

    const [achievement] = await db
      .insert(learningAchievements)
      .values({
        userId,
        ...achievementData
      })
      .returning();

    // Update user karma coins
    await db
      .update(users)
      .set({
        karmaCoins: sql`${users.karmaCoins} + ${achievementData.pointsAwarded}`
      })
      .where(eq(users.id, userId));

    return achievement;
  }

  // Certificate Generation
  async generateCertificate(userId: string, courseId: string): Promise<Certificate> {
    // Check if user completed the course
    const [enrollment] = await db
      .select()
      .from(courseEnrollments)
      .where(and(
        eq(courseEnrollments.userId, userId),
        eq(courseEnrollments.courseId, courseId),
        eq(courseEnrollments.status, 'completed')
      ));

    if (!enrollment) {
      throw new Error("Course not completed");
    }

    // Check if certificate already exists
    const [existing] = await db
      .select()
      .from(certificates)
      .where(and(
        eq(certificates.userId, userId),
        eq(certificates.courseId, courseId),
        eq(certificates.isRevoked, false)
      ));

    if (existing) {
      return existing;
    }

    // Generate certificate data
    const certificateNumber = this.generateCertificateNumber();
    const verificationCode = this.generateVerificationCode();

    // Get user and course data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!user || !course) {
      throw new Error("User or course not found");
    }

    // Generate PDF certificate
    const certificateData: CertificateData = {
      studentName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Student',
      courseName: course.title,
      completionDate: enrollment.completedAt || new Date(),
      score: enrollment.finalScore || undefined,
      certificateNumber,
      verificationCode,
      organizationName: 'Kin2 Workforce',
      instructorName: 'Certified Instructor'
    };

    const pdfBuffer = await this.createCertificatePDF(certificateData);

    // In a real app, you would upload this to object storage
    // For now, we'll store the base64 data
    const pdfUrl = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;

    // Save certificate record
    const [certificate] = await db
      .insert(certificates)
      .values({
        userId,
        courseId,
        certificateNumber,
        verificationCode,
        pdfUrl,
        template: 'standard',
        metadata: {
          courseTitle: course.title,
          studentName: certificateData.studentName,
          completionDate: certificateData.completionDate,
          score: certificateData.score
        }
      })
      .returning();

    // Update enrollment record
    await db
      .update(courseEnrollments)
      .set({
        certificateIssuedAt: new Date(),
        certificateUrl: pdfUrl
      })
      .where(eq(courseEnrollments.id, enrollment.id));

    return certificate;
  }

  private generateCertificateNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `CERT-${timestamp}-${random}`.toUpperCase();
  }

  private generateVerificationCode(): string {
    return Math.random().toString(36).substring(2, 12).toUpperCase();
  }

  private async createCertificatePDF(data: CertificateData): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Certificate Header
      doc.fontSize(32)
         .font('Helvetica-Bold')
         .fillColor('#2563EB')
         .text('CERTIFICATE OF COMPLETION', 0, 100, { align: 'center' });

      // Decorative line
      doc.strokeColor('#2563EB')
         .lineWidth(3)
         .moveTo(150, 160)
         .lineTo(650, 160)
         .stroke();

      // Main content
      doc.fontSize(16)
         .fillColor('#374151')
         .font('Helvetica')
         .text('This is to certify that', 0, 220, { align: 'center' });

      doc.fontSize(28)
         .font('Helvetica-Bold')
         .fillColor('#1F2937')
         .text(data.studentName, 0, 260, { align: 'center' });

      doc.fontSize(16)
         .font('Helvetica')
         .fillColor('#374151')
         .text('has successfully completed the course', 0, 320, { align: 'center' });

      doc.fontSize(20)
         .font('Helvetica-Bold')
         .fillColor('#1F2937')
         .text(data.courseName, 0, 360, { align: 'center' });

      if (data.score) {
        doc.fontSize(14)
           .font('Helvetica')
           .fillColor('#374151')
           .text(`with a score of ${data.score}%`, 0, 400, { align: 'center' });
      }

      // Date and signature section
      const completionDate = data.completionDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      doc.fontSize(12)
         .text(`Completion Date: ${completionDate}`, 100, 480);

      doc.text(`Certificate Number: ${data.certificateNumber}`, 100, 500);
      doc.text(`Verification Code: ${data.verificationCode}`, 100, 520);

      // Organization info
      if (data.organizationName) {
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text(data.organizationName, 500, 480);
      }

      if (data.instructorName) {
        doc.fontSize(12)
           .font('Helvetica')
           .text(`Authorized by: ${data.instructorName}`, 500, 500);
      }

      // Footer
      doc.fontSize(10)
         .fillColor('#6B7280')
         .text('This certificate can be verified at: kin2workforce.com/verify', 0, 560, { align: 'center' });

      doc.end();
    });
  }

  async verifyCertificate(verificationCode: string): Promise<Certificate | null> {
    const [certificate] = await db
      .select()
      .from(certificates)
      .leftJoin(users, eq(certificates.userId, users.id))
      .leftJoin(courses, eq(certificates.courseId, courses.id))
      .where(and(
        eq(certificates.verificationCode, verificationCode),
        eq(certificates.isRevoked, false)
      ));

    return certificate ? certificate.certificates : null;
  }

  async revokeCertificate(certificateId: string, reason: string): Promise<boolean> {
    const result = await db
      .update(certificates)
      .set({
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason
      })
      .where(eq(certificates.id, certificateId));

    return (result.rowCount || 0) > 0;
  }

  // Course completion workflow
  async checkCourseCompletion(userId: string, courseId: string): Promise<boolean> {
    // Get all required lessons for the course
    const requiredLessons = await db
      .select()
      .from(lessons)
      .where(and(
        eq(lessons.courseId, courseId),
        eq(lessons.isRequired, true)
      ));

    // Check if all required lessons are completed
    const completedLessons = await db
      .select()
      .from(lessonProgress)
      .where(and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.courseId, courseId),
        eq(lessonProgress.isCompleted, true)
      ));

    const requiredLessonIds = requiredLessons.map(l => l.id);
    const completedLessonIds = completedLessons.map(p => p.lessonId);
    const allRequiredCompleted = requiredLessonIds.every(id => completedLessonIds.includes(id));

    // Check required quizzes are passed
    const requiredQuizzes = await db
      .select()
      .from(quizzes)
      .where(and(
        eq(quizzes.courseId, courseId),
        eq(quizzes.isRequired, true)
      ));

    const passedQuizzes = await db
      .select()
      .from(quizAttempts)
      .where(and(
        eq(quizAttempts.userId, userId),
        eq(quizAttempts.courseId, courseId),
        eq(quizAttempts.isPassed, true)
      ));

    const requiredQuizIds = requiredQuizzes.map(q => q.id);
    const passedQuizIds = Array.from(new Set(passedQuizzes.map(a => a.quizId)));
    const allRequiredQuizzesPassed = requiredQuizIds.every(id => passedQuizIds.includes(id));

    const isCompleted = allRequiredCompleted && allRequiredQuizzesPassed;

    if (isCompleted) {
      // Calculate final score
      const finalScore = passedQuizzes.length > 0 
        ? Math.round(passedQuizzes.reduce((sum, quiz) => sum + (quiz.score || 0), 0) / passedQuizzes.length)
        : 100;

      // Update enrollment status
      await db
        .update(courseEnrollments)
        .set({
          status: 'completed',
          completedAt: new Date(),
          finalScore,
          progress: 100
        })
        .where(and(
          eq(courseEnrollments.userId, userId),
          eq(courseEnrollments.courseId, courseId)
        ));

      // Award completion achievement
      await this.checkAndAwardAchievements(userId, {
        type: 'course_completion',
        courseId
      });

      // Auto-generate certificate
      try {
        await this.generateCertificate(userId, courseId);
      } catch (error) {
        logger.error('Failed to generate certificate:', error);
      }
    }

    return isCompleted;
  }
}

export const learningManagementService = new LearningManagementService();