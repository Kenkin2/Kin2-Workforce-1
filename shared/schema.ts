import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"), // For local authentication
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["admin", "client", "worker"] }).notNull().default("worker"),
  karmaCoins: integer("karma_coins").notNull().default(0),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_users_email").on(table.email),
  index("idx_users_role").on(table.role),
]);

export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_organizations_owner_id").on(table.ownerId),
]);

// GDPR Compliance Tables
export const gdprConsents = pgTable("gdpr_consents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  consentType: varchar("consent_type", { 
    enum: ["necessary", "analytics", "marketing", "functional", "data_processing"] 
  }).notNull(),
  granted: boolean("granted").notNull(),
  grantedAt: timestamp("granted_at").defaultNow(),
  revokedAt: timestamp("revoked_at"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  legalBasis: varchar("legal_basis", {
    enum: ["consent", "contract", "legal_obligation", "vital_interests", "public_task", "legitimate_interests"]
  }).notNull(),
  purpose: text("purpose").notNull(),
  dataCategories: text("data_categories").array(),
  retentionPeriod: integer("retention_period_days"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const gdprDataProcessingLogs = pgTable("gdpr_data_processing_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  activity: varchar("activity", {
    enum: ["data_access", "data_export", "data_deletion", "data_rectification", "data_processing", "data_transfer"]
  }).notNull(),
  dataTypes: text("data_types").array(),
  purpose: text("purpose").notNull(),
  legalBasis: varchar("legal_basis").notNull(),
  processingLocation: varchar("processing_location"),
  thirdPartyRecipients: text("third_party_recipients").array(),
  retentionPeriod: integer("retention_period_days"),
  automatedDecisionMaking: boolean("automated_decision_making").default(false),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  requestedBy: varchar("requested_by"), // user or admin
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gdprDataRequests = pgTable("gdpr_data_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  requestType: varchar("request_type", {
    enum: ["access", "portability", "rectification", "erasure", "restrict_processing", "object_processing"]
  }).notNull(),
  status: varchar("status", {
    enum: ["pending", "in_progress", "completed", "rejected", "partially_completed"]
  }).notNull().default("pending"),
  requestDetails: jsonb("request_details"),
  responseData: jsonb("response_data"),
  completedAt: timestamp("completed_at"),
  dueDate: timestamp("due_date").notNull(), // 30 days from request
  rejectionReason: text("rejection_reason"),
  verificationMethod: varchar("verification_method"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const gdprDataRetention = pgTable("gdpr_data_retention", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dataType: varchar("data_type").notNull(),
  tableName: varchar("table_name").notNull(),
  retentionPeriodDays: integer("retention_period_days").notNull(),
  legalBasis: varchar("legal_basis").notNull(),
  purpose: text("purpose").notNull(),
  autoDelete: boolean("auto_delete").notNull().default(true),
  lastProcessedAt: timestamp("last_processed_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const gdprCookieConsents = pgTable("gdpr_cookie_consents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  sessionId: varchar("session_id"),
  necessary: boolean("necessary").notNull().default(true),
  analytics: boolean("analytics").notNull().default(false),
  marketing: boolean("marketing").notNull().default(false),
  functional: boolean("functional").notNull().default(false),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  consentVersion: varchar("consent_version").notNull().default("1.0"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  location: varchar("location"),
  salary: decimal("salary", { precision: 10, scale: 2 }),
  jobType: varchar("job_type", { enum: ["full-time", "part-time", "contract", "temporary"] }).notNull(),
  status: varchar("status", { enum: ["active", "closed", "paused", "draft"] }).notNull().default("draft"),
  clientId: varchar("client_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'set null' }),
  requiredSkills: text("required_skills").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_jobs_status").on(table.status),
  index("idx_jobs_client_id").on(table.clientId),
  index("idx_jobs_organization_id").on(table.organizationId),
]);

export const shifts = pgTable("shifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  workerId: varchar("worker_id").references(() => users.id, { onDelete: 'set null' }),
  title: varchar("title").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: varchar("status", { enum: ["draft", "published", "assigned", "completed", "cancelled"] }).notNull().default("draft"),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  location: varchar("location"),
  requirements: text("requirements"),
  notes: text("notes"),
  recurringShiftId: varchar("recurring_shift_id").references(() => recurringShifts.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_shifts_job_id").on(table.jobId),
  index("idx_shifts_worker_id").on(table.workerId),
  index("idx_shifts_status").on(table.status),
  index("idx_shifts_start_time").on(table.startTime),
]);

// Recurring shift templates
export const recurringShifts = pgTable("recurring_shifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  title: varchar("title").notNull(),
  startTime: varchar("start_time").notNull(), // "09:00"
  endTime: varchar("end_time").notNull(), // "17:00"
  daysOfWeek: integer("days_of_week").array().notNull(), // [1,2,3,4,5] for Mon-Fri
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  location: varchar("location"),
  requirements: text("requirements"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Worker availability
export const workerAvailability = pgTable("worker_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workerId: varchar("worker_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday, etc.
  startTime: varchar("start_time").notNull(),
  endTime: varchar("end_time").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shift templates
export const shiftTemplates = pgTable("shift_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  duration: integer("duration").notNull(), // in hours
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  requirements: text("requirements"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const timesheets = pgTable("timesheets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shiftId: varchar("shift_id").notNull().references(() => shifts.id, { onDelete: 'cascade' }),
  workerId: varchar("worker_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  clockIn: timestamp("clock_in"),
  clockOut: timestamp("clock_out"),
  hoursWorked: decimal("hours_worked", { precision: 10, scale: 2 }),
  breakDuration: integer("break_duration").default(0), // in minutes
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  approvedBy: varchar("approved_by").references(() => users.id, { onDelete: 'set null' }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_timesheets_worker_id").on(table.workerId),
  index("idx_timesheets_shift_id").on(table.shiftId),
  index("idx_timesheets_status").on(table.status),
]);

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workerId: varchar("worker_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  timesheetId: varchar("timesheet_id").references(() => timesheets.id, { onDelete: 'set null' }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  status: varchar("status", { enum: ["pending", "processing", "completed", "failed"] }).notNull().default("pending"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_payments_worker_id").on(table.workerId),
  index("idx_payments_status").on(table.status),
  index("idx_payments_timesheet_id").on(table.timesheetId),
]);

export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  content: text("content"),
  karmaReward: integer("karma_reward").notNull().default(50),
  duration: integer("duration"), // in minutes
  difficulty: varchar("difficulty", { enum: ["beginner", "intermediate", "advanced"] }).notNull().default("beginner"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const courseCompletions = pgTable("course_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  completedAt: timestamp("completed_at").defaultNow(),
  score: integer("score"), // percentage
  certificateUrl: varchar("certificate_url"),
});

// Comprehensive Education System

// Educational qualifications and certifications
export const qualifications = pgTable("qualifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  qualificationType: varchar("qualification_type", {
    enum: ["gcse", "a_level", "btec", "nvq", "degree", "masters", "phd", "apprenticeship", "professional_certification", "government_scheme"]
  }).notNull(),
  qualificationName: varchar("qualification_name").notNull(),
  institutionName: varchar("institution_name").notNull(),
  subjectArea: varchar("subject_area"),
  level: integer("level"), // 1-8 for NQF levels
  grade: varchar("grade"),
  startDate: timestamp("start_date"),
  completionDate: timestamp("completion_date"),
  expiryDate: timestamp("expiry_date"),
  certificateNumber: varchar("certificate_number"),
  certificateUrl: varchar("certificate_url"),
  verificationStatus: varchar("verification_status", {
    enum: ["pending", "verified", "failed", "expired"]
  }).notNull().default("pending"),
  verifiedBy: varchar("verified_by").references(() => users.id, { onDelete: 'set null' }),
  verifiedAt: timestamp("verified_at"),
  governmentSchemeId: varchar("government_scheme_id").references(() => governmentProgrammes.id, { onDelete: 'set null' }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Government education and training programmes
export const governmentProgrammes = pgTable("government_programmes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  programmeName: varchar("programme_name").notNull(),
  programmeType: varchar("programme_type", {
    enum: ["apprenticeship", "traineeship", "kickstart", "skills_bootcamp", "adult_education_budget", "advanced_learner_loan", "careers_guidance", "sector_work_academy"]
  }).notNull(),
  description: text("description"),
  provider: varchar("provider").notNull(),
  fundingBody: varchar("funding_body", {
    enum: ["education_skills_funding_agency", "department_for_work_pensions", "department_for_education", "local_authority", "sector_skills_council"]
  }).notNull(),
  eligibilityCriteria: jsonb("eligibility_criteria"),
  fundingAmount: decimal("funding_amount", { precision: 10, scale: 2 }),
  duration: integer("duration_weeks"),
  level: integer("level"), // NQF level
  sectorArea: varchar("sector_area"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  applicationDeadline: timestamp("application_deadline"),
  maxParticipants: integer("max_participants"),
  currentParticipants: integer("current_participants").default(0),
  contactEmail: varchar("contact_email"),
  contactPhone: varchar("contact_phone"),
  websiteUrl: varchar("website_url"),
  applicationUrl: varchar("application_url"),
  status: varchar("status", {
    enum: ["draft", "open", "closed", "full", "completed", "cancelled"]
  }).notNull().default("draft"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User participation in government programmes
export const programmeParticipations = pgTable("programme_participations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  programmeId: varchar("programme_id").notNull().references(() => governmentProgrammes.id, { onDelete: 'cascade' }),
  applicationDate: timestamp("application_date").defaultNow(),
  status: varchar("status", {
    enum: ["applied", "accepted", "rejected", "waitlisted", "in_progress", "completed", "withdrawn", "failed"]
  }).notNull().default("applied"),
  startDate: timestamp("start_date"),
  completionDate: timestamp("completion_date"),
  progressPercentage: integer("progress_percentage").default(0),
  mentorId: varchar("mentor_id").references(() => users.id, { onDelete: 'set null' }),
  employerId: varchar("employer_id").references(() => users.id, { onDelete: 'set null' }),
  assessmentResults: jsonb("assessment_results"),
  certificateIssued: boolean("certificate_issued").default(false),
  certificateUrl: varchar("certificate_url"),
  fundingReceived: decimal("funding_received", { precision: 10, scale: 2 }),
  outcomes: jsonb("outcomes"), // Employment outcomes, progression
  feedbackRating: integer("feedback_rating"), // 1-5
  feedbackComments: text("feedback_comments"),
  withdrawalReason: text("withdrawal_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Skills and competencies framework
export const skillsFramework = pgTable("skills_framework", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  skillName: varchar("skill_name").notNull(),
  skillCategory: varchar("skill_category", {
    enum: ["technical", "digital", "communication", "leadership", "problem_solving", "teamwork", "customer_service", "health_safety", "compliance"]
  }).notNull(),
  description: text("description"),
  level: integer("level"), // 1-5 proficiency level
  industryStandard: varchar("industry_standard"), // e.g., "City & Guilds", "NCFE"
  evidenceRequired: text("evidence_required"),
  assessmentCriteria: jsonb("assessment_criteria"),
  renewalPeriod: integer("renewal_period_months"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User skills assessments and endorsements
export const userSkills = pgTable("user_skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  skillId: varchar("skill_id").notNull().references(() => skillsFramework.id, { onDelete: 'cascade' }),
  proficiencyLevel: integer("proficiency_level").notNull(), // 1-5
  assessedBy: varchar("assessed_by"), // Self, supervisor, external assessor
  assessmentDate: timestamp("assessment_date").defaultNow(),
  evidenceUrl: varchar("evidence_url"),
  endorsedBy: varchar("endorsed_by"), // Manager/supervisor who endorsed
  endorsedAt: timestamp("endorsed_at"),
  lastReviewDate: timestamp("last_review_date"),
  nextReviewDate: timestamp("next_review_date"),
  isVerified: boolean("is_verified").default(false),
  verificationDate: timestamp("verification_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Professional development plans
export const developmentPlans = pgTable("development_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  planName: varchar("plan_name").notNull(),
  description: text("description"),
  objectives: jsonb("objectives"),
  targetCompletionDate: timestamp("target_completion_date"),
  status: varchar("status", {
    enum: ["draft", "active", "on_hold", "completed", "cancelled"]
  }).notNull().default("draft"),
  progressPercentage: integer("progress_percentage").default(0),
  assignedBy: varchar("assigned_by").references(() => users.id, { onDelete: 'set null' }),
  reviewedBy: varchar("reviewed_by").references(() => users.id, { onDelete: 'set null' }),
  lastReviewDate: timestamp("last_review_date"),
  nextReviewDate: timestamp("next_review_date"),
  budgetAllocated: decimal("budget_allocated", { precision: 10, scale: 2 }),
  budgetSpent: decimal("budget_spent", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Learning pathways and career progression
export const learningPathways = pgTable("learning_pathways", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pathwayName: varchar("pathway_name").notNull(),
  description: text("description"),
  industry: varchar("industry"),
  careerLevel: varchar("career_level", {
    enum: ["entry", "junior", "mid", "senior", "lead", "executive"]
  }).notNull(),
  prerequisites: jsonb("prerequisites"),
  learningObjectives: jsonb("learning_objectives"),
  estimatedDuration: integer("estimated_duration_weeks"),
  difficulty: varchar("difficulty", {
    enum: ["beginner", "intermediate", "advanced", "expert"]
  }).notNull(),
  pathwaySteps: jsonb("pathway_steps"), // Ordered list of courses/qualifications
  governmentFunding: boolean("government_funding").default(false),
  fundingDetails: jsonb("funding_details"),
  employmentOutcomes: jsonb("employment_outcomes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User progress through learning pathways
export const pathwayProgress = pgTable("pathway_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  pathwayId: varchar("pathway_id").notNull().references(() => learningPathways.id, { onDelete: 'cascade' }),
  currentStep: integer("current_step").default(1),
  completedSteps: integer("completed_steps").default(0),
  totalSteps: integer("total_steps").notNull(),
  progressPercentage: integer("progress_percentage").default(0),
  startDate: timestamp("start_date").defaultNow(),
  estimatedCompletionDate: timestamp("estimated_completion_date"),
  actualCompletionDate: timestamp("actual_completion_date"),
  status: varchar("status", {
    enum: ["not_started", "in_progress", "on_hold", "completed", "abandoned"]
  }).notNull().default("not_started"),
  mentorId: varchar("mentor_id").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// External provider integration (colleges, training providers)
export const educationProviders = pgTable("education_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerName: varchar("provider_name").notNull(),
  providerType: varchar("provider_type", {
    enum: ["university", "college", "training_provider", "apprenticeship_provider", "online_platform", "professional_body"]
  }).notNull(),
  accreditationBody: varchar("accreditation_body"),
  ofstedRating: varchar("ofsted_rating", {
    enum: ["outstanding", "good", "requires_improvement", "inadequate"]
  }),
  contactDetails: jsonb("contact_details"),
  coursesOffered: jsonb("courses_offered"),
  apiEndpoint: varchar("api_endpoint"),
  apiKey: varchar("api_key"),
  integrationStatus: varchar("integration_status", {
    enum: ["not_integrated", "pending", "active", "suspended", "failed"]
  }).notNull().default("not_integrated"),
  lastSyncDate: timestamp("last_sync_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar("type").notNull(), // job_posted, timesheet_submitted, course_completed, etc.
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Karma Coin System Tables
export const karmaActivities = pgTable("karma_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  reward: integer("reward").notNull(), // Amount of karma coins awarded
  category: varchar("category", {
    enum: ["learning", "performance", "social", "attendance", "achievement"]
  }).notNull(),
  difficulty: varchar("difficulty", {
    enum: ["easy", "medium", "hard"]
  }).notNull().default("medium"),
  requirements: text("requirements").array(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const karmaRewards = pgTable("karma_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  cost: integer("cost").notNull(), // Karma coins required
  category: varchar("category", {
    enum: ["benefits", "recognition", "experiences", "merchandise"]
  }).notNull(),
  availability: integer("availability").notNull().default(0), // Total available
  claimed: integer("claimed").notNull().default(0), // Total claimed
  imageUrl: varchar("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const karmaTransactions = pgTable("karma_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar("type", {
    enum: ["earned", "spent"]
  }).notNull(),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull(),
  activityId: varchar("activity_id").references(() => karmaActivities.id, { onDelete: 'set null' }),
  rewardId: varchar("reward_id").references(() => karmaRewards.id, { onDelete: 'set null' }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_karma_transactions_user_id").on(table.userId),
  index("idx_karma_transactions_type").on(table.type),
  index("idx_karma_transactions_created_at").on(table.createdAt),
]);

// Payroll and Tax Information
export const payrollRecords = pgTable("payroll_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workerId: varchar("worker_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  payPeriodStart: timestamp("pay_period_start").notNull(),
  payPeriodEnd: timestamp("pay_period_end").notNull(),
  grossPay: decimal("gross_pay", { precision: 10, scale: 2 }).notNull(),
  taxDeduction: decimal("tax_deduction", { precision: 10, scale: 2 }).notNull().default("0"),
  niDeduction: decimal("ni_deduction", { precision: 10, scale: 2 }).notNull().default("0"),
  pensionDeduction: decimal("pension_deduction", { precision: 10, scale: 2 }).notNull().default("0"),
  otherDeductions: decimal("other_deductions", { precision: 10, scale: 2 }).notNull().default("0"),
  netPay: decimal("net_pay", { precision: 10, scale: 2 }).notNull(),
  payslipGenerated: boolean("payslip_generated").notNull().default(false),
  payslipUrl: varchar("payslip_url"),
  hmrcReported: boolean("hmrc_reported").notNull().default(false),
  hmrcReportedAt: timestamp("hmrc_reported_at"),
  status: varchar("status", { enum: ["draft", "calculated", "approved", "paid"] }).notNull().default("draft"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Worker Tax Information for HMRC compliance
export const workerTaxInfo = pgTable("worker_tax_info", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workerId: varchar("worker_id").notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  niNumber: varchar("ni_number"),
  taxCode: varchar("tax_code").notNull().default("1257L"),
  dateOfBirth: timestamp("date_of_birth"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  address: text("address"),
  postcode: varchar("postcode"),
  gender: varchar("gender", { enum: ["M", "F", "X"] }),
  studentLoan: boolean("student_loan").notNull().default(false),
  studentLoanPlan: varchar("student_loan_plan", { enum: ["1", "2", "4", "postgrad"] }),
  pensionScheme: boolean("pension_scheme").notNull().default(false),
  pensionRate: decimal("pension_rate", { precision: 5, scale: 2 }).default("3.00"), // percentage
  directorsNi: boolean("directors_ni").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// HMRC Submission Records
export const hmrcSubmissions = pgTable("hmrc_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionType: varchar("submission_type", { 
    enum: ["rti_fps", "rti_eps", "p45", "p60", "annual_return"] 
  }).notNull(),
  taxYear: varchar("tax_year").notNull(), // "2024-25"
  payPeriod: varchar("pay_period").notNull(), // "2024-01" for monthly
  employerReference: varchar("employer_reference").notNull(),
  submissionData: jsonb("submission_data").notNull(),
  csvData: text("csv_data"),
  submittedAt: timestamp("submitted_at"),
  status: varchar("status", { 
    enum: ["draft", "ready", "submitted", "accepted", "rejected"] 
  }).notNull().default("draft"),
  hmrcReference: varchar("hmrc_reference"),
  errorDetails: text("error_details"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Report Templates
export const reportTemplates = pgTable("report_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: varchar("type", { 
    enum: ["payroll", "hmrc", "timesheet", "payments", "tax_summary", "custom"] 
  }).notNull(),
  description: text("description"),
  fields: jsonb("fields").notNull(), // column definitions
  filters: jsonb("filters"), // default filter settings
  formatting: jsonb("formatting"), // styling and layout
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Generated Reports
export const generatedReports = pgTable("generated_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => reportTemplates.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(),
  type: varchar("type", { 
    enum: ["csv", "pdf", "excel", "json"] 
  }).notNull().default("csv"),
  parameters: jsonb("parameters"), // filters used
  fileUrl: varchar("file_url"),
  fileSize: integer("file_size"), // bytes
  recordCount: integer("record_count"),
  generatedBy: varchar("generated_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  downloadCount: integer("download_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pricing Plans
export const pricingPlans = pgTable("pricing_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // "Starter", "Professional", "Enterprise"
  description: text("description"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(), // per employee per month
  setupFee: decimal("setup_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  features: jsonb("features").notNull(), // array of feature objects
  maxEmployees: integer("max_employees"), // null for unlimited
  billingCycle: varchar("billing_cycle", { enum: ["monthly", "annual"] }).notNull().default("monthly"),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  stripePriceId: varchar("stripe_price_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organization Subscriptions
export const organizationSubscriptions = pgTable("organization_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  planId: varchar("plan_id").notNull().references(() => pricingPlans.id, { onDelete: 'cascade' }),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  stripeCustomerId: varchar("stripe_customer_id"),
  status: varchar("status", { 
    enum: ["trial", "active", "past_due", "cancelled", "unpaid", "incomplete"] 
  }).notNull().default("trial"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  employeeCount: integer("employee_count").notNull().default(1),
  monthlyUsage: jsonb("monthly_usage"), // usage metrics for billing
  lastBilledAt: timestamp("last_billed_at"),
  nextBillDate: timestamp("next_bill_date"),
  autoRenewal: boolean("auto_renewal").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Usage Tracking for Per-Employee Billing
export const usageMetrics = pgTable("usage_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  subscriptionId: varchar("subscription_id").notNull().references(() => organizationSubscriptions.id, { onDelete: 'cascade' }),
  metricType: varchar("metric_type", { 
    enum: ["active_employees", "time_entries", "reports_generated", "api_calls", "storage_gb"] 
  }).notNull(),
  metricValue: decimal("metric_value", { precision: 15, scale: 2 }).notNull(),
  billingPeriod: varchar("billing_period").notNull(), // "2025-01"
  recordedAt: timestamp("recorded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pricing Rules for Dynamic Pricing
export const pricingRules = pgTable("pricing_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planId: varchar("plan_id").notNull().references(() => pricingPlans.id, { onDelete: 'cascade' }),
  ruleName: varchar("rule_name").notNull(),
  condition: jsonb("condition").notNull(), // { type: "employee_count", operator: ">=", value: 100 }
  action: jsonb("action").notNull(), // { type: "discount", value: 15 } or { type: "price_override", value: 25.99 }
  isActive: boolean("is_active").notNull().default(true),
  priority: integer("priority").notNull().default(0), // higher priority rules processed first
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Billing History
export const billingHistory = pgTable("billing_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  subscriptionId: varchar("subscription_id").notNull().references(() => organizationSubscriptions.id, { onDelete: 'cascade' }),
  planId: varchar("plan_id").notNull().references(() => pricingPlans.id, { onDelete: 'cascade' }),
  billingPeriod: varchar("billing_period").notNull(), // "2025-01"
  employeeCount: integer("employee_count").notNull(),
  baseAmount: decimal("base_amount", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  stripeInvoiceId: varchar("stripe_invoice_id"),
  paidAt: timestamp("paid_at"),
  status: varchar("status", { 
    enum: ["pending", "paid", "failed", "refunded", "disputed"] 
  }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Government & Social Benefits Tables
export const universalCreditClients = pgTable("universal_credit_clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  niNumber: varchar("ni_number").notNull(), // National Insurance Number
  universalCreditNumber: varchar("uc_number"), // UC Reference Number
  claimStatus: varchar("claim_status", { 
    enum: ["active", "pending", "suspended", "closed", "under_review"] 
  }).notNull().default("pending"),
  workCoachName: varchar("work_coach_name"),
  workCoachContact: varchar("work_coach_contact"),
  jobCentreOffice: varchar("job_centre_office"),
  claimStartDate: timestamp("claim_start_date"),
  monthlyEntitlement: decimal("monthly_entitlement", { precision: 10, scale: 2 }),
  workAllowance: decimal("work_allowance", { precision: 10, scale: 2 }),
  earnings: decimal("earnings", { precision: 10, scale: 2 }).notNull().default("0"),
  workingTaxCredit: decimal("working_tax_credit", { precision: 10, scale: 2 }).notNull().default("0"),
  housingCosts: decimal("housing_costs", { precision: 10, scale: 2 }).notNull().default("0"),
  childcareSupport: decimal("childcare_support", { precision: 10, scale: 2 }).notNull().default("0"),
  conditionsAndCommitments: jsonb("conditions_commitments"), // Work search requirements
  lastAssessmentDate: timestamp("last_assessment_date"),
  nextAssessmentDate: timestamp("next_assessment_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const socialBenefitsClients = pgTable("social_benefits_clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  benefitType: varchar("benefit_type", { 
    enum: [
      "universal_credit", "housing_benefit", "council_tax_support", 
      "child_benefit", "child_tax_credit", "working_tax_credit", "pip", 
      "esa", "jsa", "pension_credit", "carers_allowance", "dla"
    ] 
  }).notNull(),
  applicationReference: varchar("application_reference"),
  claimStatus: varchar("claim_status", { 
    enum: ["active", "pending", "approved", "denied", "suspended", "under_review", "appealing"] 
  }).notNull().default("pending"),
  weeklyAmount: decimal("weekly_amount", { precision: 10, scale: 2 }),
  monthlyAmount: decimal("monthly_amount", { precision: 10, scale: 2 }),
  paymentSchedule: varchar("payment_schedule", { enum: ["weekly", "fortnightly", "monthly"] }),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  renewalDate: timestamp("renewal_date"),
  conditions: jsonb("conditions"), // Eligibility conditions and requirements
  supportingDocuments: jsonb("supporting_documents"), // Document references
  appealDeadline: timestamp("appeal_deadline"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const benefitPayments = pgTable("benefit_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  benefitType: varchar("benefit_type").notNull(),
  claimId: varchar("claim_id"), // Reference to UC or other benefit claim
  paymentReference: varchar("payment_reference").notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { enum: ["bacs", "faster_payment", "cheque"] }).notNull().default("bacs"),
  assessmentPeriod: varchar("assessment_period"), // UC assessment period
  earningsDeduction: decimal("earnings_deduction", { precision: 10, scale: 2 }).notNull().default("0"),
  housingElement: decimal("housing_element", { precision: 10, scale: 2 }).notNull().default("0"),
  standardAllowance: decimal("standard_allowance", { precision: 10, scale: 2 }).notNull().default("0"),
  childElement: decimal("child_element", { precision: 10, scale: 2 }).notNull().default("0"),
  disabilityElement: decimal("disability_element", { precision: 10, scale: 2 }).notNull().default("0"),
  carerElement: decimal("carer_element", { precision: 10, scale: 2 }).notNull().default("0"),
  workCapabilityElement: decimal("work_capability_element", { precision: 10, scale: 2 }).notNull().default("0"),
  deductions: jsonb("deductions"), // Advance repayments, sanctions, etc.
  status: varchar("status", { enum: ["scheduled", "paid", "failed", "returned"] }).notNull().default("scheduled"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workSearchRequirements = pgTable("work_search_requirements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  claimId: varchar("claim_id").notNull().references(() => universalCreditClients.id, { onDelete: 'cascade' }),
  weeklyHoursRequired: integer("weekly_hours_required").notNull().default(35),
  jobSearchActivities: jsonb("job_search_activities"), // Required activities
  skillsTrainingRequired: jsonb("skills_training_required"),
  workTrialExemptions: jsonb("work_trial_exemptions"),
  sanctionStatus: varchar("sanction_status", { 
    enum: ["none", "warning", "sanctioned", "appeal_pending"] 
  }).notNull().default("none"),
  sanctionReason: text("sanction_reason"),
  sanctionStartDate: timestamp("sanction_start_date"),
  sanctionEndDate: timestamp("sanction_end_date"),
  complianceScore: integer("compliance_score").notNull().default(100), // 0-100
  lastReviewDate: timestamp("last_review_date"),
  nextReviewDate: timestamp("next_review_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const governmentCommunications = pgTable("government_communications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  communicationType: varchar("communication_type", { 
    enum: [
      "uc_decision", "benefit_change", "appointment_reminder", "compliance_warning",
      "sanction_notice", "appeal_outcome", "payment_notification", "review_request",
      "work_coach_message", "training_opportunity", "job_matching", "system_update"
    ] 
  }).notNull(),
  subject: varchar("subject").notNull(),
  message: text("message").notNull(),
  priority: varchar("priority", { enum: ["low", "medium", "high", "urgent"] }).notNull().default("medium"),
  channel: varchar("channel", { 
    enum: ["email", "sms", "post", "phone", "portal", "push_notification"] 
  }).notNull().default("portal"),
  isRead: boolean("is_read").notNull().default(false),
  requiresAction: boolean("requires_action").notNull().default(false),
  actionDeadline: timestamp("action_deadline"),
  responseRequired: boolean("response_required").notNull().default(false),
  templateId: varchar("template_id"),
  metadata: jsonb("metadata"), // Additional data like claim refs, amounts
  sentAt: timestamp("sent_at").defaultNow(),
  readAt: timestamp("read_at"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const socialReports = pgTable("social_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportType: varchar("report_type", { 
    enum: [
      "uc_summary", "benefit_breakdown", "earnings_impact", "compliance_report",
      "payment_history", "claim_status", "work_search_activity", "sanction_report",
      "appeal_tracker", "government_correspondence", "benefits_forecast", "eligibility_check"
    ] 
  }).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'cascade' }),
  reportPeriod: varchar("report_period"), // "2025-01" or date range
  filters: jsonb("filters"),
  data: jsonb("data").notNull(), // Report results
  summary: jsonb("summary"), // Key insights and totals
  recommendations: jsonb("recommendations"), // System recommendations
  complianceStatus: varchar("compliance_status", { 
    enum: ["compliant", "non_compliant", "warning", "at_risk"] 
  }),
  generatedBy: varchar("generated_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  fileUrl: varchar("file_url"),
  isShared: boolean("is_shared").notNull().default(false),
  sharedWith: jsonb("shared_with"), // Array of user IDs or roles
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Government Integration Logs
export const governmentApiLogs = pgTable("government_api_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  apiEndpoint: varchar("api_endpoint").notNull(), // UC API, HMRC API, DWP API
  requestType: varchar("request_type", { 
    enum: ["claim_check", "payment_query", "benefit_verification", "earnings_report", "compliance_update"] 
  }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  claimReference: varchar("claim_reference"),
  requestPayload: jsonb("request_payload"),
  responseStatus: integer("response_status"), // HTTP status
  responseData: jsonb("response_data"),
  errorMessage: text("error_message"),
  processingTime: integer("processing_time"), // milliseconds
  success: boolean("success").notNull().default(true),
  requestedAt: timestamp("requested_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  ownedOrganizations: many(organizations),
  jobs: many(jobs),
  shifts: many(shifts),
  timesheets: many(timesheets),
  payments: many(payments),
  courseCompletions: many(courseCompletions),
  activities: many(activities),
  gdprConsents: many(gdprConsents),
  gdprDataRequests: many(gdprDataRequests),
  gdprDataProcessingLogs: many(gdprDataProcessingLogs),
  gdprCookieConsents: many(gdprCookieConsents),
  payrollRecords: many(payrollRecords),
  taxInfo: one(workerTaxInfo, { fields: [users.id], references: [workerTaxInfo.workerId] }),
  createdReports: many(generatedReports),
  createdTemplates: many(reportTemplates),
  // Education relations
  qualifications: many(qualifications),
  programmeParticipations: many(programmeParticipations),
  userSkills: many(userSkills),
  developmentPlans: many(developmentPlans),
  pathwayProgress: many(pathwayProgress),
  // Government & Benefits relations
  universalCreditClaim: one(universalCreditClients, { fields: [users.id], references: [universalCreditClients.userId] }),
  socialBenefits: many(socialBenefitsClients),
  benefitPayments: many(benefitPayments),
  workSearchRequirements: many(workSearchRequirements),
  governmentCommunications: many(governmentCommunications),
  socialReports: many(socialReports),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  owner: one(users, { fields: [organizations.ownerId], references: [users.id] }),
  jobs: many(jobs),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  client: one(users, { fields: [jobs.clientId], references: [users.id] }),
  organization: one(organizations, { fields: [jobs.organizationId], references: [organizations.id] }),
  shifts: many(shifts),
}));

export const shiftsRelations = relations(shifts, ({ one, many }) => ({
  job: one(jobs, { fields: [shifts.jobId], references: [jobs.id] }),
  worker: one(users, { fields: [shifts.workerId], references: [users.id] }),
  timesheets: many(timesheets),
}));

export const timesheetsRelations = relations(timesheets, ({ one }) => ({
  shift: one(shifts, { fields: [timesheets.shiftId], references: [shifts.id] }),
  worker: one(users, { fields: [timesheets.workerId], references: [users.id] }),
  approver: one(users, { fields: [timesheets.approvedBy], references: [users.id] }),
  payment: one(payments, { fields: [timesheets.id], references: [payments.timesheetId] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  worker: one(users, { fields: [payments.workerId], references: [users.id] }),
  timesheet: one(timesheets, { fields: [payments.timesheetId], references: [timesheets.id] }),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  completions: many(courseCompletions),
  lessons: many(lessons),
  quizzes: many(quizzes),
  enrollments: many(courseEnrollments),
}));

export const courseCompletionsRelations = relations(courseCompletions, ({ one }) => ({
  user: one(users, { fields: [courseCompletions.userId], references: [users.id] }),
  course: one(courses, { fields: [courseCompletions.courseId], references: [courses.id] }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, { fields: [activities.userId], references: [users.id] }),
}));

// Karma Relations
export const karmaTransactionsRelations = relations(karmaTransactions, ({ one }) => ({
  user: one(users, { fields: [karmaTransactions.userId], references: [users.id] }),
  activity: one(karmaActivities, { fields: [karmaTransactions.activityId], references: [karmaActivities.id] }),
  reward: one(karmaRewards, { fields: [karmaTransactions.rewardId], references: [karmaRewards.id] }),
}));

// Payroll Relations
export const payrollRecordsRelations = relations(payrollRecords, ({ one }) => ({
  worker: one(users, { fields: [payrollRecords.workerId], references: [users.id] }),
}));

export const workerTaxInfoRelations = relations(workerTaxInfo, ({ one }) => ({
  worker: one(users, { fields: [workerTaxInfo.workerId], references: [users.id] }),
}));

export const reportTemplatesRelations = relations(reportTemplates, ({ one, many }) => ({
  creator: one(users, { fields: [reportTemplates.createdBy], references: [users.id] }),
  generatedReports: many(generatedReports),
}));

export const generatedReportsRelations = relations(generatedReports, ({ one }) => ({
  template: one(reportTemplates, { fields: [generatedReports.templateId], references: [reportTemplates.id] }),
  generator: one(users, { fields: [generatedReports.generatedBy], references: [users.id] }),
}));

// Pricing Relations
export const pricingPlansRelations = relations(pricingPlans, ({ many }) => ({
  subscriptions: many(organizationSubscriptions),
  pricingRules: many(pricingRules),
}));

export const organizationSubscriptionsRelations = relations(organizationSubscriptions, ({ one, many }) => ({
  organization: one(organizations, { fields: [organizationSubscriptions.organizationId], references: [organizations.id] }),
  plan: one(pricingPlans, { fields: [organizationSubscriptions.planId], references: [pricingPlans.id] }),
  usageMetrics: many(usageMetrics),
  billingHistory: many(billingHistory),
}));

export const usageMetricsRelations = relations(usageMetrics, ({ one }) => ({
  organization: one(organizations, { fields: [usageMetrics.organizationId], references: [organizations.id] }),
  subscription: one(organizationSubscriptions, { fields: [usageMetrics.subscriptionId], references: [organizationSubscriptions.id] }),
}));

export const pricingRulesRelations = relations(pricingRules, ({ one }) => ({
  plan: one(pricingPlans, { fields: [pricingRules.planId], references: [pricingPlans.id] }),
}));

export const billingHistoryRelations = relations(billingHistory, ({ one }) => ({
  organization: one(organizations, { fields: [billingHistory.organizationId], references: [organizations.id] }),
  subscription: one(organizationSubscriptions, { fields: [billingHistory.subscriptionId], references: [organizationSubscriptions.id] }),
  plan: one(pricingPlans, { fields: [billingHistory.planId], references: [pricingPlans.id] }),
}));

// GDPR Relations
export const gdprConsentsRelations = relations(gdprConsents, ({ one }) => ({
  user: one(users, { fields: [gdprConsents.userId], references: [users.id] }),
}));

export const gdprDataRequestsRelations = relations(gdprDataRequests, ({ one }) => ({
  user: one(users, { fields: [gdprDataRequests.userId], references: [users.id] }),
}));

export const gdprDataProcessingLogsRelations = relations(gdprDataProcessingLogs, ({ one }) => ({
  user: one(users, { fields: [gdprDataProcessingLogs.userId], references: [users.id] }),
}));

export const gdprCookieConsentsRelations = relations(gdprCookieConsents, ({ one }) => ({
  user: one(users, { fields: [gdprCookieConsents.userId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  email: z.string().email({ message: "Please enter a valid email address" }).min(1, { message: "Email is required" }),
  firstName: z.string().min(1, { message: "First name is required" }).max(50, { message: "First name must be 50 characters or less" }),
  lastName: z.string().min(1, { message: "Last name is required" }).max(50, { message: "Last name must be 50 characters or less" }),
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  name: z.string().min(2, { message: "Organization name must be at least 2 characters" }).max(100, { message: "Organization name must be 100 characters or less" }),
});

export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  title: z.string()
    .min(3, { message: "Job title must be at least 3 characters" })
    .max(100, { message: "Job title must be 100 characters or less" }),
  description: z.string()
    .min(10, { message: "Description must be at least 10 characters" })
    .max(500, { message: "Description must be 500 characters or less" }),
  location: z.string()
    .min(2, { message: "Location must be at least 2 characters" })
    .max(100, { message: "Location must be 100 characters or less" }),
  salary: z.string()
    .optional()
    .refine((val) => !val || (parseFloat(val) >= 0 && parseFloat(val) <= 10000000), {
      message: "Salary must be between 0 and 10,000,000",
    }),
});

export const insertShiftSchema = createInsertSchema(shifts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTimesheetSchema = createInsertSchema(timesheets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCourseCompletionSchema = createInsertSchema(courseCompletions).omit({ id: true, completedAt: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });

// Karma Insert schemas
export const insertKarmaActivitySchema = createInsertSchema(karmaActivities).omit({ id: true, createdAt: true, updatedAt: true });
export const insertKarmaRewardSchema = createInsertSchema(karmaRewards).omit({ id: true, createdAt: true, updatedAt: true });
export const insertKarmaTransactionSchema = createInsertSchema(karmaTransactions).omit({ id: true, createdAt: true });

// GDPR Insert schemas
export const insertGdprConsentSchema = createInsertSchema(gdprConsents).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGdprDataRequestSchema = createInsertSchema(gdprDataRequests).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGdprDataProcessingLogSchema = createInsertSchema(gdprDataProcessingLogs).omit({ id: true, createdAt: true });
export const insertGdprDataRetentionSchema = createInsertSchema(gdprDataRetention).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGdprCookieConsentSchema = createInsertSchema(gdprCookieConsents).omit({ id: true, createdAt: true, updatedAt: true });

// Pricing Insert schemas
export const insertPricingPlanSchema = createInsertSchema(pricingPlans).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrganizationSubscriptionSchema = createInsertSchema(organizationSubscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUsageMetricSchema = createInsertSchema(usageMetrics).omit({ id: true, createdAt: true });
export const insertPricingRuleSchema = createInsertSchema(pricingRules).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBillingHistorySchema = createInsertSchema(billingHistory).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type Shift = typeof shifts.$inferSelect;
export type InsertTimesheet = z.infer<typeof insertTimesheetSchema>;
export type Timesheet = typeof timesheets.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourseCompletion = z.infer<typeof insertCourseCompletionSchema>;
export type CourseCompletion = typeof courseCompletions.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// Karma Types
export type KarmaActivity = typeof karmaActivities.$inferSelect;
export type InsertKarmaActivity = z.infer<typeof insertKarmaActivitySchema>;
export type KarmaReward = typeof karmaRewards.$inferSelect;
export type InsertKarmaReward = z.infer<typeof insertKarmaRewardSchema>;
export type KarmaTransaction = typeof karmaTransactions.$inferSelect;
export type InsertKarmaTransaction = z.infer<typeof insertKarmaTransactionSchema>;

// GDPR Types
export type GdprConsent = typeof gdprConsents.$inferSelect;
export type InsertGdprConsent = z.infer<typeof insertGdprConsentSchema>;

// Pricing Types
export type PricingPlan = typeof pricingPlans.$inferSelect;
export type InsertPricingPlan = z.infer<typeof insertPricingPlanSchema>;
export type OrganizationSubscription = typeof organizationSubscriptions.$inferSelect;
export type InsertOrganizationSubscription = z.infer<typeof insertOrganizationSubscriptionSchema>;
export type UsageMetric = typeof usageMetrics.$inferSelect;
export type InsertUsageMetric = z.infer<typeof insertUsageMetricSchema>;
export type PricingRule = typeof pricingRules.$inferSelect;
export type InsertPricingRule = z.infer<typeof insertPricingRuleSchema>;
export type BillingHistory = typeof billingHistory.$inferSelect;
export type InsertBillingHistory = z.infer<typeof insertBillingHistorySchema>;
export type GdprDataRequest = typeof gdprDataRequests.$inferSelect;
export type InsertGdprDataRequest = z.infer<typeof insertGdprDataRequestSchema>;
export type GdprDataProcessingLog = typeof gdprDataProcessingLogs.$inferSelect;
export type InsertGdprDataProcessingLog = z.infer<typeof insertGdprDataProcessingLogSchema>;
export type GdprDataRetention = typeof gdprDataRetention.$inferSelect;
export type InsertGdprDataRetention = z.infer<typeof insertGdprDataRetentionSchema>;
export type GdprCookieConsent = typeof gdprCookieConsents.$inferSelect;
export type InsertGdprCookieConsent = z.infer<typeof insertGdprCookieConsentSchema>;

// Payroll Insert schemas
export const insertPayrollRecordSchema = createInsertSchema(payrollRecords).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWorkerTaxInfoSchema = createInsertSchema(workerTaxInfo).omit({ id: true, createdAt: true, updatedAt: true });
export const insertHmrcSubmissionSchema = createInsertSchema(hmrcSubmissions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReportTemplateSchema = createInsertSchema(reportTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGeneratedReportSchema = createInsertSchema(generatedReports).omit({ id: true, createdAt: true });

// Payroll Types
export type PayrollRecord = typeof payrollRecords.$inferSelect;
export type InsertPayrollRecord = z.infer<typeof insertPayrollRecordSchema>;
export type WorkerTaxInfo = typeof workerTaxInfo.$inferSelect;
export type InsertWorkerTaxInfo = z.infer<typeof insertWorkerTaxInfoSchema>;
export type HmrcSubmission = typeof hmrcSubmissions.$inferSelect;
export type InsertHmrcSubmission = z.infer<typeof insertHmrcSubmissionSchema>;
export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type InsertReportTemplate = z.infer<typeof insertReportTemplateSchema>;
export type GeneratedReport = typeof generatedReports.$inferSelect;
export type InsertGeneratedReport = z.infer<typeof insertGeneratedReportSchema>;

// Education System Relations
export const qualificationsRelations = relations(qualifications, ({ one }) => ({
  user: one(users, { fields: [qualifications.userId], references: [users.id] }),
  governmentProgramme: one(governmentProgrammes, { fields: [qualifications.governmentSchemeId], references: [governmentProgrammes.id] }),
}));

export const governmentProgrammesRelations = relations(governmentProgrammes, ({ many }) => ({
  participations: many(programmeParticipations),
  linkedQualifications: many(qualifications),
}));

export const programmeParticipationsRelations = relations(programmeParticipations, ({ one }) => ({
  user: one(users, { fields: [programmeParticipations.userId], references: [users.id] }),
  programme: one(governmentProgrammes, { fields: [programmeParticipations.programmeId], references: [governmentProgrammes.id] }),
  mentor: one(users, { fields: [programmeParticipations.mentorId], references: [users.id] }),
}));

export const skillsFrameworkRelations = relations(skillsFramework, ({ many }) => ({
  userSkills: many(userSkills),
}));

export const userSkillsRelations = relations(userSkills, ({ one }) => ({
  user: one(users, { fields: [userSkills.userId], references: [users.id] }),
  skill: one(skillsFramework, { fields: [userSkills.skillId], references: [skillsFramework.id] }),
}));

export const developmentPlansRelations = relations(developmentPlans, ({ one }) => ({
  user: one(users, { fields: [developmentPlans.userId], references: [users.id] }),
}));

export const learningPathwaysRelations = relations(learningPathways, ({ many }) => ({
  pathwayProgress: many(pathwayProgress),
}));

export const pathwayProgressRelations = relations(pathwayProgress, ({ one }) => ({
  user: one(users, { fields: [pathwayProgress.userId], references: [users.id] }),
  pathway: one(learningPathways, { fields: [pathwayProgress.pathwayId], references: [learningPathways.id] }),
  mentor: one(users, { fields: [pathwayProgress.mentorId], references: [users.id] }),
}));

export const educationProvidersRelations = relations(educationProviders, ({ many }) => ({
  // Can add specific relations when needed
}));

// Education Insert schemas
export const insertQualificationSchema = createInsertSchema(qualifications).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGovernmentProgrammeSchema = createInsertSchema(governmentProgrammes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProgrammeParticipationSchema = createInsertSchema(programmeParticipations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSkillsFrameworkSchema = createInsertSchema(skillsFramework).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSkillSchema = createInsertSchema(userSkills).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDevelopmentPlanSchema = createInsertSchema(developmentPlans).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLearningPathwaySchema = createInsertSchema(learningPathways).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPathwayProgressSchema = createInsertSchema(pathwayProgress).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEducationProviderSchema = createInsertSchema(educationProviders).omit({ id: true, createdAt: true, updatedAt: true });

// Education Types
export type Qualification = typeof qualifications.$inferSelect;
export type InsertQualification = z.infer<typeof insertQualificationSchema>;
export type GovernmentProgramme = typeof governmentProgrammes.$inferSelect;
export type InsertGovernmentProgramme = z.infer<typeof insertGovernmentProgrammeSchema>;
export type ProgrammeParticipation = typeof programmeParticipations.$inferSelect;
export type InsertProgrammeParticipation = z.infer<typeof insertProgrammeParticipationSchema>;
export type SkillsFramework = typeof skillsFramework.$inferSelect;
export type InsertSkillsFramework = z.infer<typeof insertSkillsFrameworkSchema>;
export type UserSkill = typeof userSkills.$inferSelect;
export type InsertUserSkill = z.infer<typeof insertUserSkillSchema>;
export type DevelopmentPlan = typeof developmentPlans.$inferSelect;
export type InsertDevelopmentPlan = z.infer<typeof insertDevelopmentPlanSchema>;
export type LearningPathway = typeof learningPathways.$inferSelect;
export type InsertLearningPathway = z.infer<typeof insertLearningPathwaySchema>;
export type PathwayProgress = typeof pathwayProgress.$inferSelect;
export type InsertPathwayProgress = z.infer<typeof insertPathwayProgressSchema>;
export type EducationProvider = typeof educationProviders.$inferSelect;
export type InsertEducationProvider = z.infer<typeof insertEducationProviderSchema>;

// Government & Benefits Insert schemas
export const insertUniversalCreditClientSchema = createInsertSchema(universalCreditClients).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSocialBenefitsClientSchema = createInsertSchema(socialBenefitsClients).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBenefitPaymentSchema = createInsertSchema(benefitPayments).omit({ id: true, createdAt: true });
export const insertWorkSearchRequirementSchema = createInsertSchema(workSearchRequirements).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGovernmentCommunicationSchema = createInsertSchema(governmentCommunications).omit({ id: true, createdAt: true });
export const insertSocialReportSchema = createInsertSchema(socialReports).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGovernmentApiLogSchema = createInsertSchema(governmentApiLogs).omit({ id: true });

// Government Relations
export const universalCreditClientsRelations = relations(universalCreditClients, ({ one, many }) => ({
  user: one(users, { fields: [universalCreditClients.userId], references: [users.id] }),
  benefitPayments: many(benefitPayments),
  workSearchRequirements: many(workSearchRequirements),
}));

export const socialBenefitsClientsRelations = relations(socialBenefitsClients, ({ one, many }) => ({
  user: one(users, { fields: [socialBenefitsClients.userId], references: [users.id] }),
  benefitPayments: many(benefitPayments),
}));

export const benefitPaymentsRelations = relations(benefitPayments, ({ one }) => ({
  user: one(users, { fields: [benefitPayments.userId], references: [users.id] }),
}));

export const workSearchRequirementsRelations = relations(workSearchRequirements, ({ one }) => ({
  user: one(users, { fields: [workSearchRequirements.userId], references: [users.id] }),
  ucClaim: one(universalCreditClients, { fields: [workSearchRequirements.claimId], references: [universalCreditClients.id] }),
}));

export const governmentCommunicationsRelations = relations(governmentCommunications, ({ one }) => ({
  user: one(users, { fields: [governmentCommunications.userId], references: [users.id] }),
}));

export const socialReportsRelations = relations(socialReports, ({ one }) => ({
  user: one(users, { fields: [socialReports.userId], references: [users.id] }),
  organization: one(organizations, { fields: [socialReports.organizationId], references: [organizations.id] }),
  generatedBy: one(users, { fields: [socialReports.generatedBy], references: [users.id] }),
}));

// Government & Benefits Types
export type UniversalCreditClient = typeof universalCreditClients.$inferSelect;
export type InsertUniversalCreditClient = z.infer<typeof insertUniversalCreditClientSchema>;
export type SocialBenefitsClient = typeof socialBenefitsClients.$inferSelect;
export type InsertSocialBenefitsClient = z.infer<typeof insertSocialBenefitsClientSchema>;
export type BenefitPayment = typeof benefitPayments.$inferSelect;
export type InsertBenefitPayment = z.infer<typeof insertBenefitPaymentSchema>;
export type WorkSearchRequirement = typeof workSearchRequirements.$inferSelect;
export type InsertWorkSearchRequirement = z.infer<typeof insertWorkSearchRequirementSchema>;
export type GovernmentCommunication = typeof governmentCommunications.$inferSelect;
export type InsertGovernmentCommunication = z.infer<typeof insertGovernmentCommunicationSchema>;
export type SocialReport = typeof socialReports.$inferSelect;
export type InsertSocialReport = z.infer<typeof insertSocialReportSchema>;
export type GovernmentApiLog = typeof governmentApiLogs.$inferSelect;
export type InsertGovernmentApiLog = z.infer<typeof insertGovernmentApiLogSchema>;

// Enhanced Learning Management System Tables

// Lessons - Individual learning units within a course
export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar("title").notNull(),
  description: text("description"),
  content: text("content"), // HTML/markdown content
  videoUrl: varchar("video_url"),
  attachments: jsonb("attachments").default([]), // array of file objects
  order: integer("order").notNull(), // lesson order within course
  estimatedDuration: integer("estimated_duration_minutes"),
  isRequired: boolean("is_required").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quizzes - Assessments for courses or lessons
export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").references(() => courses.id, { onDelete: 'cascade' }),
  lessonId: varchar("lesson_id").references(() => lessons.id, { onDelete: 'set null' }), // optional, quiz can be standalone or lesson-specific
  title: varchar("title").notNull(),
  description: text("description"),
  timeLimit: integer("time_limit_minutes"), // null = no time limit
  passingScore: integer("passing_score_percentage").notNull().default(80),
  maxAttempts: integer("max_attempts").default(3), // null = unlimited
  shuffleQuestions: boolean("shuffle_questions").notNull().default(false),
  showCorrectAnswers: boolean("show_correct_answers").notNull().default(true),
  isRequired: boolean("is_required").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quiz Questions - Individual questions within quizzes
export const quizQuestions = pgTable("quiz_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  type: varchar("type", { 
    enum: ["multiple_choice", "true_false", "short_answer", "essay", "matching", "drag_drop"] 
  }).notNull(),
  question: text("question").notNull(),
  options: jsonb("options").default([]), // array of answer options
  correctAnswers: text("correct_answers").array(), // array of correct answer indices/values
  explanation: text("explanation"), // explanation shown after answering
  points: integer("points").notNull().default(1),
  order: integer("order").notNull(),
  imageUrl: varchar("image_url"), // optional image for question
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Course Enrollments - Track user enrollment in courses
export const courseEnrollments = pgTable("course_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  progress: integer("progress_percentage").notNull().default(0),
  status: varchar("status", { 
    enum: ["enrolled", "in_progress", "completed", "failed", "suspended"] 
  }).notNull().default("enrolled"),
  finalScore: integer("final_score_percentage"),
  certificateIssuedAt: timestamp("certificate_issued_at"),
  certificateUrl: varchar("certificate_url"),
});

// Lesson Progress - Track individual lesson completion
export const lessonProgress = pgTable("lesson_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  lessonId: varchar("lesson_id").notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  timeSpent: integer("time_spent_minutes").notNull().default(0),
  progress: integer("progress_percentage").notNull().default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
});

// Quiz Attempts - Track user attempts at quizzes
export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  courseId: varchar("course_id").references(() => courses.id, { onDelete: 'set null' }),
  attemptNumber: integer("attempt_number").notNull(),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  score: integer("score_percentage"),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull().default(0),
  timeSpent: integer("time_spent_minutes"),
  isPassed: boolean("is_passed").notNull().default(false),
  answers: jsonb("answers").default({}), // question_id -> answer mapping
});

// Learning Achievements - Badges and achievements earned
export const learningAchievements = pgTable("learning_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar("type", { 
    enum: ["course_completion", "quiz_master", "fast_learner", "perfect_score", "streak", "early_bird"] 
  }).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  iconUrl: varchar("icon_url"),
  badgeColor: varchar("badge_color").default("#3B82F6"),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  courseId: varchar("course_id").references(() => courses.id, { onDelete: 'set null' }), // if achievement is course-specific
  earnedAt: timestamp("earned_at").defaultNow(),
});

// Learning Analytics - Track learning patterns and insights
export const learningAnalytics = pgTable("learning_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: varchar("course_id").references(() => courses.id, { onDelete: 'set null' }),
  sessionDate: timestamp("session_date").defaultNow(),
  timeSpent: integer("time_spent_minutes").notNull(),
  activitiesCompleted: integer("activities_completed").notNull().default(0),
  questionsAnswered: integer("questions_answered").notNull().default(0),
  correctAnswersCount: integer("correct_answers_count").notNull().default(0),
  engagementScore: integer("engagement_score").default(0), // 0-100 based on interaction
  deviceType: varchar("device_type", { enum: ["desktop", "mobile", "tablet"] }),
  learningPath: text("learning_path"), // sequence of activities in session
});

// Certificates - Generated completion certificates
export const certificates = pgTable("certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: 'set null' }),
  certificateNumber: varchar("certificate_number").notNull().unique(),
  issuedAt: timestamp("issued_at").defaultNow(),
  validUntil: timestamp("valid_until"), // for certificates with expiration
  pdfUrl: varchar("pdf_url"), // generated PDF file URL
  verificationCode: varchar("verification_code").notNull().unique(),
  template: varchar("template").notNull().default("standard"),
  metadata: jsonb("metadata").default({}), // additional certificate data
  isRevoked: boolean("is_revoked").notNull().default(false),
  revokedAt: timestamp("revoked_at"),
  revokedReason: text("revoked_reason"),
});

// Enhanced Learning Management Relations
export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  course: one(courses, { fields: [lessons.courseId], references: [courses.id] }),
  progress: many(lessonProgress),
  quizzes: many(quizzes),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  course: one(courses, { fields: [quizzes.courseId], references: [courses.id] }),
  lesson: one(lessons, { fields: [quizzes.lessonId], references: [lessons.id] }),
  questions: many(quizQuestions),
  attempts: many(quizAttempts),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  quiz: one(quizzes, { fields: [quizQuestions.quizId], references: [quizzes.id] }),
}));

export const courseEnrollmentsRelations = relations(courseEnrollments, ({ one }) => ({
  user: one(users, { fields: [courseEnrollments.userId], references: [users.id] }),
  course: one(courses, { fields: [courseEnrollments.courseId], references: [courses.id] }),
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  user: one(users, { fields: [lessonProgress.userId], references: [users.id] }),
  lesson: one(lessons, { fields: [lessonProgress.lessonId], references: [lessons.id] }),
  course: one(courses, { fields: [lessonProgress.courseId], references: [courses.id] }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  user: one(users, { fields: [quizAttempts.userId], references: [users.id] }),
  quiz: one(quizzes, { fields: [quizAttempts.quizId], references: [quizzes.id] }),
  course: one(courses, { fields: [quizAttempts.courseId], references: [courses.id] }),
}));

export const learningAchievementsRelations = relations(learningAchievements, ({ one }) => ({
  user: one(users, { fields: [learningAchievements.userId], references: [users.id] }),
  course: one(courses, { fields: [learningAchievements.courseId], references: [courses.id] }),
}));

export const learningAnalyticsRelations = relations(learningAnalytics, ({ one }) => ({
  user: one(users, { fields: [learningAnalytics.userId], references: [users.id] }),
  course: one(courses, { fields: [learningAnalytics.courseId], references: [courses.id] }),
}));

export const certificatesRelations = relations(certificates, ({ one }) => ({
  user: one(users, { fields: [certificates.userId], references: [users.id] }),
  course: one(courses, { fields: [certificates.courseId], references: [courses.id] }),
}));

// Enhanced Learning Management Insert Schemas
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCourseEnrollmentSchema = createInsertSchema(courseEnrollments).omit({ id: true });
export const insertLessonProgressSchema = createInsertSchema(lessonProgress).omit({ id: true });
export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({ id: true });
export const insertLearningAchievementSchema = createInsertSchema(learningAchievements).omit({ id: true });
export const insertLearningAnalyticsSchema = createInsertSchema(learningAnalytics).omit({ id: true });
export const insertCertificateSchema = createInsertSchema(certificates).omit({ id: true });

// Enhanced Learning Management Types
export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type InsertCourseEnrollment = z.infer<typeof insertCourseEnrollmentSchema>;
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type InsertLessonProgress = z.infer<typeof insertLessonProgressSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type LearningAchievement = typeof learningAchievements.$inferSelect;
export type InsertLearningAchievement = z.infer<typeof insertLearningAchievementSchema>;
export type LearningAnalytics = typeof learningAnalytics.$inferSelect;
export type InsertLearningAnalytics = z.infer<typeof insertLearningAnalyticsSchema>;
export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;

// 360-Degree Feedback System

// Performance review cycles (annual, bi-annual, quarterly)
export const performanceReviewCycles = pgTable("performance_review_cycles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cycleName: varchar("cycle_name").notNull(),
  cycleType: varchar("cycle_type", {
    enum: ["annual", "bi_annual", "quarterly", "mid_year", "probationary"]
  }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reviewDeadline: timestamp("review_deadline").notNull(),
  status: varchar("status", {
    enum: ["draft", "active", "completed", "cancelled"]
  }).notNull().default("draft"),
  description: text("description"),
  instructions: text("instructions"),
  karmaReward: integer("karma_reward").notNull().default(100), // Karma coins for completing reviews
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual 360-degree performance reviews
export const performanceReviews = pgTable("performance_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cycleId: varchar("cycle_id").notNull().references(() => performanceReviewCycles.id, { onDelete: 'cascade' }),
  revieweeId: varchar("reviewee_id").notNull().references(() => users.id, { onDelete: 'cascade' }), // Person being reviewed
  status: varchar("status", {
    enum: ["not_started", "in_progress", "pending_approval", "completed", "overdue"]
  }).notNull().default("not_started"),
  selfReviewCompleted: boolean("self_review_completed").notNull().default(false),
  supervisorReviewCompleted: boolean("supervisor_review_completed").notNull().default(false),
  peerReviewsCompleted: integer("peer_reviews_completed").notNull().default(0),
  peerReviewsRequired: integer("peer_reviews_required").notNull().default(3),
  subordinateReviewsCompleted: integer("subordinate_reviews_completed").notNull().default(0),
  subordinateReviewsRequired: integer("subordinate_reviews_required").notNull().default(0),
  overallRating: decimal("overall_rating", { precision: 3, scale: 2 }), // 1.00-5.00
  progressPercentage: integer("progress_percentage").notNull().default(0),
  reviewerComments: text("reviewer_comments"),
  developmentAreas: jsonb("development_areas"),
  strengths: jsonb("strengths"),
  goals: jsonb("goals"),
  actionPlan: text("action_plan"),
  managerNotes: text("manager_notes"),
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by").references(() => users.id, { onDelete: 'set null' }),
  karmaEarned: integer("karma_earned").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Review participants (who reviews whom)
export const reviewParticipants = pgTable("review_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewId: varchar("review_id").notNull().references(() => performanceReviews.id, { onDelete: 'cascade' }),
  participantId: varchar("participant_id").notNull().references(() => users.id, { onDelete: 'cascade' }), // Person giving feedback
  participantType: varchar("participant_type", {
    enum: ["self", "supervisor", "peer", "subordinate", "customer", "external"]
  }).notNull(),
  invitedAt: timestamp("invited_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
  status: varchar("status", {
    enum: ["invited", "in_progress", "completed", "declined", "overdue"]
  }).notNull().default("invited"),
  remindersSent: integer("reminders_sent").notNull().default(0),
  lastReminderAt: timestamp("last_reminder_at"),
  anonymousResponse: boolean("anonymous_response").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Competencies/skills being evaluated in reviews
export const reviewCompetencies = pgTable("review_competencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competencyName: varchar("competency_name").notNull(),
  category: varchar("category", {
    enum: ["technical", "leadership", "communication", "teamwork", "innovation", "customer_focus", "problem_solving", "adaptability"]
  }).notNull(),
  description: text("description"),
  behaviorIndicators: jsonb("behavior_indicators"), // Array of specific behaviors
  weight: decimal("weight", { precision: 3, scale: 2 }).notNull().default("1.00"), // Importance weighting
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual feedback responses
export const reviewResponses = pgTable("review_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewId: varchar("review_id").notNull().references(() => performanceReviews.id, { onDelete: 'cascade' }),
  participantId: varchar("participant_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  competencyId: varchar("competency_id").notNull().references(() => reviewCompetencies.id, { onDelete: 'cascade' }),
  rating: integer("rating").notNull(), // 1-5 scale
  comments: text("comments"),
  examples: text("examples"), // Specific examples to support rating
  developmentSuggestions: text("development_suggestions"),
  strengths: text("strengths"),
  isConfidential: boolean("is_confidential").notNull().default(false),
  submittedAt: timestamp("submitted_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Goals and objectives for review periods
export const reviewGoals = pgTable("review_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewId: varchar("review_id").notNull().references(() => performanceReviews.id, { onDelete: 'cascade' }),
  goalTitle: varchar("goal_title").notNull(),
  goalDescription: text("goal_description"),
  goalType: varchar("goal_type", {
    enum: ["performance", "development", "behavioral", "project", "learning"]
  }).notNull(),
  priority: varchar("priority", {
    enum: ["high", "medium", "low"]
  }).notNull().default("medium"),
  targetDate: timestamp("target_date"),
  progress: integer("progress_percentage").notNull().default(0),
  status: varchar("status", {
    enum: ["not_started", "in_progress", "completed", "deferred", "cancelled"]
  }).notNull().default("not_started"),
  successCriteria: text("success_criteria"),
  supportRequired: text("support_required"),
  managementNotes: text("management_notes"),
  selfAssessment: text("self_assessment"),
  finalOutcome: text("final_outcome"),
  karmaReward: integer("karma_reward").notNull().default(25), // Karma coins for goal completion
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Review analytics and insights
export const reviewAnalytics = pgTable("review_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cycleId: varchar("cycle_id").notNull().references(() => performanceReviewCycles.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
  ratingDistribution: jsonb("rating_distribution"), // Distribution across competencies
  peerFeedbackCount: integer("peer_feedback_count").notNull().default(0),
  strengthsIdentified: jsonb("strengths_identified"),
  developmentAreasIdentified: jsonb("development_areas_identified"),
  goalCompletionRate: decimal("goal_completion_rate", { precision: 5, scale: 2 }),
  improvementTrends: jsonb("improvement_trends"),
  benchmarkComparison: jsonb("benchmark_comparison"),
  actionItemsCreated: integer("action_items_created").notNull().default(0),
  actionItemsCompleted: integer("action_items_completed").notNull().default(0),
  engagementScore: decimal("engagement_score", { precision: 3, scale: 2 }),
  lastCalculatedAt: timestamp("last_calculated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations for 360-degree feedback system
export const performanceReviewCyclesRelations = relations(performanceReviewCycles, ({ many }) => ({
  reviews: many(performanceReviews),
  analytics: many(reviewAnalytics),
}));

export const performanceReviewsRelations = relations(performanceReviews, ({ one, many }) => ({
  cycle: one(performanceReviewCycles, { fields: [performanceReviews.cycleId], references: [performanceReviewCycles.id] }),
  reviewee: one(users, { fields: [performanceReviews.revieweeId], references: [users.id] }),
  participants: many(reviewParticipants),
  responses: many(reviewResponses),
  goals: many(reviewGoals),
}));

export const reviewParticipantsRelations = relations(reviewParticipants, ({ one, many }) => ({
  review: one(performanceReviews, { fields: [reviewParticipants.reviewId], references: [performanceReviews.id] }),
  participant: one(users, { fields: [reviewParticipants.participantId], references: [users.id] }),
  responses: many(reviewResponses),
}));

export const reviewCompetenciesRelations = relations(reviewCompetencies, ({ many }) => ({
  responses: many(reviewResponses),
}));

export const reviewResponsesRelations = relations(reviewResponses, ({ one }) => ({
  review: one(performanceReviews, { fields: [reviewResponses.reviewId], references: [performanceReviews.id] }),
  participant: one(users, { fields: [reviewResponses.participantId], references: [users.id] }),
  competency: one(reviewCompetencies, { fields: [reviewResponses.competencyId], references: [reviewCompetencies.id] }),
}));

export const reviewGoalsRelations = relations(reviewGoals, ({ one }) => ({
  review: one(performanceReviews, { fields: [reviewGoals.reviewId], references: [performanceReviews.id] }),
}));

export const reviewAnalyticsRelations = relations(reviewAnalytics, ({ one }) => ({
  cycle: one(performanceReviewCycles, { fields: [reviewAnalytics.cycleId], references: [performanceReviewCycles.id] }),
  user: one(users, { fields: [reviewAnalytics.userId], references: [users.id] }),
}));

// Marketing & Business Development System

// Marketing Campaigns
export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  campaignType: varchar("campaign_type", {
    enum: ["email", "social", "content", "event", "webinar", "multi_channel"]
  }).notNull(),
  status: varchar("status", {
    enum: ["draft", "scheduled", "active", "paused", "completed", "cancelled"]
  }).notNull().default("draft"),
  targetAudience: jsonb("target_audience"),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  actualSpend: decimal("actual_spend", { precision: 10, scale: 2 }).default("0"),
  goals: jsonb("goals"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'set null' }),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Templates
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  subject: varchar("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  templateType: varchar("template_type", {
    enum: ["marketing", "transactional", "newsletter", "announcement", "welcome", "follow_up"]
  }).notNull(),
  variables: jsonb("variables"),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'set null' }),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Campaign Sends
export const emailCampaignSends = pgTable("email_campaign_sends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => marketingCampaigns.id, { onDelete: 'cascade' }),
  templateId: varchar("template_id").notNull().references(() => emailTemplates.id, { onDelete: 'cascade' }),
  recipientEmail: varchar("recipient_email").notNull(),
  recipientName: varchar("recipient_name"),
  recipientId: varchar("recipient_id").references(() => users.id, { onDelete: 'set null' }),
  status: varchar("status", {
    enum: ["queued", "sent", "delivered", "opened", "clicked", "bounced", "failed", "unsubscribed"]
  }).notNull().default("queued"),
  sendGridMessageId: varchar("sendgrid_message_id"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  bouncedAt: timestamp("bounced_at"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Social Media Posts
export const socialMediaPosts = pgTable("social_media_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id"),
  platform: varchar("platform", {
    enum: ["twitter", "linkedin", "facebook", "instagram", "youtube"]
  }).notNull(),
  content: text("content").notNull(),
  mediaUrls: text("media_urls").array(),
  scheduledFor: timestamp("scheduled_for"),
  status: varchar("status", {
    enum: ["draft", "scheduled", "published", "failed", "deleted"]
  }).notNull().default("draft"),
  publishedAt: timestamp("published_at"),
  platformPostId: varchar("platform_post_id"),
  engagementMetrics: jsonb("engagement_metrics"),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Marketing Analytics
export const marketingAnalytics = pgTable("marketing_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => marketingCampaigns.id, { onDelete: 'cascade' }),
  date: timestamp("date").notNull(),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  cost: decimal("cost", { precision: 10, scale: 2 }).default("0"),
  leads: integer("leads").default(0),
  emailsSent: integer("emails_sent").default(0),
  emailsOpened: integer("emails_opened").default(0),
  emailsClicked: integer("emails_clicked").default(0),
  socialEngagements: integer("social_engagements").default(0),
  websiteVisits: integer("website_visits").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Lead Sources
export const leadSources = pgTable("lead_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  sourceType: varchar("source_type", {
    enum: ["organic", "paid_ads", "referral", "social_media", "email", "content", "event", "partner", "direct", "other"]
  }).notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }),
  totalLeads: integer("total_leads").default(0),
  qualifiedLeads: integer("qualified_leads").default(0),
  isActive: boolean("is_active").notNull().default(true),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CRM Leads
export const crmLeads = pgTable("crm_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: varchar("company_name").notNull(),
  contactPerson: varchar("contact_person").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  status: varchar("status", {
    enum: ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost", "cold", "hot", "warm"]
  }).notNull().default("new"),
  source: varchar("source"),
  estimatedValue: decimal("estimated_value", { precision: 12, scale: 2 }),
  notes: text("notes"),
  leadSourceId: varchar("lead_source_id").references(() => leadSources.id, { onDelete: 'set null' }),
  assignedTo: varchar("assigned_to").references(() => users.id, { onDelete: 'set null' }),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'set null' }),
  lastContactedAt: timestamp("last_contacted_at"),
  convertedAt: timestamp("converted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Partnerships
export const partnerships = pgTable("partnerships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerName: varchar("partner_name").notNull(),
  partnerType: varchar("partner_type", {
    enum: ["vendor", "reseller", "technology", "strategic", "affiliate", "channel"]
  }).notNull(),
  status: varchar("status", {
    enum: ["prospecting", "negotiating", "active", "inactive", "terminated"]
  }).notNull().default("prospecting"),
  contactPerson: varchar("contact_person"),
  contactEmail: varchar("contact_email"),
  contactPhone: varchar("contact_phone"),
  website: varchar("website"),
  description: text("description"),
  contractValue: decimal("contract_value", { precision: 12, scale: 2 }),
  contractStartDate: timestamp("contract_start_date"),
  contractEndDate: timestamp("contract_end_date"),
  terms: jsonb("terms"),
  benefits: text("benefits").array(),
  obligations: text("obligations").array(),
  performanceMetrics: jsonb("performance_metrics"),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'set null' }),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Market Analysis
export const marketAnalysis = pgTable("market_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  analysisType: varchar("analysis_type", {
    enum: ["competitor", "industry_trends", "customer_segment", "market_size", "swot", "pestel", "porters_five"]
  }).notNull(),
  description: text("description"),
  findings: jsonb("findings"),
  recommendations: text("recommendations").array(),
  dataSources: text("data_sources").array(),
  analysisDate: timestamp("analysis_date").defaultNow(),
  status: varchar("status", {
    enum: ["draft", "in_review", "approved", "archived"]
  }).notNull().default("draft"),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'set null' }),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  reviewedBy: varchar("reviewed_by").references(() => users.id, { onDelete: 'set null' }),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Strategic Plans
export const strategicPlans = pgTable("strategic_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  planType: varchar("plan_type", {
    enum: ["annual", "quarterly", "product_launch", "market_expansion", "digital_transformation", "cost_optimization"]
  }).notNull(),
  status: varchar("status", {
    enum: ["draft", "in_progress", "active", "completed", "on_hold", "cancelled"]
  }).notNull().default("draft"),
  objectives: jsonb("objectives"),
  keyResults: jsonb("key_results"),
  initiatives: jsonb("initiatives"),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  actualSpend: decimal("actual_spend", { precision: 12, scale: 2 }).default("0"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  progress: integer("progress").default(0),
  milestones: jsonb("milestones"),
  risks: jsonb("risks"),
  stakeholders: text("stakeholders").array(),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'set null' }),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Growth Metrics
export const growthMetrics = pgTable("growth_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricName: varchar("metric_name").notNull(),
  metricType: varchar("metric_type", {
    enum: ["revenue", "customers", "users", "market_share", "product_adoption", "engagement", "retention", "churn"]
  }).notNull(),
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  targetValue: decimal("target_value", { precision: 15, scale: 2 }),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  growthRate: decimal("growth_rate", { precision: 6, scale: 2 }),
  trend: varchar("trend", { enum: ["up", "down", "stable"] }),
  comparisonPeriod: jsonb("comparison_period"),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: 'set null' }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// CRM Lead Activities
export const leadActivities = pgTable("lead_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull(),
  activityType: varchar("activity_type", {
    enum: ["call", "email", "meeting", "demo", "proposal", "follow_up", "note", "status_change"]
  }).notNull(),
  subject: varchar("subject"),
  description: text("description"),
  outcome: varchar("outcome", {
    enum: ["successful", "unsuccessful", "no_answer", "scheduled", "pending"]
  }),
  scheduledFor: timestamp("scheduled_for"),
  completedAt: timestamp("completed_at"),
  assignedTo: varchar("assigned_to").notNull().references(() => users.id, { onDelete: 'cascade' }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Intelligent Issue Detection & Recommendations System
export const issueAlerts = pgTable("issue_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  issueType: varchar("issue_type", {
    enum: ["understaffing", "compliance_breach", "payment_delay", "scheduling_conflict", "skill_gap", "performance_issue", "resource_shortage", "budget_overrun", "safety_concern", "other"]
  }).notNull(),
  severity: varchar("severity", { enum: ["critical", "high", "medium", "low"] }).notNull(),
  status: varchar("status", { enum: ["active", "investigating", "resolved", "dismissed", "expired"] }).notNull().default("active"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  affectedModule: varchar("affected_module", {
    enum: ["jobs", "shifts", "timesheets", "payments", "compliance", "workers", "scheduling", "budget", "safety", "general"]
  }).notNull(),
  affectedEntityType: varchar("affected_entity_type"),
  affectedEntityId: varchar("affected_entity_id"),
  detectionMethod: varchar("detection_method", { enum: ["rule_based", "ai_powered", "hybrid", "manual"] }).notNull(),
  detectedBy: varchar("detected_by").references(() => users.id, { onDelete: 'set null' }),
  metadata: jsonb("metadata"),
  expiresAt: timestamp("expires_at"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const issueRecommendations = pgTable("issue_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  alertId: varchar("alert_id").notNull().references(() => issueAlerts.id, { onDelete: 'cascade' }),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  recommendationType: varchar("recommendation_type", {
    enum: ["automated_action", "manual_task", "policy_change", "resource_allocation", "workflow_adjustment", "training", "notification", "escalation"]
  }).notNull(),
  priority: integer("priority").notNull().default(1),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  estimatedImpact: varchar("estimated_impact", { enum: ["high", "medium", "low"] }),
  requiredPermissions: text("required_permissions").array(),
  automatable: boolean("automatable").notNull().default(false),
  actionMetadata: jsonb("action_metadata"),
  prerequisites: jsonb("prerequisites"),
  estimatedDuration: integer("estimated_duration_minutes"),
  costEstimate: decimal("cost_estimate", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const issueActions = pgTable("issue_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  alertId: varchar("alert_id").notNull().references(() => issueAlerts.id, { onDelete: 'cascade' }),
  recommendationId: varchar("recommendation_id").references(() => issueRecommendations.id, { onDelete: 'set null' }),
  actionType: varchar("action_type", {
    enum: ["automated", "manual", "scheduled", "dismissed"]
  }).notNull(),
  status: varchar("status", { enum: ["pending", "in_progress", "completed", "failed", "cancelled"] }).notNull().default("pending"),
  initiatedBy: varchar("initiated_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  assignedTo: varchar("assigned_to").references(() => users.id, { onDelete: 'set null' }),
  actionDetails: jsonb("action_details"),
  result: jsonb("result"),
  outcomeDescription: text("outcome_description"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const issueAlertsRelations = relations(issueAlerts, ({ many, one }) => ({
  recommendations: many(issueRecommendations),
  actions: many(issueActions),
  detectedByUser: one(users, { fields: [issueAlerts.detectedBy], references: [users.id] }),
  resolvedByUser: one(users, { fields: [issueAlerts.resolvedBy], references: [users.id] }),
}));

export const issueRecommendationsRelations = relations(issueRecommendations, ({ one }) => ({
  alert: one(issueAlerts, { fields: [issueRecommendations.alertId], references: [issueAlerts.id] }),
}));

export const issueActionsRelations = relations(issueActions, ({ one }) => ({
  alert: one(issueAlerts, { fields: [issueActions.alertId], references: [issueAlerts.id] }),
  recommendation: one(issueRecommendations, { fields: [issueActions.recommendationId], references: [issueRecommendations.id] }),
  initiator: one(users, { fields: [issueActions.initiatedBy], references: [users.id] }),
  assignee: one(users, { fields: [issueActions.assignedTo], references: [users.id] }),
}));

// Insert schemas for 360-degree feedback
export const insertPerformanceReviewCycleSchema = createInsertSchema(performanceReviewCycles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPerformanceReviewSchema = createInsertSchema(performanceReviews).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReviewParticipantSchema = createInsertSchema(reviewParticipants).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReviewCompetencySchema = createInsertSchema(reviewCompetencies).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReviewResponseSchema = createInsertSchema(reviewResponses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReviewGoalSchema = createInsertSchema(reviewGoals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReviewAnalyticsSchema = createInsertSchema(reviewAnalytics).omit({ id: true, createdAt: true, updatedAt: true });

// Types for 360-degree feedback
export type PerformanceReviewCycle = typeof performanceReviewCycles.$inferSelect;
export type InsertPerformanceReviewCycle = z.infer<typeof insertPerformanceReviewCycleSchema>;
export type PerformanceReview = typeof performanceReviews.$inferSelect;
export type InsertPerformanceReview = z.infer<typeof insertPerformanceReviewSchema>;
export type ReviewParticipant = typeof reviewParticipants.$inferSelect;
export type InsertReviewParticipant = z.infer<typeof insertReviewParticipantSchema>;
export type ReviewCompetency = typeof reviewCompetencies.$inferSelect;
export type InsertReviewCompetency = z.infer<typeof insertReviewCompetencySchema>;
export type ReviewResponse = typeof reviewResponses.$inferSelect;
export type InsertReviewResponse = z.infer<typeof insertReviewResponseSchema>;
export type ReviewGoal = typeof reviewGoals.$inferSelect;
export type InsertReviewGoal = z.infer<typeof insertReviewGoalSchema>;
export type ReviewAnalytics = typeof reviewAnalytics.$inferSelect;
export type InsertReviewAnalytics = z.infer<typeof insertReviewAnalyticsSchema>;

// Insert schemas for Intelligent Issue Detection
export const insertIssueAlertSchema = createInsertSchema(issueAlerts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertIssueRecommendationSchema = createInsertSchema(issueRecommendations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertIssueActionSchema = createInsertSchema(issueActions).omit({ id: true, createdAt: true, updatedAt: true });

// Types for Intelligent Issue Detection
export type IssueAlert = typeof issueAlerts.$inferSelect;
export type InsertIssueAlert = z.infer<typeof insertIssueAlertSchema>;
export type IssueRecommendation = typeof issueRecommendations.$inferSelect;
export type InsertIssueRecommendation = z.infer<typeof insertIssueRecommendationSchema>;
export type IssueAction = typeof issueActions.$inferSelect;
export type InsertIssueAction = z.infer<typeof insertIssueActionSchema>;

// Insert schemas for Marketing & Business Development
export const insertMarketingCampaignSchema = createInsertSchema(marketingCampaigns).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmailCampaignSendSchema = createInsertSchema(emailCampaignSends).omit({ id: true, createdAt: true });
export const insertSocialMediaPostSchema = createInsertSchema(socialMediaPosts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMarketingAnalyticsSchema = createInsertSchema(marketingAnalytics).omit({ id: true, createdAt: true });
export const insertLeadSourceSchema = createInsertSchema(leadSources).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCrmLeadSchema = createInsertSchema(crmLeads).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPartnershipSchema = createInsertSchema(partnerships).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMarketAnalysisSchema = createInsertSchema(marketAnalysis).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStrategicPlanSchema = createInsertSchema(strategicPlans).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGrowthMetricSchema = createInsertSchema(growthMetrics).omit({ id: true, createdAt: true });
export const insertLeadActivitySchema = createInsertSchema(leadActivities).omit({ id: true, createdAt: true });

// Types for Marketing & Business Development
export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type InsertMarketingCampaign = z.infer<typeof insertMarketingCampaignSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailCampaignSend = typeof emailCampaignSends.$inferSelect;
export type InsertEmailCampaignSend = z.infer<typeof insertEmailCampaignSendSchema>;
export type SocialMediaPost = typeof socialMediaPosts.$inferSelect;
export type InsertSocialMediaPost = z.infer<typeof insertSocialMediaPostSchema>;
export type MarketingAnalytics = typeof marketingAnalytics.$inferSelect;
export type InsertMarketingAnalytics = z.infer<typeof insertMarketingAnalyticsSchema>;
export type LeadSource = typeof leadSources.$inferSelect;
export type InsertLeadSource = z.infer<typeof insertLeadSourceSchema>;
export type CrmLead = typeof crmLeads.$inferSelect;
export type InsertCrmLead = z.infer<typeof insertCrmLeadSchema>;
export type Partnership = typeof partnerships.$inferSelect;
export type InsertPartnership = z.infer<typeof insertPartnershipSchema>;
export type MarketAnalysis = typeof marketAnalysis.$inferSelect;
export type InsertMarketAnalysis = z.infer<typeof insertMarketAnalysisSchema>;
export type StrategicPlan = typeof strategicPlans.$inferSelect;
export type InsertStrategicPlan = z.infer<typeof insertStrategicPlanSchema>;
export type GrowthMetric = typeof growthMetrics.$inferSelect;
export type InsertGrowthMetric = z.infer<typeof insertGrowthMetricSchema>;
export type LeadActivity = typeof leadActivities.$inferSelect;
export type InsertLeadActivity = z.infer<typeof insertLeadActivitySchema>;
