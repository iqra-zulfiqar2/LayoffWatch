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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  industry: varchar("industry").notNull(),
  employeeCount: varchar("employee_count"),
  logoUrl: varchar("logo_url"),
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
  eventDate: timestamp("event_date").notNull(),
  source: varchar("source"),
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

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  selectedCompany: one(companies, {
    fields: [users.selectedCompanyId],
    references: [companies.id],
  }),
  notifications: many(notifications),
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

// Insert schemas
export const insertCompanySchema = createInsertSchema(companies).pick({
  name: true,
  industry: true,
  employeeCount: true,
  logoUrl: true,
  status: true,
});

export const insertLayoffEventSchema = createInsertSchema(layoffEvents).pick({
  companyId: true,
  title: true,
  description: true,
  affectedEmployees: true,
  eventDate: true,
  source: true,
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

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type LayoffEvent = typeof layoffEvents.$inferSelect;
export type InsertLayoffEvent = z.infer<typeof insertLayoffEventSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type CompanyActivity = typeof companyActivities.$inferSelect;
export type InsertCompanyActivity = z.infer<typeof insertCompanyActivitySchema>;
