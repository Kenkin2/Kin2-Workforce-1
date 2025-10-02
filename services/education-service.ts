import logger from '../utils/logger';
import { db } from "../db";
import { eq, and, desc, gte, lte, sql, count, like } from "drizzle-orm";
import {
  qualifications,
  governmentProgrammes,
  programmeParticipations,
  skillsFramework,
  userSkills,
  developmentPlans,
  learningPathways,
  pathwayProgress,
  educationProviders,
  users,
  type Qualification,
  type GovernmentProgramme,
  type ProgrammeParticipation,
  type SkillsFramework,
  type UserSkill,
  type DevelopmentPlan,
  type LearningPathway,
  type PathwayProgress,
  type EducationProvider,
  type InsertQualification,
  type InsertGovernmentProgramme,
  type InsertProgrammeParticipation,
  type InsertSkillsFramework,
  type InsertUserSkill,
  type InsertDevelopmentPlan,
  type InsertLearningPathway,
  type InsertPathwayProgress,
  type InsertEducationProvider,
} from "@shared/schema";

interface EducationMetrics {
  totalQualifications: number;
  activeApprenticeships: number;
  completionRate: number;
  averageSkillLevel: number;
  governmentFunding: number;
  certificationsIssued: number;
}

interface GovernmentProgrammeAPI {
  // Apprenticeship Levy API
  apprenticeships: {
    search: (criteria: any) => Promise<any[]>;
    apply: (applicationData: any) => Promise<any>;
    getStatus: (applicationId: string) => Promise<any>;
  };
  // Skills Bootcamp API
  skillsBootcamps: {
    getAvailable: (location: string, sector: string) => Promise<any[]>;
    checkEligibility: (userId: string, programmeId: string) => Promise<boolean>;
  };
  // Adult Education Budget
  adultEducation: {
    getFunding: (courseId: string, providerId: string) => Promise<any>;
    submitApplication: (applicationData: any) => Promise<any>;
  };
}

export class EducationService {
  // Qualification Management
  async createQualification(data: InsertQualification): Promise<Qualification> {
    const [qualification] = await db
      .insert(qualifications)
      .values(data)
      .returning();
    
    return qualification;
  }

  async getUserQualifications(userId: string): Promise<Qualification[]> {
    return await db
      .select()
      .from(qualifications)
      .where(and(
        eq(qualifications.userId, userId),
        eq(qualifications.isActive, true)
      ))
      .orderBy(desc(qualifications.completionDate));
  }

