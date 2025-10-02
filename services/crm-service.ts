import { db } from "../db";
import { eq, and, desc, like, or, sql } from "drizzle-orm";
import {
  crmLeads,
  type CrmLead,
  type InsertCrmLead,
} from "@shared/schema";
import { NotFoundError } from "../middleware/error-handler";

export class CrmService {
  async createLead(data: InsertCrmLead): Promise<CrmLead> {
    const [lead] = await db
      .insert(crmLeads)
      .values(data)
      .returning();
    
    return lead;
  }

  async getLeads(organizationId?: string): Promise<CrmLead[]> {
    const query = db
      .select()
      .from(crmLeads)
      .orderBy(desc(crmLeads.createdAt));

    if (organizationId) {
      return await query.where(eq(crmLeads.organizationId, organizationId));
    }

    return await query;
  }

  async getLead(leadId: string): Promise<CrmLead | null> {
    const [lead] = await db
      .select()
      .from(crmLeads)
      .where(eq(crmLeads.id, leadId));
    
    return lead || null;
  }

  async updateLead(leadId: string, data: Partial<InsertCrmLead>): Promise<CrmLead> {
    const [updated] = await db
      .update(crmLeads)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(crmLeads.id, leadId))
      .returning();
    
    if (!updated) {
      throw new NotFoundError('Lead', { id: leadId });
    }
    
    return updated;
  }

  async deleteLead(leadId: string): Promise<void> {
    const lead = await this.getLead(leadId);
    
    if (!lead) {
      throw new NotFoundError('Lead', { id: leadId });
    }
    
    await db
      .delete(crmLeads)
      .where(eq(crmLeads.id, leadId));
  }

  async getLeadsByStatus(status: string, organizationId?: string): Promise<CrmLead[]> {
    if (organizationId) {
      return await db
        .select()
        .from(crmLeads)
        .where(
          and(
            eq(crmLeads.status, status as any),
            eq(crmLeads.organizationId, organizationId)
          )
        )
        .orderBy(desc(crmLeads.createdAt));
    }

    return await db
      .select()
      .from(crmLeads)
      .where(eq(crmLeads.status, status as any))
      .orderBy(desc(crmLeads.createdAt));
  }

  async searchLeads(searchTerm: string, organizationId?: string): Promise<CrmLead[]> {
    const searchPattern = `%${searchTerm}%`;
    let conditions = or(
      like(crmLeads.companyName, searchPattern),
      like(crmLeads.contactPerson, searchPattern),
      like(crmLeads.email, searchPattern)
    );

    if (organizationId) {
      conditions = and(
        conditions,
        eq(crmLeads.organizationId, organizationId)
      );
    }

    return await db
      .select()
      .from(crmLeads)
      .where(conditions)
      .orderBy(desc(crmLeads.createdAt));
  }

  async getLeadStats(organizationId?: string) {
    let query = db
      .select({
        status: crmLeads.status,
        count: sql<number>`count(*)::int`,
        totalValue: sql<string>`sum(${crmLeads.estimatedValue})::text`,
      })
      .from(crmLeads)
      .groupBy(crmLeads.status);

    if (organizationId) {
      query = query.where(eq(crmLeads.organizationId, organizationId)) as any;
    }

    return await query;
  }
}

export const crmService = new CrmService();
