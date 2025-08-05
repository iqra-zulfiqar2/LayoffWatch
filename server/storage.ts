import {
  users,
  companies,
  layoffEvents,
  notifications,
  companyActivities,
  userCompanySubscriptions,
  magicLinkTokens,
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
  type InsertMagicLinkToken,
  type MagicLinkToken,
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
  
  // Subscription methods
  updateUserSubscription(userId: string, plan: string): Promise<User>;
  updateUserCompanySubscriptions(userId: string, companyIds: string[]): Promise<void>;
  getUserCompanySubscriptions(userId: string): Promise<any[]>;
  
  // Magic link authentication
  createMagicLinkToken(token: InsertMagicLinkToken): Promise<MagicLinkToken>;
  getMagicLinkToken(token: string): Promise<MagicLinkToken | undefined>;
  useMagicLinkToken(token: string): Promise<void>;
  getUserByEmail(email: string): Promise<User | undefined>;
  
  // Email/password authentication
  createEmailUser(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    authProvider: string;
    isEmailVerified: boolean;
  }): Promise<User>;
  updateUserLastLogin(userId: string): Promise<void>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  
  // Admin operations
  getCompanyCount(): Promise<number>;
  getUserCount(): Promise<number>;
  getLayoffCount(): Promise<number>;
  getActiveMonitoringCount(): Promise<number>;
  getAllUsers(): Promise<User[]>;
  updateCompany(id: string, updates: Partial<Company>): Promise<Company>;
  deleteCompany(id: string): Promise<void>;
  getAllLayoffs(): Promise<LayoffEvent[]>;
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

  // Get all companies - this method is already defined below in admin section

  // Subscription methods

  async updateUserCompanySubscriptions(userId: string, companyIds: string[]): Promise<void> {
    // First, delete existing subscriptions
    await db.delete(userCompanySubscriptions).where(eq(userCompanySubscriptions.userId, userId));
    
    // Then insert new subscriptions
    if (companyIds.length > 0) {
      const subscriptions = companyIds.map(companyId => ({
        userId,
        companyId,
      }));
      await db.insert(userCompanySubscriptions).values(subscriptions);
    }
  }

  async getUserCompanySubscriptions(userId: string): Promise<any[]> {
    const subscriptions = await db
      .select({
        id: userCompanySubscriptions.id,
        userId: userCompanySubscriptions.userId,
        companyId: userCompanySubscriptions.companyId,
        companyName: companies.name,
        companyIndustry: companies.industry,
        companyStatus: companies.status,
        createdAt: userCompanySubscriptions.createdAt,
      })
      .from(userCompanySubscriptions)
      .innerJoin(companies, eq(userCompanySubscriptions.companyId, companies.id))
      .where(eq(userCompanySubscriptions.userId, userId));
    
    return subscriptions;
  }

  // Admin operations - removed duplicate getAllUsers method

  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(companies);
  }

  async getAllLayoffs(): Promise<LayoffEvent[]> {
    return await db.select().from(layoffEvents);
  }

  async updateUserSubscription(userId: string, plan: string, status: string = "active"): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        subscriptionPlan: plan,
        subscriptionStatus: status,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Magic link authentication methods
  async createMagicLinkToken(tokenData: InsertMagicLinkToken): Promise<MagicLinkToken> {
    const [token] = await db
      .insert(magicLinkTokens)
      .values(tokenData)
      .returning();
    return token;
  }

  async getMagicLinkToken(token: string): Promise<MagicLinkToken | undefined> {
    const [magicToken] = await db
      .select()
      .from(magicLinkTokens)
      .where(eq(magicLinkTokens.token, token));
    return magicToken;
  }

  async useMagicLinkToken(token: string): Promise<void> {
    await db
      .update(magicLinkTokens)
      .set({ usedAt: new Date() })
      .where(eq(magicLinkTokens.token, token));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));
    return user;
  }

  // Email/password authentication methods
  async createEmailUser(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    authProvider: string;
    isEmailVerified: boolean;
  }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        authProvider: userData.authProvider,
        isEmailVerified: userData.isEmailVerified,
        lastLoginAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Admin operations implementation
  async getCompanyCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(companies);
    return result[0]?.count || 0;
  }

  async getUserCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(users);
    return result[0]?.count || 0;
  }

  async getLayoffCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(layoffEvents);
    return result[0]?.count || 0;
  }

  async getActiveMonitoringCount(): Promise<number> {
    const result = await db.select({ count: count() })
      .from(companies)
      .where(eq(companies.status, 'monitoring'));
    return result[0]?.count || 0;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company> {
    const [company] = await db
      .update(companies)
      .set(updates)
      .where(eq(companies.id, id))
      .returning();
    return company;
  }

  async deleteCompany(id: string): Promise<void> {
    await db.delete(companies).where(eq(companies.id, id));
  }
}

export const storage = new DatabaseStorage();