  async verifyQualification(qualificationId: string, verifiedBy: string): Promise<Qualification> {
    const [updated] = await db
      .update(qualifications)
      .set({
        verificationStatus: "verified",
        verifiedBy,
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(qualifications.id, qualificationId))
      .returning();

    return updated;
  }

  // Government Programme Management
  async createGovernmentProgramme(data: InsertGovernmentProgramme): Promise<GovernmentProgramme> {
    const [programme] = await db
      .insert(governmentProgrammes)
      .values(data)
      .returning();
    
    return programme;
  }

  async getAvailableProgrammes(
    type?: string,
    sector?: string,
    location?: string
  ): Promise<GovernmentProgramme[]> {
    let whereConditions = [
      eq(governmentProgrammes.isActive, true),
      eq(governmentProgrammes.status, "open"),
      gte(governmentProgrammes.applicationDeadline, new Date())
    ];

    if (type) {
      whereConditions.push(eq(governmentProgrammes.programmeType, type as any));
    }

    if (sector) {
      whereConditions.push(eq(governmentProgrammes.sectorArea, sector));
    }

    return await db
      .select()
      .from(governmentProgrammes)
      .where(and(...whereConditions))
      .orderBy(governmentProgrammes.applicationDeadline);
  }

  async applyToProgram(data: InsertProgrammeParticipation): Promise<ProgrammeParticipation> {
    // Check if user already applied
    const existing = await db
      .select()
      .from(programmeParticipations)
      .where(and(
        eq(programmeParticipations.userId, data.userId),
        eq(programmeParticipations.programmeId, data.programmeId),
        sql`status NOT IN ('withdrawn', 'failed', 'rejected')`
      ));

    if (existing.length > 0) {
      throw new Error("User has already applied to this programme");
    }

    // Check programme capacity
    const programme = await db
      .select()
      .from(governmentProgrammes)
      .where(eq(governmentProgrammes.id, data.programmeId));

    if (!programme[0]) {
      throw new Error("Programme not found");
    }

    if (programme[0].maxParticipants && programme[0].currentParticipants! >= programme[0].maxParticipants) {
      throw new Error("Programme is at full capacity");
    }

    const [participation] = await db
      .insert(programmeParticipations)
      .values(data)
      .returning();

    // Update participant count
    await db
      .update(governmentProgrammes)
      .set({
        currentParticipants: sql`${governmentProgrammes.currentParticipants} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(governmentProgrammes.id, data.programmeId));

    return participation;
  }

  async getUserProgrammeParticipations(userId: string): Promise<ProgrammeParticipation[]> {
    return await db
      .select()
      .from(programmeParticipations)
      .where(eq(programmeParticipations.userId, userId))
      .orderBy(desc(programmeParticipations.applicationDate));
  }

  async updateParticipationProgress(
    participationId: string,
    progressPercentage: number,
    assessmentResults?: any
  ): Promise<ProgrammeParticipation> {
    const updateData: any = {
      progressPercentage,
      updatedAt: new Date(),
    };

    if (assessmentResults) {
      updateData.assessmentResults = assessmentResults;
    }

    if (progressPercentage >= 100) {
      updateData.status = "completed";
      updateData.completionDate = new Date();
      updateData.certificateIssued = true;
    }

    const [updated] = await db
      .update(programmeParticipations)
      .set(updateData)
      .where(eq(programmeParticipations.id, participationId))
      .returning();

    return updated;
  }

  // Skills Framework Management
  async createSkill(data: InsertSkillsFramework): Promise<SkillsFramework> {
    const [skill] = await db
      .insert(skillsFramework)
      .values(data)
      .returning();
    
    return skill;
  }

  async getSkillsFramework(): Promise<SkillsFramework[]> {
    return await db
      .select()
      .from(skillsFramework)
      .where(eq(skillsFramework.isActive, true))
      .orderBy(skillsFramework.skillCategory, skillsFramework.skillName);
  }

  async assessUserSkill(data: InsertUserSkill): Promise<UserSkill> {
    // Check if skill assessment already exists
    const existing = await db
      .select()
      .from(userSkills)
      .where(and(
        eq(userSkills.userId, data.userId),
        eq(userSkills.skillId, data.skillId)
      ));

    if (existing.length > 0) {
      // Update existing assessment
      const [updated] = await db
        .update(userSkills)
        .set({
          proficiencyLevel: data.proficiencyLevel,
          assessedBy: data.assessedBy,
          assessmentDate: new Date(),
          evidenceUrl: data.evidenceUrl,
          notes: data.notes,
          updatedAt: new Date(),
        })
        .where(eq(userSkills.id, existing[0].id))
        .returning();

      return updated;
    }

    const [skill] = await db
      .insert(userSkills)
      .values(data)
      .returning();
    
    return skill;
  }

  async getUserSkills(userId: string): Promise<UserSkill[]> {
    return await db
      .select({
        id: userSkills.id,
        userId: userSkills.userId,
        skillId: userSkills.skillId,
        proficiencyLevel: userSkills.proficiencyLevel,
        assessedBy: userSkills.assessedBy,
        assessmentDate: userSkills.assessmentDate,
        evidenceUrl: userSkills.evidenceUrl,
        endorsedBy: userSkills.endorsedBy,
        endorsedAt: userSkills.endorsedAt,
        lastReviewDate: userSkills.lastReviewDate,
        nextReviewDate: userSkills.nextReviewDate,
        isVerified: userSkills.isVerified,
        verificationDate: userSkills.verificationDate,
        notes: userSkills.notes,
        createdAt: userSkills.createdAt,
        updatedAt: userSkills.updatedAt,
        skillName: skillsFramework.skillName,
        skillCategory: skillsFramework.skillCategory,
        description: skillsFramework.description,
        industryStandard: skillsFramework.industryStandard,
      })
      .from(userSkills)
      .innerJoin(skillsFramework, eq(userSkills.skillId, skillsFramework.id))
      .where(eq(userSkills.userId, userId))
      .orderBy(desc(userSkills.assessmentDate));
  }

  async endorseSkill(skillId: string, endorsedBy: string): Promise<UserSkill> {
    const [updated] = await db
      .update(userSkills)
      .set({
        endorsedBy,
        endorsedAt: new Date(),
        isVerified: true,
        verificationDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userSkills.id, skillId))
      .returning();

    return updated;
  }

  // Development Plans
  async createDevelopmentPlan(data: InsertDevelopmentPlan): Promise<DevelopmentPlan> {
    const [plan] = await db
      .insert(developmentPlans)
      .values(data)
      .returning();
    
    return plan;
  }

  async getUserDevelopmentPlans(userId: string): Promise<DevelopmentPlan[]> {
    return await db
      .select()
      .from(developmentPlans)
      .where(eq(developmentPlans.userId, userId))
      .orderBy(desc(developmentPlans.createdAt));
  }

  async updateDevelopmentPlanProgress(
    planId: string,
    progressPercentage: number
  ): Promise<DevelopmentPlan> {
    const updateData: any = {
      progressPercentage,
      updatedAt: new Date(),
    };

    if (progressPercentage >= 100) {
      updateData.status = "completed";
    }

    const [updated] = await db
      .update(developmentPlans)
      .set(updateData)
      .where(eq(developmentPlans.id, planId))
      .returning();

    return updated;
  }

  // Learning Pathways
  async createLearningPathway(data: InsertLearningPathway): Promise<LearningPathway> {
    const [pathway] = await db
      .insert(learningPathways)
      .values(data)
      .returning();
    
    return pathway;
  }

  async getLearningPathways(
    industry?: string,
    careerLevel?: string
  ): Promise<LearningPathway[]> {
    let whereConditions = [eq(learningPathways.isActive, true)];

    if (industry) {
      whereConditions.push(eq(learningPathways.industry, industry));
    }

    if (careerLevel) {
      whereConditions.push(eq(learningPathways.careerLevel, careerLevel as any));
    }

    return await db
      .select()
      .from(learningPathways)
      .where(and(...whereConditions))
      .orderBy(learningPathways.difficulty, learningPathways.pathwayName);
  }

  async enrollInPathway(userId: string, pathwayId: string): Promise<PathwayProgress> {
    // Check if already enrolled
    const existing = await db
      .select()
      .from(pathwayProgress)
      .where(and(
        eq(pathwayProgress.userId, userId),
        eq(pathwayProgress.pathwayId, pathwayId),
        sql`status NOT IN ('completed', 'abandoned')`
      ));

    if (existing.length > 0) {
      throw new Error("User is already enrolled in this pathway");
    }

    // Get pathway details
    const pathway = await db
      .select()
      .from(learningPathways)
      .where(eq(learningPathways.id, pathwayId));

    if (!pathway[0]) {
      throw new Error("Learning pathway not found");
    }

    const pathwayData = pathway[0];
    const pathwaySteps = JSON.parse(pathwayData.pathwaySteps as string) || [];
    const totalSteps = pathwaySteps.length;

    const estimatedCompletionDate = new Date();
    estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + ((pathwayData.estimatedDuration || 0) * 7));

    const [progress] = await db
      .insert(pathwayProgress)
      .values({
        userId,
        pathwayId,
        totalSteps,
        estimatedCompletionDate,
        status: "in_progress",
      })
      .returning();

    return progress;
  }

  async updatePathwayProgress(
    progressId: string,
    completedSteps: number
  ): Promise<PathwayProgress> {
    const progress = await db
      .select()
      .from(pathwayProgress)
      .where(eq(pathwayProgress.id, progressId));

    if (!progress[0]) {
      throw new Error("Pathway progress not found");
    }

    const progressPercentage = Math.round((completedSteps / progress[0].totalSteps) * 100);
    const currentStep = completedSteps + 1;

    const updateData: any = {
      completedSteps,
      progressPercentage,
      currentStep,
      updatedAt: new Date(),
    };

    if (progressPercentage >= 100) {
      updateData.status = "completed";
      updateData.actualCompletionDate = new Date();
    }

    const [updated] = await db
      .update(pathwayProgress)
      .set(updateData)
      .where(eq(pathwayProgress.id, progressId))
      .returning();

    return updated;
  }

  // Education Providers
  async addEducationProvider(data: InsertEducationProvider): Promise<EducationProvider> {
    const [provider] = await db
      .insert(educationProviders)
      .values(data)
      .returning();
    
    return provider;
  }

  async getEducationProviders(): Promise<EducationProvider[]> {
    return await db
      .select()
      .from(educationProviders)
      .where(eq(educationProviders.isActive, true))
      .orderBy(educationProviders.providerName);
  }

  async syncProviderData(providerId: string): Promise<void> {
    const provider = await db
      .select()
      .from(educationProviders)
      .where(eq(educationProviders.id, providerId));

    if (!provider[0] || !provider[0].apiEndpoint) {
      throw new Error("Provider not found or API not configured");
    }

    try {
      // Simulate API call to provider
      const response = await fetch(`${provider[0].apiEndpoint}/courses`, {
        headers: {
          'Authorization': `Bearer ${provider[0].apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const coursesData = await response.json();

      await db
        .update(educationProviders)
        .set({
          coursesOffered: coursesData,
          lastSyncDate: new Date(),
          integrationStatus: "active",
          updatedAt: new Date(),
        })
        .where(eq(educationProviders.id, providerId));

    } catch (error) {
      await db
        .update(educationProviders)
        .set({
          integrationStatus: "failed",
          updatedAt: new Date(),
        })
        .where(eq(educationProviders.id, providerId));

      throw error;
    }
  }

  // Analytics and Reporting
  async getEducationMetrics(): Promise<EducationMetrics> {
    const [totalQualifications] = await db
      .select({ count: count() })
      .from(qualifications)
      .where(eq(qualifications.isActive, true));

    const [activeApprenticeships] = await db
      .select({ count: count() })
      .from(programmeParticipations)
      .innerJoin(governmentProgrammes, eq(programmeParticipations.programmeId, governmentProgrammes.id))
      .where(and(
        eq(programmeParticipations.status, "in_progress"),
        eq(governmentProgrammes.programmeType, "apprenticeship")
      ));

    const [completionStats] = await db
      .select({
        total: count(),
        completed: count(sql`CASE WHEN status = 'completed' THEN 1 END`),
      })
      .from(programmeParticipations);

    const completionRate = completionStats.total > 0 
      ? (completionStats.completed / completionStats.total) * 100 
      : 0;

    const [skillStats] = await db
      .select({
        avgLevel: sql<number>`AVG(${userSkills.proficiencyLevel})::numeric`,
      })
      .from(userSkills);

    const [fundingStats] = await db
      .select({
        totalFunding: sql<number>`SUM(${programmeParticipations.fundingReceived})::numeric`,
      })
      .from(programmeParticipations)
      .where(sql`${programmeParticipations.fundingReceived} IS NOT NULL`);

    const [certificationStats] = await db
      .select({
        count: count(),
      })
      .from(programmeParticipations)
      .where(eq(programmeParticipations.certificateIssued, true));

    return {
      totalQualifications: totalQualifications.count,
      activeApprenticeships: activeApprenticeships.count,
      completionRate: Math.round(completionRate),
      averageSkillLevel: Number(skillStats.avgLevel) || 0,
      governmentFunding: Number(fundingStats.totalFunding) || 0,
      certificationsIssued: certificationStats.count,
    };
  }

  // Government Programme Integration APIs
  async syncGovernmentProgrammes(): Promise<void> {
    try {
      // This would integrate with real government APIs
      // For now, we'll create sample programmes
      
      const sampleProgrammes = [
        {
          programmeName: "Digital Skills Bootcamp - Software Development",
          programmeType: "skills_bootcamp" as const,
          description: "Intensive 12-week programme to develop software engineering skills",
          provider: "Tech Academy Ltd",
          fundingBody: "education_skills_funding_agency" as const,
          eligibilityCriteria: JSON.stringify({
            age: "19+",
            residency: "UK",
            employment: "unemployed_or_low_skilled",
            education: "no_degree_required"
          }),
          fundingAmount: "4000.00",
          duration: 12,
          level: 3,
          sectorArea: "Digital Technology",
          startDate: new Date("2025-02-01"),
          endDate: new Date("2025-04-26"),
          applicationDeadline: new Date("2025-01-15"),
          maxParticipants: 20,
          contactEmail: "bootcamp@techacademy.co.uk",
          websiteUrl: "https://techacademy.co.uk/bootcamp",
          applicationUrl: "https://apply.techacademy.co.uk/bootcamp",
          status: "open" as const,
        },
        {
          programmeName: "Apprenticeship Standard - Data Analyst",
          programmeType: "apprenticeship" as const,
          description: "Level 4 Data Analyst apprenticeship standard",
          provider: "Data Skills Institute",
          fundingBody: "education_skills_funding_agency" as const,
          eligibilityCriteria: JSON.stringify({
            age: "16+",
            residency: "UK",
            employment: "employed_or_job_offer",
            education: "gcse_maths_english"
          }),
          fundingAmount: "15000.00",
          duration: 78, // 18 months
          level: 4,
          sectorArea: "Data Science & Analytics",
          startDate: new Date("2025-03-01"),
          endDate: new Date("2026-09-01"),
          applicationDeadline: new Date("2025-02-01"),
          maxParticipants: 50,
          contactEmail: "apprenticeships@dataskills.ac.uk",
          websiteUrl: "https://dataskills.ac.uk/apprenticeships",
          applicationUrl: "https://apply.dataskills.ac.uk/data-analyst",
          status: "open" as const,
        }
      ];

      for (const programme of sampleProgrammes) {
        // Check if programme already exists
        const existing = await db
          .select()
          .from(governmentProgrammes)
          .where(eq(governmentProgrammes.programmeName, programme.programmeName));

        if (existing.length === 0) {
          await db.insert(governmentProgrammes).values(programme);
        }
      }

      console.log(`✅ Government programmes synchronized: ${sampleProgrammes.length} programmes processed`);

    } catch (error) {
      logger.error('❌ Government programme sync failed:', error);
      throw error;
    }
  }

  async initializeSkillsFramework(): Promise<void> {
    try {
      const defaultSkills = [
        // Technical Skills
        { skillName: "JavaScript Programming", skillCategory: "technical", level: 3, industryStandard: "Industry Standard", description: "Modern JavaScript development including ES6+ features" },
        { skillName: "Database Management", skillCategory: "technical", level: 4, industryStandard: "Microsoft", description: "SQL and NoSQL database design and administration" },
        { skillName: "Cloud Computing", skillCategory: "technical", level: 4, industryStandard: "AWS/Azure", description: "Cloud infrastructure and services management" },
        
        // Digital Skills
        { skillName: "Digital Marketing", skillCategory: "digital", level: 3, industryStandard: "Google", description: "Online marketing strategies and analytics" },
        { skillName: "Data Analysis", skillCategory: "digital", level: 4, industryStandard: "Microsoft", description: "Data manipulation and visualization tools" },
        { skillName: "Cybersecurity", skillCategory: "digital", level: 5, industryStandard: "CompTIA", description: "Information security practices and protocols" },
        
        // Communication Skills
        { skillName: "Presentation Skills", skillCategory: "communication", level: 3, industryStandard: "Institute of Leadership", description: "Effective public speaking and presentation delivery" },
        { skillName: "Technical Writing", skillCategory: "communication", level: 3, industryStandard: "Professional Standards", description: "Clear technical documentation and communication" },
        
        // Leadership Skills
        { skillName: "Team Management", skillCategory: "leadership", level: 4, industryStandard: "CMI", description: "Leading and developing high-performing teams" },
        { skillName: "Project Management", skillCategory: "leadership", level: 4, industryStandard: "PRINCE2/PMP", description: "Planning and executing successful projects" },
        
        // Health & Safety
        { skillName: "Risk Assessment", skillCategory: "health_safety", level: 3, industryStandard: "NEBOSH", description: "Workplace hazard identification and risk management" },
        { skillName: "First Aid", skillCategory: "health_safety", level: 2, industryStandard: "Red Cross", description: "Emergency first aid response and treatment" },
      ];

      for (const skill of defaultSkills) {
        const existing = await db
          .select()
          .from(skillsFramework)
          .where(eq(skillsFramework.skillName, skill.skillName));

        if (existing.length === 0) {
          await db.insert(skillsFramework).values({
            skillName: skill.skillName,
            skillCategory: skill.skillCategory as any,
            description: skill.description,
            level: skill.level,
            industryStandard: skill.industryStandard,
            evidenceRequired: "Portfolio work, certificates, or practical demonstration",
            assessmentCriteria: JSON.stringify({
              theory: "Written assessment or interview",
              practical: "Demonstration of skills in real/simulated environment",
              evidence: "Portfolio of work or case studies"
            }),
            renewalPeriod: 24, // 2 years
          });
        }
      }

      console.log(`✅ Skills framework initialized: ${defaultSkills.length} skills added`);

    } catch (error) {
      logger.error('❌ Skills framework initialization failed:', error);
      throw error;
    }
  }
}

export const educationService = new EducationService();