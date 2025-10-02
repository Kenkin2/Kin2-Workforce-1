import logger from './utils/logger';
import { WebSocketServer } from 'ws';
import type { Server } from 'http';
import { storage } from './storage';

export interface NotificationPayload {
  id: string;
  type: 'job_posted' | 'shift_assigned' | 'timesheet_approved' | 'payment_processed' | 'course_completed' | 'system_alert';
  title: string;
  message: string;
  userId: string;
  metadata?: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
}

class NotificationService {
  private wss: WebSocketServer | null = null;
  private clients = new Map<string, Set<any>>();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/api/notifications/ws'
    });

    this.wss.on('connection', (ws, req) => {
      ws.on('message', (data) => {
        try {
          const { userId, action } = JSON.parse(data.toString());
          
          if (action === 'subscribe' && userId) {
            this.addClient(userId, ws);
            ws.send(JSON.stringify({ 
              type: 'connected', 
              message: 'Real-time notifications enabled' 
            }));
          }
        } catch (error) {
          logger.error('WebSocket message error:', error);
        }
      });

      ws.on('close', () => {
        this.removeClient(ws);
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        this.removeClient(ws);
      });
    });

    logger.info('✅ Real-time notification service initialized');
  }

  private addClient(userId: string, ws: any) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(ws);
  }

  private removeClient(ws: any) {
    Array.from(this.clients.entries()).forEach(([userId, clients]) => {
      clients.delete(ws);
      if (clients.size === 0) {
        this.clients.delete(userId);
      }
    });
  }

  async sendNotification(notification: NotificationPayload) {
    // Store notification in database
    await storage.createActivity({
      userId: notification.userId,
      type: notification.type,
      description: notification.message,
      metadata: {
        ...notification.metadata,
        priority: notification.priority,
        title: notification.title
      }
    });

    // Send real-time notification via WebSocket
    const userClients = this.clients.get(notification.userId);
    if (userClients) {
      const payload = JSON.stringify({
        type: 'notification',
        data: notification
      });

      userClients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(payload);
        }
      });
    }

    // Send email notification for high priority items
    if (notification.priority === 'high' || notification.priority === 'urgent') {
      await this.sendEmailNotification(notification);
    }
  }

  private async sendEmailNotification(notification: NotificationPayload) {
    // In a real implementation, integrate with email service like SendGrid, Mailgun, etc.
    console.log(`📧 Email notification would be sent: ${notification.title} to user ${notification.userId}`);
  }

  async sendToRole(role: 'admin' | 'client' | 'worker', notification: Omit<NotificationPayload, 'userId'>) {
    const users = await storage.getUsersByRole(role);
    
    for (const user of users) {
      await this.sendNotification({
        ...notification,
        userId: user.id
      });
    }
  }

  async sendSystemAlert(message: string, priority: NotificationPayload['priority'] = 'medium') {
    // Send to all admins
    await this.sendToRole('admin', {
      id: `system-${Date.now()}`,
      type: 'system_alert',
      title: 'System Alert',
      message,
      priority,
      createdAt: new Date()
    });
  }

  // Predefined notification templates
  async notifyJobPosted(jobId: string, jobTitle: string, clientId: string) {
    await this.sendToRole('worker', {
      id: `job-posted-${jobId}`,
      type: 'job_posted',
      title: 'New Job Available',
      message: `A new job "${jobTitle}" has been posted and is available for applications.`,
      priority: 'medium',
      metadata: { jobId },
      createdAt: new Date()
    });
  }

  async notifyShiftAssigned(shiftId: string, workerId: string, jobTitle: string) {
    await this.sendNotification({
      id: `shift-assigned-${shiftId}`,
      type: 'shift_assigned',
      title: 'Shift Assigned',
      message: `You have been assigned to work on "${jobTitle}". Check your schedule for details.`,
      userId: workerId,
      priority: 'high',
      metadata: { shiftId },
      createdAt: new Date()
    });
  }

  async notifyTimesheetApproved(timesheetId: string, workerId: string, amount: number) {
    await this.sendNotification({
      id: `timesheet-approved-${timesheetId}`,
      type: 'timesheet_approved',
      title: 'Timesheet Approved',
      message: `Your timesheet has been approved. Payment of £${amount.toFixed(2)} is being processed.`,
      userId: workerId,
      priority: 'high',
      metadata: { timesheetId, amount },
      createdAt: new Date()
    });
  }

  async notifyPaymentProcessed(paymentId: string, workerId: string, amount: number) {
    await this.sendNotification({
      id: `payment-processed-${paymentId}`,
      type: 'payment_processed',
      title: 'Payment Processed',
      message: `Payment of £${amount.toFixed(2)} has been successfully processed to your account.`,
      userId: workerId,
      priority: 'high',
      metadata: { paymentId, amount },
      createdAt: new Date()
    });
  }

  async notifyCourseCompleted(courseId: string, userId: string, courseTitle: string, karmaReward: number) {
    await this.sendNotification({
      id: `course-completed-${courseId}`,
      type: 'course_completed',
      title: 'Course Completed',
      message: `Congratulations! You've completed "${courseTitle}" and earned ${karmaReward} KarmaCoins.`,
      userId,
      priority: 'medium',
      metadata: { courseId, karmaReward },
      createdAt: new Date()
    });
  }
}

export const notificationService = new NotificationService();