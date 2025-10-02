import logger from './utils/logger';
import {
  users,
  organizations,
  jobs,
  shifts,
  timesheets,
  payments,
  courses,
  courseCompletions,
  activities,
  recurringShifts,
  workerAvailability,
  shiftTemplates,
  issueAlerts,
  issueRecommendations,
  issueActions,
  karmaActivities,
  karmaRewards,
  karmaTransactions,
  type User,
  type UpsertUser,
  type InsertOrganization,
  type Organization,
  type InsertJob,
  type Job,
  type InsertShift,
  type Shift,
  type InsertTimesheet,
  type Timesheet,
  type InsertPayment,
  type Payment,
  type InsertCourse,
  type Course,
  type InsertCourseCompletion,
  type CourseCompletion,
  type InsertActivity,
  type Activity,
  type IssueAlert,
  type InsertIssueAlert,
  type IssueRecommendation,
  type InsertIssueRecommendation,
  type IssueAction,
  type InsertIssueAction,
  type KarmaActivity,
  type KarmaReward,
  type KarmaTransaction,
  type InsertKarmaTransaction,
} from "@shared/schema";
import { db, trackQuery, checkDatabaseHealth } from "./db";
import { eq, desc, count, sql, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Organization operations
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  getOrganizationsByOwner(ownerId: string): Promise<Organization[]>;
  
  // Job operations
  createJob(job: InsertJob): Promise<Job>;
  getJobs(): Promise<Job[]>;
  getJobsByClient(clientId: string): Promise<Job[]>;
  getJobById(id: string): Promise<Job | undefined>;
  updateJobStatus(id: string, status: "active" | "closed" | "paused" | "draft"): Promise<void>;
  
  // Shift operations
  createShift(shift: InsertShift): Promise<Shift>;
  getShifts(filters?: Partial<Shift>): Promise<Shift[]>;
  getShiftsByJob(jobId: string): Promise<Shift[]>;
  getShiftsByWorker(workerId: string): Promise<Shift[]>;
  getShiftsByDateRange(startDate: string, endDate: string): Promise<Shift[]>;
  updateShift(id: string, updates: Partial<InsertShift>): Promise<void>;
  deleteShift(id: string): Promise<void>;
  updateShiftStatus(id: string, status: "draft" | "published" | "assigned" | "completed" | "cancelled"): Promise<void>;
  
  // Timesheet operations
  createTimesheet(timesheet: InsertTimesheet): Promise<Timesheet>;
  getTimesheetById(id: string): Promise<Timesheet | undefined>;
  getTimesheetsByWorker(workerId: string): Promise<Timesheet[]>;
  getPendingTimesheets(): Promise<Timesheet[]>;
  approveTimesheet(id: string, approverId: string): Promise<void>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayments(): Promise<Payment[]>;
  getPaymentsByWorker(workerId: string): Promise<Payment[]>;
  updatePaymentStatus(id: string, status: "pending" | "processing" | "completed" | "failed"): Promise<void>;
  
  // Course operations
  getCourses(): Promise<Course[]>;
  getCourseById(id: string): Promise<Course | undefined>;
  createCourseCompletion(completion: InsertCourseCompletion): Promise<CourseCompletion>;
  getUserCourseCompletions(userId: string): Promise<CourseCompletion[]>;
  
  // Activity operations
  createActivity(activity: InsertActivity): Promise<Activity>;
  getRecentActivities(limit?: number): Promise<Activity[]>;
  
  // Dashboard stats
  getDashboardStats(): Promise<{
    activeJobs: number;
    totalWorkers: number;
    monthlyRevenue: number;
    completionRate: number;
  }>;
  
  // User management
  getUsersByRole(role: "admin" | "client" | "worker"): Promise<User[]>;
  updateUserKarmaCoins(userId: string, amount: number): Promise<void>;
  
  // Advanced functionality for new features
  getUserNotifications(userId: string): Promise<any[]>;
  markNotificationsAsRead(userId: string, notificationIds: string[]): Promise<void>;
  createNotification(notification: any): Promise<any>;
  getAvailableWorkers(skills?: string[]): Promise<User[]>;
  getShiftById(shiftId: string): Promise<Shift | undefined>;
  updateJob(jobId: string, updates: any): Promise<void>;
  updateShift(shiftId: string, updates: any): Promise<void>;
  
  // Recurring shifts
  createRecurringShift(recurring: any): Promise<any>;
  getRecurringShifts(): Promise<any[]>;
  generateShiftsFromRecurring(recurringId: string, weeks: number): Promise<{ count: number }>;
  
  // Worker availability
  getWorkerAvailability(workerId: string): Promise<any[]>;
  updateWorkerAvailability(workerId: string, availability: any[]): Promise<void>;
  checkSchedulingConflicts(workerId: string): Promise<any[]>;
  
  // Global Search
  searchJobs(query: string): Promise<Job[]>;
  searchWorkers(query: string): Promise<User[]>;
  searchClients(query: string): Promise<User[]>;
  searchTimesheets(query: string): Promise<Timesheet[]>;
  
  // Shift templates
  createShiftTemplate(template: any): Promise<any>;
  getShiftTemplates(): Promise<any[]>;
  deleteShiftTemplate(templateId: string): Promise<void>;
  
  // Analytics
  getSchedulingAnalytics(): Promise<any>;
  getWorkerUtilization(): Promise<any>;
  
  // Issue Detection operations
  createIssueAlert(alert: InsertIssueAlert): Promise<IssueAlert>;
  getIssueAlerts(status?: string): Promise<IssueAlert[]>;
  updateIssueAlert(id: string, updates: Partial<InsertIssueAlert>): Promise<void>;
  createIssueRecommendation(recommendation: InsertIssueRecommendation): Promise<IssueRecommendation>;
  getRecommendationsByAlert(alertId: string): Promise<IssueRecommendation[]>;
  createIssueAction(action: InsertIssueAction): Promise<IssueAction>;
  getActionsByAlert(alertId: string): Promise<IssueAction[]>;
  
  // Karma Coin operations
  getKarmaActivities(): Promise<any[]>;
  getKarmaRewards(): Promise<any[]>;
  getKarmaTransactions(userId: string, period?: string): Promise<any[]>;
  getKarmaStats(userId: string): Promise<any>;
  getKarmaLeaderboard(): Promise<any[]>;
  claimKarmaActivity(userId: string, activityId: string): Promise<{ success: boolean; newBalance: number }>;
  redeemKarmaReward(userId: string, rewardId: string): Promise<{ success: boolean; newBalance: number }>;
  updateUserKarmaBalance(userId: string, amount: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Database health monitoring
  async getDatabaseStatus() {
    return await checkDatabaseHealth();
  }

  // Query wrapper with performance tracking
  private async executeQuery<T>(queryFn: () => Promise<T>): Promise<T> {
    trackQuery();
    const start = Date.now();
    try {
      const result = await queryFn();
      const duration = Date.now() - start;
      if (duration > 1000) { // Log slow queries
        console.warn(`⚠️ Slow query detected: ${duration}ms`);
      }
      return result;
    } catch (error) {
      logger.error('💥 Database query failed:', error);
      throw error;
    }
  }
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Organization operations
  async createOrganization(organization: InsertOrganization): Promise<Organization> {
    const [org] = await db.insert(organizations).values(organization).returning();
    return org;
  }

  async getOrganizationsByOwner(ownerId: string): Promise<Organization[]> {
    return await db.select().from(organizations).where(eq(organizations.ownerId, ownerId));
  }

  // Job operations
  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db.insert(jobs).values(job).returning();
    return newJob;
  }

  async getJobs(): Promise<Job[]> {
    return await db.select().from(jobs).orderBy(desc(jobs.createdAt));
  }

  async getJobsByClient(clientId: string): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.clientId, clientId));
  }

  async getJobById(id: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async updateJobStatus(id: string, status: "active" | "closed" | "paused" | "draft"): Promise<void> {
    await db.update(jobs).set({ status }).where(eq(jobs.id, id));
  }

  // Shift operations
  async createShift(shift: InsertShift): Promise<Shift> {
    const [newShift] = await db.insert(shifts).values(shift).returning();
    return newShift;
  }

  async getShifts(filters?: Partial<Shift>): Promise<Shift[]> {
    if (!filters || Object.keys(filters).length === 0) {
      return await db.select().from(shifts).orderBy(desc(shifts.createdAt));
    }
    const conditions = Object.entries(filters)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => eq((shifts as any)[key], value));
    if (conditions.length === 0) {
      return await db.select().from(shifts).orderBy(desc(shifts.createdAt));
    }
    return await db.select().from(shifts).where(and(...conditions)).orderBy(desc(shifts.createdAt));
  }

  async getShiftsByJob(jobId: string): Promise<Shift[]> {
    return await db.select().from(shifts).where(eq(shifts.jobId, jobId));
  }

  async getShiftsByWorker(workerId: string): Promise<Shift[]> {
    return await db.select().from(shifts).where(eq(shifts.workerId, workerId));
  }

  async getShiftsByDateRange(startDate: string, endDate: string): Promise<any[]> {
    return await db.select({
      id: shifts.id,
      jobId: shifts.jobId,
      workerId: shifts.workerId,
      title: shifts.title,
      startTime: shifts.startTime,
      endTime: shifts.endTime,
      status: shifts.status,
      hourlyRate: shifts.hourlyRate,
      location: shifts.location,
      requirements: shifts.requirements,
      notes: shifts.notes,
      createdAt: shifts.createdAt,
      updatedAt: shifts.updatedAt,
      worker: {
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
      },
      job: {
        title: jobs.title,
      }
    })
    .from(shifts)
    .leftJoin(users, eq(shifts.workerId, users.id))
    .leftJoin(jobs, eq(shifts.jobId, jobs.id))
    .where(and(
      sql`DATE(${shifts.startTime}) >= ${startDate}`,
      sql`DATE(${shifts.startTime}) <= ${endDate}`
    ))
    .orderBy(shifts.startTime);
  }

  async updateShift(id: string, updates: Partial<InsertShift>): Promise<void> {
    await db.update(shifts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(shifts.id, id));
  }

  async deleteShift(id: string): Promise<void> {
    await db.delete(shifts).where(eq(shifts.id, id));
  }

  async updateShiftStatus(id: string, status: "draft" | "published" | "assigned" | "completed" | "cancelled"): Promise<void> {
    await db.update(shifts).set({ status }).where(eq(shifts.id, id));
  }

  // Timesheet operations
  async createTimesheet(timesheet: InsertTimesheet): Promise<Timesheet> {
    const [newTimesheet] = await db.insert(timesheets).values(timesheet).returning();
    return newTimesheet;
  }

  async getTimesheetsByWorker(workerId: string): Promise<Timesheet[]> {
    return await db.select().from(timesheets).where(eq(timesheets.workerId, workerId));
  }

  async getPendingTimesheets(): Promise<Timesheet[]> {
    return await db.select().from(timesheets).where(eq(timesheets.status, "pending"));
  }

  async getTimesheetById(id: string): Promise<Timesheet | undefined> {
    const [timesheet] = await db.select().from(timesheets).where(eq(timesheets.id, id));
    return timesheet;
  }

  async approveTimesheet(id: string, approverId: string): Promise<void> {
    await db.update(timesheets).set({ 
      status: "approved", 
      approvedBy: approverId 
    }).where(eq(timesheets.id, id));
  }

  // Payment operations
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async getPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async getPaymentsByWorker(workerId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.workerId, workerId));
  }

  async updatePaymentStatus(id: string, status: "pending" | "processing" | "completed" | "failed"): Promise<void> {
    await db.update(payments).set({ status }).where(eq(payments.id, id));
  }

  // Course operations
  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.isActive, true));
  }

  async getCourseById(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourseCompletion(completion: InsertCourseCompletion): Promise<CourseCompletion> {
    const [newCompletion] = await db.insert(courseCompletions).values(completion).returning();
    return newCompletion;
  }

  async getUserCourseCompletions(userId: string): Promise<CourseCompletion[]> {
    return await db.select().from(courseCompletions).where(eq(courseCompletions.userId, userId));
  }

  // Activity operations
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    return await db.select().from(activities)
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    activeJobs: number;
    totalWorkers: number;
    monthlyRevenue: number;
    completionRate: number;
  }> {
    const [activeJobsResult] = await db
      .select({ count: count() })
      .from(jobs)
      .where(eq(jobs.status, "active"));

    const [totalWorkersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "worker"));

    const [monthlyRevenueResult] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` 
      })
      .from(payments)
      .where(
        and(
          eq(payments.status, "completed"),
          sql`${payments.createdAt} >= date_trunc('month', current_date)`
        )
      );

    const [completedShifts] = await db
      .select({ count: count() })
      .from(shifts)
      .where(eq(shifts.status, "completed"));

    const [totalShifts] = await db
      .select({ count: count() })
      .from(shifts);

    const completionRate = totalShifts.count > 0 
      ? (completedShifts.count / totalShifts.count) * 100 
      : 0;

    return {
      activeJobs: activeJobsResult.count,
      totalWorkers: totalWorkersResult.count,
      monthlyRevenue: monthlyRevenueResult.total || 0,
      completionRate: Math.round(completionRate * 10) / 10,
    };
  }

  // User management
  async getUsersByRole(role: "admin" | "client" | "worker"): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async updateUserKarmaCoins(userId: string, amount: number): Promise<void> {
    await db.update(users)
      .set({ 
        karmaCoins: sql`${users.karmaCoins} + ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  // Advanced functionality implementations
  async getUserNotifications(userId: string): Promise<any[]> {
    // Return empty array for now - would implement with actual notifications table
    return [];
  }

  async markNotificationsAsRead(userId: string, notificationIds: string[]): Promise<void> {
    // Would implement with actual notifications table
    console.log(`Marking notifications as read for user ${userId}:`, notificationIds);
  }

  async createNotification(notification: any): Promise<any> {
    // Would implement with actual notifications table
    logger.info('Creating notification:', notification);
    return notification;
  }

  async getAvailableWorkers(skills?: string[]): Promise<User[]> {
    let query = db.select().from(users).where(eq(users.role, 'worker'));
    
    // If skills are specified, could filter by skills (would need skills field in schema)
    const workers = await query;
    return workers;
  }

  async getShiftById(shiftId: string): Promise<Shift | undefined> {
    const [shift] = await db.select().from(shifts).where(eq(shifts.id, shiftId));
    return shift;
  }

  async updateJob(jobId: string, updates: any): Promise<void> {
    await db.update(jobs).set(updates).where(eq(jobs.id, jobId));
  }

  // Recurring shifts operations
  async createRecurringShift(recurring: any): Promise<any> {
    return this.executeQuery(async () => {
      const [result] = await db.insert(recurringShifts).values(recurring).returning();
      return result;
    });
  }

  async getRecurringShifts(): Promise<any[]> {
    return this.executeQuery(async () => {
      return await db.select().from(recurringShifts).where(eq(recurringShifts.isActive, true));
    });
  }

  async generateShiftsFromRecurring(recurringId: string, weeks: number): Promise<{ count: number }> {
    return this.executeQuery(async () => {
      const [recurring] = await db.select().from(recurringShifts).where(eq(recurringShifts.id, recurringId));
      if (!recurring) throw new Error('Recurring shift not found');

      const newShifts = [];
      const today = new Date();
      
      for (let week = 0; week < weeks; week++) {
        for (const dayOfWeek of recurring.daysOfWeek) {
          const shiftDate = new Date(today);
          shiftDate.setDate(today.getDate() + (week * 7) + (dayOfWeek - today.getDay()));
          
          const [hours, minutes] = recurring.startTime.split(':').map(Number);
          const startTime = new Date(shiftDate);
          startTime.setHours(hours, minutes, 0, 0);
          
          const [endHours, endMinutes] = recurring.endTime.split(':').map(Number);
          const endTime = new Date(shiftDate);
          endTime.setHours(endHours, endMinutes, 0, 0);
          
          newShifts.push({
            jobId: recurring.jobId,
            title: recurring.title,
            startTime,
            endTime,
            status: 'published' as const,
            hourlyRate: recurring.hourlyRate,
            location: recurring.location,
            requirements: recurring.requirements,
            recurringShiftId: recurringId
          });
        }
      }
      
      await db.insert(shifts).values(newShifts);
      return { count: newShifts.length };
    });
  }

  // Worker availability operations
  async getWorkerAvailability(workerId: string): Promise<any[]> {
    return this.executeQuery(async () => {
      return await db.select().from(workerAvailability).where(eq(workerAvailability.workerId, workerId));
    });
  }

  async updateWorkerAvailability(workerId: string, availability: any[]): Promise<void> {
    return this.executeQuery(async () => {
      // Delete existing availability
      await db.delete(workerAvailability).where(eq(workerAvailability.workerId, workerId));
      
      // Insert new availability
      const availabilityData = availability.map(a => ({
        ...a,
        workerId
      }));
      
      if (availabilityData.length > 0) {
        await db.insert(workerAvailability).values(availabilityData);
      }
    });
  }

  async checkSchedulingConflicts(workerId: string): Promise<any[]> {
    return this.executeQuery(async () => {
      // Get worker's assigned shifts
      const workerShifts = await db.select().from(shifts).where(eq(shifts.workerId, workerId));
      
      // Get worker's availability
      const availability = await this.getWorkerAvailability(workerId);
      
      const conflicts = [];
      
      for (const shift of workerShifts) {
        const shiftDay = new Date(shift.startTime).getDay();
        const shiftStart = new Date(shift.startTime).toTimeString().slice(0, 5);
        const shiftEnd = new Date(shift.endTime).toTimeString().slice(0, 5);
        
        const dayAvailability = availability.find(a => a.dayOfWeek === shiftDay);
        
        if (!dayAvailability || !dayAvailability.isAvailable) {
          conflicts.push({
            shiftId: shift.id,
            shiftTitle: shift.title,
            startTime: shift.startTime,
            endTime: shift.endTime,
            reason: 'Worker not available on this day'
          });
        } else if (shiftStart < dayAvailability.startTime || shiftEnd > dayAvailability.endTime) {
          conflicts.push({
            shiftId: shift.id,
            shiftTitle: shift.title,
            startTime: shift.startTime,
            endTime: shift.endTime,
            reason: 'Shift outside available hours'
          });
        }
      }
      
      return conflicts;
    });
  }

  // Shift template operations
  async createShiftTemplate(template: any): Promise<any> {
    return this.executeQuery(async () => {
      const [result] = await db.insert(shiftTemplates).values(template).returning();
      return result;
    });
  }

  async getShiftTemplates(): Promise<any[]> {
    return this.executeQuery(async () => {
      return await db.select().from(shiftTemplates).where(eq(shiftTemplates.isActive, true));
    });
  }

  async deleteShiftTemplate(templateId: string): Promise<void> {
    return this.executeQuery(async () => {
      await db.update(shiftTemplates)
        .set({ isActive: false })
        .where(eq(shiftTemplates.id, templateId));
    });
  }

  // Analytics operations
  async getSchedulingAnalytics(): Promise<any> {
    return this.executeQuery(async () => {
      const totalShifts = await db.select({ count: count() }).from(shifts);
      const activeWorkers = await db.select({ count: count() }).from(users).where(eq(users.role, 'worker'));
      
      const shiftStatusCounts = await db.select({
        status: shifts.status,
        count: count()
      }).from(shifts).groupBy(shifts.status);
      
      const shiftStatusDistribution = shiftStatusCounts.map(s => ({
        name: s.status,
        value: s.count
      }));
      
      const assignedShifts = shiftStatusCounts.find(s => s.status === 'assigned')?.count || 0;
      const fillRate = totalShifts[0]?.count ? Math.round((assignedShifts / totalShifts[0].count) * 100) : 0;
      
      const weeklyTrends = [
        { week: 'Week 1', shiftsCreated: 45, shiftsAssigned: 42, shiftsCompleted: 38 },
        { week: 'Week 2', shiftsCreated: 52, shiftsAssigned: 48, shiftsCompleted: 45 },
        { week: 'Week 3', shiftsCreated: 48, shiftsAssigned: 46, shiftsCompleted: 43 },
        { week: 'Week 4', shiftsCreated: 55, shiftsAssigned: 52, shiftsCompleted: 49 },
      ];
      
      return {
        totalShifts: totalShifts[0]?.count || 0,
        activeWorkers: activeWorkers[0]?.count || 0,
        fillRate,
        weeklyCost: 12450,
        shiftStatusDistribution,
        weeklyTrends,
        complianceAlerts: []
      };
    });
  }

  async getWorkerUtilization(): Promise<any> {
    return this.executeQuery(async () => {
      const workers = await db.select().from(users).where(eq(users.role, 'worker'));
      
      const utilizationData = await Promise.all(workers.map(async (worker) => {
        const workerShifts = await db.select().from(shifts).where(eq(shifts.workerId, worker.id));
        const completedShifts = workerShifts.filter(s => s.status === 'completed').length;
        const totalHours = workerShifts.reduce((total, shift) => {
          const hours = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60);
          return total + hours;
        }, 0);
        
        return {
          ...worker,
          hoursThisWeek: Math.round(totalHours),
          shiftsCompleted: completedShifts,
          utilizationPercent: Math.min(Math.round((totalHours / 40) * 100), 100),
          isOverloaded: totalHours > 45
        };
      }));
      
      return { workers: utilizationData };
    });
  }

  // Issue Detection operations
  async createIssueAlert(alert: InsertIssueAlert): Promise<IssueAlert> {
    return this.executeQuery(async () => {
      const [result] = await db.insert(issueAlerts).values(alert).returning();
      return result;
    });
  }

  async getIssueAlerts(status?: string): Promise<IssueAlert[]> {
    return this.executeQuery(async () => {
      if (status) {
        return await db.select().from(issueAlerts).where(eq(issueAlerts.status, status as any));
      }
      return await db.select().from(issueAlerts).orderBy(desc(issueAlerts.createdAt));
    });
  }

  async updateIssueAlert(id: string, updates: Partial<InsertIssueAlert>): Promise<void> {
    return this.executeQuery(async () => {
      await db.update(issueAlerts)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(issueAlerts.id, id));
    });
  }

  async createIssueRecommendation(recommendation: InsertIssueRecommendation): Promise<IssueRecommendation> {
    return this.executeQuery(async () => {
      const [result] = await db.insert(issueRecommendations).values(recommendation).returning();
      return result;
    });
  }

  async getRecommendationsByAlert(alertId: string): Promise<IssueRecommendation[]> {
    return this.executeQuery(async () => {
      return await db.select().from(issueRecommendations).where(eq(issueRecommendations.alertId, alertId));
    });
  }

  async createIssueAction(action: InsertIssueAction): Promise<IssueAction> {
    return this.executeQuery(async () => {
      const [result] = await db.insert(issueActions).values(action).returning();
      return result;
    });
  }

  async getActionsByAlert(alertId: string): Promise<IssueAction[]> {
    return this.executeQuery(async () => {
      return await db.select().from(issueActions).where(eq(issueActions.alertId, alertId));
    });
  }

  // Global Search methods
  async searchJobs(query: string): Promise<Job[]> {
    return this.executeQuery(async () => {
      const searchPattern = `%${query.toLowerCase()}%`;
      return await db.select().from(jobs).where(
        sql`LOWER(${jobs.title}) LIKE ${searchPattern} OR LOWER(${jobs.description}) LIKE ${searchPattern} OR LOWER(${jobs.location}) LIKE ${searchPattern}`
      ).limit(10);
    });
  }

  async searchWorkers(query: string): Promise<User[]> {
    return this.executeQuery(async () => {
      const searchPattern = `%${query.toLowerCase()}%`;
      return await db.select().from(users).where(
        and(
          eq(users.role, 'worker'),
          sql`LOWER(${users.firstName}) LIKE ${searchPattern} OR LOWER(${users.lastName}) LIKE ${searchPattern} OR LOWER(${users.email}) LIKE ${searchPattern}`
        )
      ).limit(10);
    });
  }

  async searchClients(query: string): Promise<User[]> {
    return this.executeQuery(async () => {
      const searchPattern = `%${query.toLowerCase()}%`;
      return await db.select().from(users).where(
        and(
          eq(users.role, 'client'),
          sql`LOWER(${users.firstName}) LIKE ${searchPattern} OR LOWER(${users.lastName}) LIKE ${searchPattern} OR LOWER(${users.email}) LIKE ${searchPattern}`
        )
      ).limit(10);
    });
  }

  async searchTimesheets(query: string): Promise<Timesheet[]> {
    return this.executeQuery(async () => {
      const searchPattern = `%${query.toLowerCase()}%`;
      return await db.select().from(timesheets).where(
        sql`${timesheets.workerId} LIKE ${searchPattern} OR ${timesheets.id} LIKE ${searchPattern}`
      ).limit(10);
    });
  }

  // Karma Coin operations
  async getKarmaActivities(): Promise<KarmaActivity[]> {
    return this.executeQuery(async () => {
      return await db.select().from(karmaActivities).where(eq(karmaActivities.isActive, true));
    });
  }

  async getKarmaRewards(): Promise<KarmaReward[]> {
    return this.executeQuery(async () => {
      return await db.select().from(karmaRewards).where(eq(karmaRewards.isActive, true));
    });
  }

  async getKarmaTransactions(userId: string, period?: string): Promise<KarmaTransaction[]> {
    return this.executeQuery(async () => {
      let conditions = [eq(karmaTransactions.userId, userId)];
      
      if (period === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        conditions.push(sql`${karmaTransactions.createdAt} >= ${weekAgo.toISOString()}`);
      } else if (period === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        conditions.push(sql`${karmaTransactions.createdAt} >= ${monthAgo.toISOString()}`);
      }
      
      return await db.select().from(karmaTransactions)
        .where(and(...conditions))
        .orderBy(desc(karmaTransactions.createdAt))
        .limit(100);
    });
  }

  async getKarmaStats(userId: string): Promise<any> {
    return this.executeQuery(async () => {
      const user = await this.getUser(userId);
      const transactions = await this.getKarmaTransactions(userId);
      
      const totalEarned = transactions
        .filter(t => t.type === 'earned')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalSpent = transactions
        .filter(t => t.type === 'spent')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const weeklyEarned = transactions
        .filter(t => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return t.type === 'earned' && new Date(t.createdAt!) >= weekAgo;
        })
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthlyEarned = transactions
        .filter(t => {
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return t.type === 'earned' && new Date(t.createdAt!) >= monthAgo;
        })
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Get rank
      const allUsers = await db.select({ id: users.id, karmaCoins: users.karmaCoins })
        .from(users)
        .orderBy(desc(users.karmaCoins));
      
      const rank = allUsers.findIndex(u => u.id === userId) + 1;
      
      return {
        balance: user?.karmaCoins || 0,
        totalEarned,
        totalSpent,
        weeklyEarned,
        monthlyEarned,
        rank,
        totalUsers: allUsers.length,
      };
    });
  }

  async getKarmaLeaderboard(): Promise<any[]> {
    return this.executeQuery(async () => {
      const topUsers = await db.select({
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        karmaCoins: users.karmaCoins,
        profileImageUrl: users.profileImageUrl,
      })
        .from(users)
        .orderBy(desc(users.karmaCoins))
        .limit(10);
      
      return topUsers.map((user, index) => ({
        rank: index + 1,
        ...user,
        weeklyEarned: 0, // Would need to calculate from transactions
      }));
    });
  }

  async claimKarmaActivity(userId: string, activityId: string): Promise<{ success: boolean; newBalance: number }> {
    return this.executeQuery(async () => {
      const activity = await db.select().from(karmaActivities)
        .where(eq(karmaActivities.id, activityId))
        .limit(1);
      
      if (!activity || activity.length === 0) {
        return { success: false, newBalance: 0 };
      }
      
      const reward = activity[0].reward;
      const user = await this.getUser(userId);
      const newBalance = (user?.karmaCoins || 0) + reward;
      
      // Update user balance
      await db.update(users)
        .set({ karmaCoins: newBalance })
        .where(eq(users.id, userId));
      
      // Create transaction record
      const transaction: InsertKarmaTransaction = {
        userId,
        type: 'earned',
        amount: reward,
        description: `Earned ${reward} coins for "${activity[0].name}"`,
        category: activity[0].category,
        activityId,
      };
      
      await db.insert(karmaTransactions).values(transaction);
      
      return { success: true, newBalance };
    });
  }

  async redeemKarmaReward(userId: string, rewardId: string): Promise<{ success: boolean; newBalance: number }> {
    return this.executeQuery(async () => {
      const reward = await db.select().from(karmaRewards)
        .where(eq(karmaRewards.id, rewardId))
        .limit(1);
      
      if (!reward || reward.length === 0) {
        return { success: false, newBalance: 0 };
      }
      
      const cost = reward[0].cost;
      const user = await this.getUser(userId);
      const currentBalance = user?.karmaCoins || 0;
      
      if (currentBalance < cost) {
        return { success: false, newBalance: currentBalance };
      }
      
      const newBalance = currentBalance - cost;
      
      // Update user balance
      await db.update(users)
        .set({ karmaCoins: newBalance })
        .where(eq(users.id, userId));
      
      // Update reward claimed count
      await db.update(karmaRewards)
        .set({ claimed: reward[0].claimed + 1 })
        .where(eq(karmaRewards.id, rewardId));
      
      // Create transaction record
      const transaction: InsertKarmaTransaction = {
        userId,
        type: 'spent',
        amount: cost,
        description: `Redeemed "${reward[0].name}"`,
        category: reward[0].category,
        rewardId,
      };
      
      await db.insert(karmaTransactions).values(transaction);
      
      return { success: true, newBalance };
    });
  }

  async updateUserKarmaBalance(userId: string, amount: number): Promise<void> {
    return this.executeQuery(async () => {
      const user = await this.getUser(userId);
      const newBalance = (user?.karmaCoins || 0) + amount;
      
      await db.update(users)
        .set({ karmaCoins: Math.max(0, newBalance) })
        .where(eq(users.id, userId));
    });
  }
}

export const storage = new DatabaseStorage();
