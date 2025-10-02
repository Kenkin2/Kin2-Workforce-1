import { db } from "../db";
import { eq, and, desc, gte, lte, sql, count, like } from "drizzle-orm";
import {
  marketingCampaigns,
  emailTemplates,
  emailCampaignSends,
  socialMediaPosts,
  marketingAnalytics,
  leadSources,
  leadActivities,
  type MarketingCampaign,
  type EmailTemplate,
  type EmailCampaignSend,
  type SocialMediaPost,
  type MarketingAnalytics,
  type LeadSource,
  type LeadActivity,
  type InsertMarketingCampaign,
  type InsertEmailTemplate,
  type InsertEmailCampaignSend,
  type InsertSocialMediaPost,
  type InsertMarketingAnalytics,
  type InsertLeadSource,
  type InsertLeadActivity,
} from "@shared/schema";
import sgMail from "@sendgrid/mail";

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface CampaignMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalBudget: number;
  totalSpend: number;
  totalLeads: number;
  totalConversions: number;
  roi: number;
}

interface EmailPerformance {
  campaignId: string;
  campaignName: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  openRate: number;
  clickRate: number;
}

export class MarketingService {
  // Campaign Management
  async createCampaign(data: InsertMarketingCampaign): Promise<MarketingCampaign> {
    const [campaign] = await db
      .insert(marketingCampaigns)
      .values(data)
      .returning();
    
    return campaign;
  }

  async getCampaigns(organizationId?: string): Promise<MarketingCampaign[]> {
    const query = db
      .select()
      .from(marketingCampaigns)
      .orderBy(desc(marketingCampaigns.createdAt));

    if (organizationId) {
      return await query.where(eq(marketingCampaigns.organizationId, organizationId));
    }

    return await query;
  }

  async getCampaign(campaignId: string): Promise<MarketingCampaign | null> {
    const [campaign] = await db
      .select()
      .from(marketingCampaigns)
      .where(eq(marketingCampaigns.id, campaignId));
    
    return campaign || null;
  }

  async updateCampaign(campaignId: string, data: Partial<InsertMarketingCampaign>): Promise<MarketingCampaign> {
    const [updated] = await db
      .update(marketingCampaigns)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(marketingCampaigns.id, campaignId))
      .returning();
    
