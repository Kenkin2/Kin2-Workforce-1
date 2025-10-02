import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage.js';
import logger from './utils/logger';

export interface NotificationPayload {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  read: boolean;
  category: 'system' | 'job' | 'payment' | 'shift' | 'automation' | 'security';
}

export interface UserConnection {
  userId: string;
  ws: WebSocket;
  lastSeen: Date;
  subscriptions: string[];
}

export class RealTimeNotificationService {
  private wss: WebSocketServer | null = null;
  private connections = new Map<string, UserConnection>();
  private pendingNotifications = new Map<string, NotificationPayload[]>();

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws/notifications' });
    
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    logger.info('📡 Real-time notification service initialized');
  }

  private handleConnection(ws: WebSocket, req: any): void {
    const userId = this.extractUserIdFromRequest(req);
    if (!userId) {
      ws.close(1008, 'Authentication required');
      return;
    }

    const connection: UserConnection = {
      userId,
      ws,
      lastSeen: new Date(),
      subscriptions: ['all'] // Default subscription
    };

    this.connections.set(userId, connection);
    console.log(`📱 User ${userId} connected to real-time notifications`);

    // Send pending notifications
    this.sendPendingNotifications(userId);

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(userId, message);
      } catch (error) {
        logger.error('Invalid WebSocket message:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      this.connections.delete(userId);
      console.log(`📱 User ${userId} disconnected from notifications`);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
      this.connections.delete(userId);
    });

    // Send welcome message
    this.sendToUser(userId, {
      id: `welcome-${Date.now()}`,
      userId,
      type: 'system',
      title: 'Connected',
      message: 'Real-time notifications are now active',
      priority: 'low',
      timestamp: new Date(),
      read: false,
      category: 'system'
    });
  }

  private extractUserIdFromRequest(req: any): string | null {
    // Extract user ID from session or token
    // This would need proper authentication integration
    const sessionId = req.headers.cookie?.match(/connect\.sid=([^;]+)/)?.[1];
    return sessionId ? `user-${sessionId.slice(-8)}` : null;
  }

  private handleClientMessage(userId: string, message: any): void {
    switch (message.type) {
      case 'subscribe':
        this.subscribe(userId, message.channels || []);
        break;
      case 'unsubscribe':
        this.unsubscribe(userId, message.channels || []);
        break;
      case 'mark_read':
        this.markNotificationRead(userId, message.notificationId);
        break;
      case 'ping':
        this.sendPong(userId);
        break;
    }
  }

  private subscribe(userId: string, channels: string[]): void {
    const connection = this.connections.get(userId);
    if (connection) {
      channels.forEach(channel => {
        if (!connection.subscriptions.includes(channel)) {
          connection.subscriptions.push(channel);
        }
      });
      this.connections.set(userId, connection);
    }
  }

  private unsubscribe(userId: string, channels: string[]): void {
    const connection = this.connections.get(userId);
    if (connection) {
      connection.subscriptions = connection.subscriptions.filter(
        sub => !channels.includes(sub)
      );
      this.connections.set(userId, connection);
    }
  }

  private markNotificationRead(userId: string, notificationId: string): void {
    const pending = this.pendingNotifications.get(userId) || [];
    const notification = pending.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  private sendPong(userId: string): void {
    const connection = this.connections.get(userId);
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify({ type: 'pong', timestamp: new Date() }));
    }
  }

  sendToUser(userId: string, notification: NotificationPayload): void {
    const connection = this.connections.get(userId);
    
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      // User is connected, send immediately
      connection.ws.send(JSON.stringify({
        type: 'notification',
        data: notification
      }));
      connection.lastSeen = new Date();
    } else {
      // User is offline, store for later delivery
      this.storePendingNotification(userId, notification);
    }

    // Also store in database for persistence
    this.persistNotification(notification);
  }

  broadcast(notification: Omit<NotificationPayload, 'userId'>, filter?: (userId: string) => boolean): void {
    this.connections.forEach((connection, userId) => {
      if (!filter || filter(userId)) {
        this.sendToUser(userId, { ...notification, userId });
      }
    });
  }

  sendToChannel(channel: string, notification: Omit<NotificationPayload, 'userId'>): void {
    this.connections.forEach((connection, userId) => {
      if (connection.subscriptions.includes(channel) || connection.subscriptions.includes('all')) {
        this.sendToUser(userId, { ...notification, userId });
      }
    });
  }

  private storePendingNotification(userId: string, notification: NotificationPayload): void {
    const pending = this.pendingNotifications.get(userId) || [];
    pending.push(notification);
    
    // Limit pending notifications to last 50
    if (pending.length > 50) {
      pending.splice(0, pending.length - 50);
    }
    
    this.pendingNotifications.set(userId, pending);
  }

  private sendPendingNotifications(userId: string): void {
    const pending = this.pendingNotifications.get(userId) || [];
    const connection = this.connections.get(userId);
    
    if (connection && pending.length > 0) {
      pending.forEach(notification => {
        if (connection.ws.readyState === WebSocket.OPEN) {
          connection.ws.send(JSON.stringify({
            type: 'notification',
            data: notification
          }));
        }
      });
      
      // Clear pending notifications after sending
      this.pendingNotifications.delete(userId);
    }
  }

  private async persistNotification(notification: NotificationPayload): Promise<void> {
    try {
      // Store notification in database for persistence and history
      await storage.createNotification({
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        priority: notification.priority,
        category: notification.category,
        read: false
      });
    } catch (error) {
      logger.error('Failed to persist notification:', error);
    }
  }

  getConnectedUsers(): string[] {
    return Array.from(this.connections.keys());
  }

  getUserConnection(userId: string): UserConnection | undefined {
    return this.connections.get(userId);
  }

  getConnectionStats(): any {
    const connections = Array.from(this.connections.values());
    return {
      totalConnected: connections.length,
      totalSubscriptions: connections.reduce((sum, conn) => sum + conn.subscriptions.length, 0),
      averageSubscriptions: connections.length > 0 
        ? connections.reduce((sum, conn) => sum + conn.subscriptions.length, 0) / connections.length 
        : 0,
      lastActivity: connections.length > 0 
        ? Math.max(...connections.map(conn => conn.lastSeen.getTime()))
        : 0
    };
  }

  // Specialized notification methods
  async notifyJobPosted(jobId: string, jobTitle: string, clientId: string): Promise<void> {
    // Notify all available workers about new job
    const availableWorkers = await storage.getAvailableWorkers();
    
    availableWorkers.forEach(worker => {
      this.sendToUser(worker.id, {
        id: `job-posted-${jobId}-${Date.now()}`,
        userId: worker.id,
        type: 'job_posted',
        title: 'New Job Available',
        message: `New job posted: ${jobTitle}`,
        data: { jobId, clientId },
        priority: 'medium',
        timestamp: new Date(),
        read: false,
        category: 'job'
      });
    });
  }

  async notifyShiftReminder(shiftId: string, workerId: string, minutesBefore = 30): Promise<void> {
    const shift = await storage.getShiftById(shiftId);
    if (!shift) return;

    const job = await storage.getJobById(shift.jobId);
    
    setTimeout(() => {
      this.sendToUser(workerId, {
        id: `shift-reminder-${shiftId}`,
        userId: workerId,
        type: 'shift_reminder',
        title: 'Upcoming Shift',
        message: `Your shift for "${job?.title}" starts in ${minutesBefore} minutes`,
        data: { shiftId, jobId: shift.jobId },
        priority: 'high',
        timestamp: new Date(),
        read: false,
        category: 'shift'
      });
    }, (minutesBefore * 60 * 1000));
  }

  async notifyPaymentProcessed(paymentId: string, workerId: string, amount: number): Promise<void> {
    this.sendToUser(workerId, {
      id: `payment-processed-${paymentId}`,
      userId: workerId,
      type: 'payment_processed',
      title: 'Payment Processed',
      message: `Payment of $${amount} has been processed and will be deposited shortly`,
      data: { paymentId, amount },
      priority: 'high',
      timestamp: new Date(),
      read: false,
      category: 'payment'
    });
  }

  async notifySystemAlert(alert: string, severity: 'info' | 'warning' | 'error'): Promise<void> {
    // Notify all admins about system alerts
    const admins = await storage.getUsersByRole('admin');
    
    admins.forEach(admin => {
      this.sendToUser(admin.id, {
        id: `system-alert-${Date.now()}`,
        userId: admin.id,
        type: 'system_alert',
        title: `System ${severity.toUpperCase()}`,
        message: alert,
        priority: severity === 'error' ? 'urgent' : severity === 'warning' ? 'high' : 'medium',
        timestamp: new Date(),
        read: false,
        category: 'system'
      });
    });
  }

  async sendBulkNotification(userIds: string[], notification: Omit<NotificationPayload, 'id' | 'userId'>): Promise<void> {
    userIds.forEach(userId => {
      this.sendToUser(userId, {
        ...notification,
        id: `bulk-${userId}-${Date.now()}`,
        userId
      });
    });
  }
}

export const realTimeNotificationService = new RealTimeNotificationService();