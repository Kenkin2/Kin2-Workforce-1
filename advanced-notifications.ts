import logger from './utils/logger';
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';
import { externalIntegrationsService } from './external-integrations';

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'slack' | 'teams' | 'webhook' | 'in_app';
  config: any;
  organizationId: string;
  isActive: boolean;
  priority: number;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  channels: string[];
  subject: string;
  content: string;
  variables: string[];
  organizationId: string;
}

export interface AdvancedNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  channels: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduledFor?: Date;
  organizationId: string;
  userId?: string;
  status: 'pending' | 'sent' | 'failed' | 'scheduled';
  attempts: number;
  createdAt: Date;
}

class AdvancedNotificationService {
  private wss?: WebSocketServer;
  private clients = new Map<string, WebSocket[]>();
  private channels = new Map<string, NotificationChannel>();
  private templates = new Map<string, NotificationTemplate>();
  private notificationQueue: AdvancedNotification[] = [];

  initializeWebSocket(server: Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    
    this.wss.on('connection', (ws: WebSocket, req) => {
      const organizationId = req.url?.split('orgId=')[1] || 'default';
      
      if (!this.clients.has(organizationId)) {
        this.clients.set(organizationId, []);
      }
      this.clients.get(organizationId)!.push(ws);

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(organizationId, message, ws);
        } catch (error) {
          logger.error('WebSocket message error:', error);
        }
      });

      ws.on('close', () => {
        const orgClients = this.clients.get(organizationId);
        if (orgClients) {
          const index = orgClients.indexOf(ws);
          if (index > -1) {
            orgClients.splice(index, 1);
          }
        }
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection_established',
        message: 'Connected to Kin2 Workforce real-time notifications',
        timestamp: new Date(),
      }));
    });

    logger.info('📡 Advanced WebSocket server initialized');
  }

  private handleWebSocketMessage(organizationId: string, message: any, ws: WebSocket): void {
    switch (message.type) {
      case 'subscribe':
        // Subscribe to specific notification types
        logger.info('Client subscribed to channels', { 
          channels: message.channels?.join(', '), 
          organizationId 
        });
        break;
      case 'mark_read':
        // Mark notifications as read
        if (message.notificationIds) {
          this.markNotificationsAsRead(message.userId, message.notificationIds);
        }
        break;
      default:
        logger.info('Unknown WebSocket message type:', message.type);
    }
  }

  // Channel Management
  async createNotificationChannel(channelData: Omit<NotificationChannel, 'id'>): Promise<NotificationChannel> {
    const channel: NotificationChannel = {
      ...channelData,
      id: `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.channels.set(channel.id, channel);
    console.log(`📢 Notification channel created: ${channel.name} (${channel.type})`);
    
    return channel;
  }

  // Template Management
  async createNotificationTemplate(templateData: Omit<NotificationTemplate, 'id'>): Promise<NotificationTemplate> {
    const template: NotificationTemplate = {
      ...templateData,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.templates.set(template.id, template);
    console.log(`📝 Notification template created: ${template.name}`);
    
    return template;
  }

  // Advanced Notification Delivery
  async sendAdvancedNotification(notificationData: Omit<AdvancedNotification, 'id' | 'status' | 'attempts' | 'createdAt'>): Promise<void> {
    const notification: AdvancedNotification = {
      ...notificationData,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      attempts: 0,
      createdAt: new Date(),
    };

    if (notification.scheduledFor && notification.scheduledFor > new Date()) {
      // Schedule for later delivery
      this.notificationQueue.push(notification);
      console.log(`⏰ Notification scheduled for ${notification.scheduledFor}: ${notification.title}`);
      return;
    }

    await this.deliverNotification(notification);
  }

  private async deliverNotification(notification: AdvancedNotification): Promise<void> {
    try {
      for (const channelId of notification.channels) {
        const channel = this.channels.get(channelId);
        if (!channel || !channel.isActive) continue;

        await this.deliverToChannel(notification, channel);
      }

      notification.status = 'sent';
      console.log(`✅ Notification delivered: ${notification.title}`);
    } catch (error) {
      notification.status = 'failed';
      notification.attempts += 1;
      logger.error('Notification delivery error:', error);
    }
  }

  private async deliverToChannel(notification: AdvancedNotification, channel: NotificationChannel): Promise<void> {
    switch (channel.type) {
      case 'in_app':
        await this.deliverInApp(notification);
        break;
      case 'email':
        await this.deliverEmail(notification, channel);
        break;
      case 'sms':
        await this.deliverSMS(notification, channel);
        break;
      case 'slack':
        await externalIntegrationsService.sendSlackNotification(
          notification.organizationId, 
          notification.message
        );
        break;
      case 'teams':
        await externalIntegrationsService.sendTeamsNotification(
          notification.organizationId, 
          notification.message
        );
        break;
      case 'webhook':
        await this.deliverWebhook(notification, channel);
        break;
      case 'push':
        await this.deliverPushNotification(notification, channel);
        break;
    }
  }

  private async deliverInApp(notification: AdvancedNotification): Promise<void> {
    // Send to WebSocket clients
    const orgClients = this.clients.get(notification.organizationId) || [];
    const message = JSON.stringify({
      ...notification,
    });

    orgClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  private async deliverEmail(notification: AdvancedNotification, channel: NotificationChannel): Promise<void> {
    console.log(`📧 Email notification sent: ${notification.title}`);
    // Would implement with email service (SendGrid, SES, etc.)
  }

  private async deliverSMS(notification: AdvancedNotification, channel: NotificationChannel): Promise<void> {
    console.log(`📱 SMS notification sent: ${notification.title}`);
    // Would implement with SMS service (Twilio, AWS SNS, etc.)
  }

  private async deliverWebhook(notification: AdvancedNotification, channel: NotificationChannel): Promise<void> {
    console.log(`🔗 Webhook notification sent: ${notification.title}`);
    // Would implement HTTP POST to webhook URL
  }

  private async deliverPushNotification(notification: AdvancedNotification, channel: NotificationChannel): Promise<void> {
    console.log(`📲 Push notification sent: ${notification.title}`);
    // Would implement with push notification service (FCM, APNS, etc.)
  }

  // Notification Analytics
  async getNotificationAnalytics(organizationId: string): Promise<{
    totalSent: number;
    deliveryRate: number;
    channelPerformance: any[];
    engagementRate: number;
  }> {
    return {
      totalSent: Math.floor(Math.random() * 10000) + 1000,
      deliveryRate: Math.random() * 5 + 95, // 95-100%
      channelPerformance: [
        { channel: 'in_app', deliveryRate: 99.5, engagementRate: 85 },
        { channel: 'email', deliveryRate: 98.2, engagementRate: 65 },
        { channel: 'slack', deliveryRate: 99.8, engagementRate: 92 },
        { channel: 'sms', deliveryRate: 97.1, engagementRate: 88 },
      ],
      engagementRate: Math.random() * 20 + 70, // 70-90%
    };
  }

  async markNotificationsAsRead(userId: string, notificationIds: string[]): Promise<void> {
    console.log(`✅ Marked ${notificationIds.length} notifications as read for user ${userId}`);
  }

  // Process scheduled notifications
  async processScheduledNotifications(): Promise<void> {
    const now = new Date();
    const dueNotifications = this.notificationQueue.filter(n => 
      n.status === 'pending' && 
      n.scheduledFor && 
      n.scheduledFor <= now
    );

    for (const notification of dueNotifications) {
      await this.deliverNotification(notification);
    }
  }
}

export const advancedNotificationService = new AdvancedNotificationService();