    return updated;
  }

  async deleteCampaign(campaignId: string): Promise<void> {
    await db
      .delete(marketingCampaigns)
      .where(eq(marketingCampaigns.id, campaignId));
  }

  // Email Template Management
  async createEmailTemplate(data: InsertEmailTemplate): Promise<EmailTemplate> {
    const [template] = await db
      .insert(emailTemplates)
      .values(data)
      .returning();
    
    return template;
  }

  async getEmailTemplates(organizationId?: string): Promise<EmailTemplate[]> {
    if (organizationId) {
      return await db
        .select()
        .from(emailTemplates)
        .where(and(
          eq(emailTemplates.isActive, true),
          eq(emailTemplates.organizationId, organizationId)
        ))
        .orderBy(desc(emailTemplates.createdAt));
    }

    return await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.isActive, true))
      .orderBy(desc(emailTemplates.createdAt));
  }

  async getEmailTemplate(templateId: string): Promise<EmailTemplate | null> {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, templateId));
    
    return template || null;
  }

  async updateEmailTemplate(templateId: string, data: Partial<InsertEmailTemplate>): Promise<EmailTemplate> {
    const [updated] = await db
      .update(emailTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(emailTemplates.id, templateId))
      .returning();
    
    return updated;
  }

  // Email Campaign Sends
  async sendEmailCampaign(
    campaignId: string,
    templateId: string,
    recipients: Array<{ email: string; name?: string; id?: string; variables?: any }>
  ): Promise<EmailCampaignSend[]> {
    const template = await this.getEmailTemplate(templateId);
    if (!template) {
      throw new Error("Email template not found");
    }

    const sends: EmailCampaignSend[] = [];

    for (const recipient of recipients) {
      // Create send record
      const [send] = await db
        .insert(emailCampaignSends)
        .values({
          campaignId,
          templateId,
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          recipientId: recipient.id,
          status: "queued",
          metadata: recipient.variables || {},
        })
        .returning();

      // Send via SendGrid if API key is available
      if (process.env.SENDGRID_API_KEY) {
        try {
          let personalizedContent = template.htmlContent;
          
          // Replace variables in content
          if (recipient.variables) {
            Object.entries(recipient.variables).forEach(([key, value]) => {
              personalizedContent = personalizedContent.replace(
                new RegExp(`{{${key}}}`, 'g'),
                String(value)
              );
            });
          }

          const msg = {
            to: recipient.email,
            from: process.env.SENDGRID_FROM_EMAIL || 'noreply@kin2workforce.com',
            subject: template.subject,
            html: personalizedContent,
            text: template.textContent || '',
          };

          const response = await sgMail.send(msg);
          
          // Update send status
          await db
            .update(emailCampaignSends)
            .set({
              status: "sent",
              sendGridMessageId: response[0].headers['x-message-id'],
              sentAt: new Date(),
            })
            .where(eq(emailCampaignSends.id, send.id));

          send.status = "sent";
          send.sentAt = new Date();
        } catch (error: any) {
          await db
            .update(emailCampaignSends)
            .set({
              status: "failed",
              errorMessage: error.message,
            })
            .where(eq(emailCampaignSends.id, send.id));

          send.status = "failed";
          send.errorMessage = error.message;
        }
      }

      sends.push(send);
    }

    return sends;
  }

  async getEmailCampaignSends(campaignId: string): Promise<EmailCampaignSend[]> {
    return await db
      .select()
      .from(emailCampaignSends)
      .where(eq(emailCampaignSends.campaignId, campaignId))
      .orderBy(desc(emailCampaignSends.createdAt));
  }

  async updateEmailSendStatus(
    sendId: string,
    status: EmailCampaignSend['status'],
    metadata?: any
  ): Promise<EmailCampaignSend> {
    const updateData: any = { status };
    
    if (status === "delivered") updateData.deliveredAt = new Date();
    if (status === "opened") updateData.openedAt = new Date();
    if (status === "clicked") updateData.clickedAt = new Date();
    if (status === "bounced") updateData.bouncedAt = new Date();
    
    if (metadata) updateData.metadata = metadata;

    const [updated] = await db
      .update(emailCampaignSends)
      .set(updateData)
      .where(eq(emailCampaignSends.id, sendId))
      .returning();
    
    return updated;
  }

  // Social Media Management
  async createSocialPost(data: InsertSocialMediaPost): Promise<SocialMediaPost> {
    const [post] = await db
      .insert(socialMediaPosts)
      .values(data)
      .returning();
    
    return post;
  }

  async getSocialPosts(organizationId?: string): Promise<SocialMediaPost[]> {
    const query = db
      .select()
      .from(socialMediaPosts)
      .orderBy(desc(socialMediaPosts.scheduledFor));

    if (organizationId) {
      return await query.where(eq(socialMediaPosts.organizationId, organizationId));
    }

    return await query;
  }

  async updateSocialPost(postId: string, data: Partial<InsertSocialMediaPost>): Promise<SocialMediaPost> {
    const [updated] = await db
      .update(socialMediaPosts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(socialMediaPosts.id, postId))
      .returning();
    
    return updated;
  }

  async publishSocialPost(postId: string, platformPostId: string): Promise<SocialMediaPost> {
    const [updated] = await db
      .update(socialMediaPosts)
      .set({
        status: "published",
        publishedAt: new Date(),
        platformPostId,
        updatedAt: new Date(),
      })
      .where(eq(socialMediaPosts.id, postId))
      .returning();
    
    return updated;
  }

  // Marketing Analytics
  async recordAnalytics(data: InsertMarketingAnalytics): Promise<MarketingAnalytics> {
    const [analytics] = await db
      .insert(marketingAnalytics)
      .values(data)
      .returning();
    
    return analytics;
  }

  async getCampaignAnalytics(
    campaignId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<MarketingAnalytics[]> {
    if (startDate && endDate) {
      return await db
        .select()
        .from(marketingAnalytics)
        .where(and(
          eq(marketingAnalytics.campaignId, campaignId),
          gte(marketingAnalytics.date, startDate),
          lte(marketingAnalytics.date, endDate)
        ))
        .orderBy(marketingAnalytics.date);
    }

    return await db
      .select()
      .from(marketingAnalytics)
      .where(eq(marketingAnalytics.campaignId, campaignId))
      .orderBy(marketingAnalytics.date);
  }

  async getEmailPerformance(campaignId: string): Promise<EmailPerformance> {
    const sends = await this.getEmailCampaignSends(campaignId);
    const campaign = await this.getCampaign(campaignId);
    
    const sent = sends.length;
    const delivered = sends.filter(s => s.status === "delivered" || s.status === "opened" || s.status === "clicked").length;
    const opened = sends.filter(s => s.status === "opened" || s.status === "clicked").length;
    const clicked = sends.filter(s => s.status === "clicked").length;
    const bounced = sends.filter(s => s.status === "bounced").length;

    return {
      campaignId,
      campaignName: campaign?.name || "",
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
      clickRate: delivered > 0 ? (clicked / delivered) * 100 : 0,
    };
  }

  // Lead Source Management
  async createLeadSource(data: InsertLeadSource): Promise<LeadSource> {
    const [source] = await db
      .insert(leadSources)
      .values(data)
      .returning();
    
    return source;
  }

  async getLeadSources(organizationId?: string): Promise<LeadSource[]> {
    if (organizationId) {
      return await db
        .select()
        .from(leadSources)
        .where(and(
          eq(leadSources.isActive, true),
          eq(leadSources.organizationId, organizationId)
        ))
        .orderBy(desc(leadSources.createdAt));
    }

    return await db
      .select()
      .from(leadSources)
      .where(eq(leadSources.isActive, true))
      .orderBy(desc(leadSources.createdAt));
  }

  async updateLeadSource(sourceId: string, data: Partial<InsertLeadSource>): Promise<LeadSource> {
    const [updated] = await db
      .update(leadSources)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(leadSources.id, sourceId))
      .returning();
    
    return updated;
  }

  // Lead Activity Tracking
  async recordLeadActivity(data: InsertLeadActivity): Promise<LeadActivity> {
    const [activity] = await db
      .insert(leadActivities)
      .values(data)
      .returning();
    
    return activity;
  }

  async getLeadActivities(leadId: string): Promise<LeadActivity[]> {
    return await db
      .select()
      .from(leadActivities)
      .where(eq(leadActivities.leadId, leadId))
      .orderBy(desc(leadActivities.createdAt));
  }

  // Campaign Metrics
  async getCampaignMetrics(organizationId?: string): Promise<CampaignMetrics> {
    const query = db
      .select()
      .from(marketingCampaigns);

    const campaigns = organizationId 
      ? await query.where(eq(marketingCampaigns.organizationId, organizationId))
      : await query;

    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === "active").length;
    const totalBudget = campaigns.reduce((sum, c) => sum + Number(c.budget || 0), 0);
    const totalSpend = campaigns.reduce((sum, c) => sum + Number(c.actualSpend || 0), 0);

    // Get analytics data
    const allAnalytics = await db
      .select()
      .from(marketingAnalytics);

    const totalLeads = allAnalytics.reduce((sum, a) => sum + (a.leads || 0), 0);
    const totalConversions = allAnalytics.reduce((sum, a) => sum + (a.conversions || 0), 0);
    const totalRevenue = allAnalytics.reduce((sum, a) => sum + Number(a.revenue || 0), 0);

    const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;

    return {
      totalCampaigns,
      activeCampaigns,
      totalBudget,
      totalSpend,
      totalLeads,
      totalConversions,
      roi,
    };
  }
}

export const marketingService = new MarketingService();
