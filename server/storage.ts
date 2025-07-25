import {
  users,
  companies,
  layoffEvents,
  notifications,
  companyActivities,
  type User,
  type UpsertUser,
  type Company,
  type InsertCompany,
  type LayoffEvent,
  type InsertLayoffEvent,
  type Notification,
  type InsertNotification,
  type CompanyActivity,
  type InsertCompanyActivity,
  type UpdateUserProfile,
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, desc, and, isNull, gte, lte, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserSelectedCompany(userId: string, companyId: string): Promise<void>;
  updateUserProfile(userId: string, profile: UpdateUserProfile): Promise<User>;
  
  // Company operations
  searchCompanies(query: string): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompanyStatus(companyId: string, status: string): Promise<void>;
  getCompaniesWithLayoffStats(): Promise<{ total: number; recentLayoffs: number }>;
  
  // Layoff events
  getLayoffEventsByCompany(companyId: string): Promise<LayoffEvent[]>;
  createLayoffEvent(event: InsertLayoffEvent): Promise<LayoffEvent>;
  getHistoricalLayoffData(): Promise<{
    byYear: Array<{ year: number; count: number; employees: number }>;
    byIndustry: Array<{ industry: string; count: number; employees: number }>;
    byState: Array<{ state: string; count: number; employees: number }>;
    byJobTitle: Array<{ jobTitle: string; count: number }>;
  }>;
  getLayoffTrends(timeframe: 'month' | 'quarter' | 'year'): Promise<Array<{ period: string; count: number; employees: number }>>;
  
  // Notifications
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  
  // Company activities
  getCompanyActivities(companyId: string): Promise<CompanyActivity[]>;
  createCompanyActivity(activity: InsertCompanyActivity): Promise<CompanyActivity>;
  
  // Additional methods
  getRecentLayoffs(): Promise<any[]>;
  getAllCompanies(): Promise<Company[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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

  async updateUserSelectedCompany(userId: string, companyId: string): Promise<void> {
    await db
      .update(users)
      .set({ selectedCompanyId: companyId, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateUserProfile(userId: string, profile: UpdateUserProfile): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...profile,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Company operations
  async searchCompanies(query: string): Promise<Company[]> {
    return await db
      .select()
      .from(companies)
      .where(ilike(companies.name, `%${query}%`))
      .limit(10);
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }

  async updateCompanyStatus(companyId: string, status: string): Promise<void> {
    await db
      .update(companies)
      .set({ status, lastUpdate: new Date() })
      .where(eq(companies.id, companyId));
  }

  async getCompaniesWithLayoffStats(): Promise<{ total: number; recentLayoffs: number }> {
    const totalCompanies = await db.select().from(companies);
    const recentLayoffs = await db
      .select()
      .from(layoffEvents)
      .where(
        and(
          eq(layoffEvents.eventDate, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        )
      );
    
    return {
      total: totalCompanies.length,
      recentLayoffs: recentLayoffs.length,
    };
  }

  // Layoff events
  async getLayoffEventsByCompany(companyId: string): Promise<LayoffEvent[]> {
    return await db
      .select()
      .from(layoffEvents)
      .where(eq(layoffEvents.companyId, companyId))
      .orderBy(desc(layoffEvents.eventDate));
  }

  async createLayoffEvent(event: InsertLayoffEvent): Promise<LayoffEvent> {
    const [newEvent] = await db.insert(layoffEvents).values(event).returning();
    return newEvent;
  }

  async getHistoricalLayoffData(): Promise<{
    byYear: Array<{ year: number; count: number; employees: number }>;
    byIndustry: Array<{ industry: string; count: number; employees: number }>;
    byState: Array<{ state: string; count: number; employees: number }>;
    byJobTitle: Array<{ jobTitle: string; count: number }>;
  }> {
    // By Year
    const byYear = await db
      .select({
        year: sql<number>`EXTRACT(YEAR FROM ${layoffEvents.eventDate})`,
        count: count(),
        employees: sql<number>`COALESCE(SUM(${layoffEvents.affectedEmployees}), 0)`,
      })
      .from(layoffEvents)
      .groupBy(sql`EXTRACT(YEAR FROM ${layoffEvents.eventDate})`)
      .orderBy(sql`EXTRACT(YEAR FROM ${layoffEvents.eventDate}) DESC`);

    // By Industry
    const byIndustry = await db
      .select({
        industry: companies.industry,
        count: count(),
        employees: sql<number>`COALESCE(SUM(${layoffEvents.affectedEmployees}), 0)`,
      })
      .from(layoffEvents)
      .innerJoin(companies, eq(layoffEvents.companyId, companies.id))
      .groupBy(companies.industry)
      .orderBy(desc(count()));

    // By State
    const byState = await db
      .select({
        state: companies.state,
        count: count(),
        employees: sql<number>`COALESCE(SUM(${layoffEvents.affectedEmployees}), 0)`,
      })
      .from(layoffEvents)
      .innerJoin(companies, eq(layoffEvents.companyId, companies.id))
      .where(sql`${companies.state} IS NOT NULL`)
      .groupBy(companies.state)
      .orderBy(desc(count()));

    // By Job Title (from affected job titles array)
    const byJobTitle = await db
      .select({
        jobTitle: sql<string>`unnest(${layoffEvents.affectedJobTitles})`,
        count: count(),
      })
      .from(layoffEvents)
      .where(sql`${layoffEvents.affectedJobTitles} IS NOT NULL`)
      .groupBy(sql`unnest(${layoffEvents.affectedJobTitles})`)
      .orderBy(desc(count()));

    return {
      byYear,
      byIndustry,
      byState: byState.filter(item => item.state),
      byJobTitle,
    };
  }

  async getLayoffTrends(timeframe: 'month' | 'quarter' | 'year'): Promise<Array<{ period: string; count: number; employees: number }>> {
    let dateFormat: string;
    let dateTrunc: string;

    switch (timeframe) {
      case 'month':
        dateFormat = 'YYYY-MM';
        dateTrunc = 'month';
        break;
      case 'quarter':
        dateFormat = 'YYYY-Q';
        dateTrunc = 'quarter';
        break;
      case 'year':
        dateFormat = 'YYYY';
        dateTrunc = 'year';
        break;
    }

    const trends = await db
      .select({
        period: sql<string>`TO_CHAR(DATE_TRUNC('${sql.raw(dateTrunc)}', ${layoffEvents.eventDate}), '${sql.raw(dateFormat)}')`,
        count: count(),
        employees: sql<number>`COALESCE(SUM(${layoffEvents.affectedEmployees}), 0)`,
      })
      .from(layoffEvents)
      .groupBy(sql`DATE_TRUNC('${sql.raw(dateTrunc)}', ${layoffEvents.eventDate})`)
      .orderBy(sql`DATE_TRUNC('${sql.raw(dateTrunc)}', ${layoffEvents.eventDate}) DESC`)
      .limit(12);

    return trends;
  }

  // Notifications
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(
        userId ? eq(notifications.userId, userId) : isNull(notifications.userId)
      )
      .orderBy(desc(notifications.createdAt))
      .limit(10);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  // Company activities
  async getCompanyActivities(companyId: string): Promise<CompanyActivity[]> {
    return await db
      .select()
      .from(companyActivities)
      .where(eq(companyActivities.companyId, companyId))
      .orderBy(desc(companyActivities.activityDate))
      .limit(10);
  }

  async createCompanyActivity(activity: InsertCompanyActivity): Promise<CompanyActivity> {
    const [newActivity] = await db.insert(companyActivities).values(activity).returning();
    return newActivity;
  }

  // Recent layoffs
  async getRecentLayoffs(): Promise<any[]> {
    const layoffs = await db
      .select({
        id: layoffEvents.id,
        title: layoffEvents.title,
        description: layoffEvents.description,
        affectedEmployees: layoffEvents.affectedEmployees,
        eventDate: layoffEvents.eventDate,
        severity: layoffEvents.severity,
        company: companies.name,
      })
      .from(layoffEvents)
      .innerJoin(companies, eq(layoffEvents.companyId, companies.id))
      .orderBy(desc(layoffEvents.eventDate))
      .limit(20);
    return layoffs;
  }

  // Get all companies
  async getAllCompanies(): Promise<Company[]> {
    const companyList = await db
      .select()
      .from(companies)
      .orderBy(companies.name);
    return companyList;
  }
}

export const storage = new DatabaseStorage();
