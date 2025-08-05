import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  selectedCompanyId: varchar("selected_company_id"),
  phoneNumber: varchar("phone_number"),
  jobTitle: varchar("job_title"),
  emailNotifications: boolean("email_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(false),
  subscriptionPlan: varchar("subscription_plan").default("free"), // free, pro, premium
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("inactive"), // inactive, active, canceled, past_due
  subscriptionEndDate: timestamp("subscription_end_date"),
  password: varchar("password"), // For email/password authentication
  authProvider: varchar("auth_provider").default("replit"), // replit, email, google
  role: varchar("role").default("user"), // user, admin
  lastLoginAt: timestamp("last_login_at"),
  isEmailVerified: boolean("is_email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Magic link tokens table
export const magicLinkTokens = pgTable("magic_link_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  industry: varchar("industry").notNull(),
  location: varchar("location"), // Main location
  description: text("description"),
  website: varchar("website"),
  size: varchar("size"), // Employee count range or "Unknown"
  employeeCount: varchar("employee_count"),
  logoUrl: varchar("logo_url"),
  headquarters: varchar("headquarters"), // City, State  
  state: varchar("state"),
  country: varchar("country").default("United States"),
  latitude: varchar("latitude"),
  longitude: varchar("longitude"),
  status: varchar("status").notNull().default("safe"), // safe, monitoring, active_layoffs
  lastUpdate: timestamp("last_update").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const layoffEvents = pgTable("layoff_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  affectedEmployees: integer("affected_employees"),
  percentageOfWorkforce: varchar("percentage_of_workforce"),
  affectedJobTitles: text("affected_job_titles").array(),
  eventDate: timestamp("event_date").notNull(),
  noticeDate: timestamp("notice_date"), // WARN Act notice date
  effectiveDate: timestamp("effective_date"), // When layoffs actually take effect
  source: varchar("source"),
  sourceType: varchar("source_type").notNull().default("manual"), // "layoffs_fyi", "layoffdata", "warntracker", "manual"
  externalId: varchar("external_id"), // ID from external source
  
  // Enhanced location and job data
  city: varchar("city"),
  state: varchar("state"),
  country: varchar("country").default("United States"),
  
  // WARN Act specific fields
  warnNoticeRequired: boolean("warn_notice_required").default(false),
  warnNoticeDate: timestamp("warn_notice_date"),
  plantClosure: boolean("plant_closure").default(false),
  
  // Company financial data (from layoffs.fyi)
  fundingStage: varchar("funding_stage"), // "Seed", "Series A", "IPO", etc.
  companyValuation: varchar("company_valuation"), // Store as string to avoid bigint issues
  industry: varchar("industry"),
  
  // Government layoff specific fields
  isGovernmentLayoff: boolean("is_government_layoff").default(false),
  governmentDepartment: varchar("government_department"),
  layoffReason: varchar("layoff_reason"), // "DOGE Layoff", "Restructuring", etc.
  
  severity: varchar("severity").default("medium"), // low, medium, high, critical
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull().default("info"), // info, warning, danger
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const companyActivities = pgTable("company_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  description: text("description").notNull(),
  activityType: varchar("activity_type").notNull(), // layoff, hiring, earnings, announcement
  activityDate: timestamp("activity_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User company subscriptions table for paid users
export const userCompanySubscriptions = pgTable("user_company_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  companyId: varchar("company_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  selectedCompany: one(companies, {
    fields: [users.selectedCompanyId],
    references: [companies.id],
  }),
  notifications: many(notifications),
  companySubscriptions: many(userCompanySubscriptions),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  layoffEvents: many(layoffEvents),
  activities: many(companyActivities),
}));

export const layoffEventsRelations = relations(layoffEvents, ({ one }) => ({
  company: one(companies, {
    fields: [layoffEvents.companyId],
    references: [companies.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const companyActivitiesRelations = relations(companyActivities, ({ one }) => ({
  company: one(companies, {
    fields: [companyActivities.companyId],
    references: [companies.id],
  }),
}));

export const userCompanySubscriptionsRelations = relations(userCompanySubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [userCompanySubscriptions.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [userCompanySubscriptions.companyId],
    references: [companies.id],
  }),
}));

// Insert schemas
export const insertCompanySchema = createInsertSchema(companies).pick({
  name: true,
  industry: true,
  employeeCount: true,
  logoUrl: true,
  headquarters: true,
  state: true,
  country: true,
  latitude: true,
  longitude: true,
  status: true,
});

export const insertLayoffEventSchema = createInsertSchema(layoffEvents).pick({
  companyId: true,
  title: true,
  description: true,
  affectedEmployees: true,
  percentageOfWorkforce: true,
  affectedJobTitles: true,
  eventDate: true,
  source: true,
  severity: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  title: true,
  message: true,
  type: true,
});

export const insertCompanyActivitySchema = createInsertSchema(companyActivities).pick({
  companyId: true,
  description: true,
  activityType: true,
  activityDate: true,
});

export const updateUserProfileSchema = createInsertSchema(users).pick({
  firstName: true,
  lastName: true,
  phoneNumber: true,
  jobTitle: true,
  emailNotifications: true,
  smsNotifications: true,
}).extend({
  email: z.string().email(),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertMagicLinkToken = typeof magicLinkTokens.$inferInsert;
export type MagicLinkToken = typeof magicLinkTokens.$inferSelect;

// Magic link schemas
export const createMagicLinkSchema = createInsertSchema(magicLinkTokens).pick({
  email: true,
});

// Email/Password authentication schemas
export const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export type CreateMagicLinkRequest = z.infer<typeof createMagicLinkSchema>;
export type SignupRequest = z.infer<typeof signupSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type LayoffEvent = typeof layoffEvents.$inferSelect;
export type InsertLayoffEvent = z.infer<typeof insertLayoffEventSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type CompanyActivity = typeof companyActivities.$inferSelect;
export type InsertCompanyActivity = z.infer<typeof insertCompanyActivitySchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type UserCompanySubscription = typeof userCompanySubscriptions.$inferSelect;
export type InsertUserCompanySubscription = typeof userCompanySubscriptions.$inferInsert;

// Resume parsing interface
export interface ParsedResumeData {
  name: string;
  email: string;
  phone: string;
  profession: string;
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
    responsibilities: string[];
  }>;
  skills: string[];
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    gpa?: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    year: string;
  }>;
  achievements: string[];
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
  languages: string[];
  location: string;
  linkedin: string;
  github: string;
  website: string;
}

// Authentication request types
export const signupRequestSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginRequestSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export type SignupRequest = z.infer<typeof signupRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
