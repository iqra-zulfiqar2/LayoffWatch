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
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, desc, and, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserSelectedCompany(userId: string, companyId: string): Promise<void>;
  
  // Company operations
  searchCompanies(query: string): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompanyStatus(companyId: string, status: string): Promise<void>;
  getCompaniesWithLayoffStats(): Promise<{ total: number; recentLayoffs: number }>;
  
  // Layoff events
  getLayoffEventsByCompany(companyId: string): Promise<LayoffEvent[]>;
  createLayoffEvent(event: InsertLayoffEvent): Promise<LayoffEvent>;
  
  // Notifications
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  
  // Company activities
  getCompanyActivities(companyId: string): Promise<CompanyActivity[]>;
  createCompanyActivity(activity: InsertCompanyActivity): Promise<CompanyActivity>;
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
}

export const storage = new DatabaseStorage();
