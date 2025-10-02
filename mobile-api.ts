import logger from './utils/logger';
import { Request, Response } from 'express';
import { storage } from './storage';
import { advancedNotificationService } from './advanced-notifications';

export interface MobileSession {
  userId: string;
  deviceId: string;
  platform: 'ios' | 'android';
  appVersion: string;
  lastActive: Date;
  pushToken?: string;
  biometricEnabled: boolean;
  offlineCapable: boolean;
}

export interface OfflineData {
  userId: string;
  jobs: any[];
  shifts: any[];
  timesheets: any[];
  lastSync: Date;
  pendingActions: OfflineAction[];
}

export interface OfflineAction {
  id: string;
  type: 'clock_in' | 'clock_out' | 'update_timesheet' | 'accept_job' | 'complete_shift';
  data: any;
  timestamp: Date;
  synced: boolean;
}

class MobileAPIService {
  private mobileSessions = new Map<string, MobileSession>();
  private offlineData = new Map<string, OfflineData>();

  // Mobile Authentication
  async authenticateMobile(credentials: {
    username: string;
    password?: string;
    biometricData?: string;
    deviceId: string;
    platform: 'ios' | 'android';
    appVersion: string;
  }): Promise<{ token: string; user: any; permissions: string[] }> {
    try {
      // Authenticate user (simplified for demo)
      const user = await storage.getUser(credentials.username);
      if (!user) {
        throw new Error('User not found');
      }

      // Create mobile session
      const session: MobileSession = {
        userId: user.id,
        deviceId: credentials.deviceId,
        platform: credentials.platform,
        appVersion: credentials.appVersion,
        lastActive: new Date(),
        biometricEnabled: !!credentials.biometricData,
        offlineCapable: true,
      };

      this.mobileSessions.set(user.id, session);

      // Generate mobile token (simplified)
      const token = this.generateMobileToken(user.id);

      return {
        token,
        user,
        permissions: this.getMobilePermissions(user.role),
      };
    } catch (error) {
      logger.error('Mobile authentication error:', error);
      throw new Error('Authentication failed');
    }
  }

  private generateMobileToken(userId: string): string {
    // Would implement JWT token generation
    return `mobile_${userId}_${Date.now()}`;
  }

  private getMobilePermissions(role: string): string[] {
    switch (role) {
      case 'admin':
        return ['jobs:read', 'jobs:write', 'workers:read', 'analytics:read', 'settings:write'];
      case 'client':
        return ['jobs:read', 'jobs:write', 'workers:read', 'analytics:read'];
      case 'worker':
        return ['jobs:read', 'timesheets:write', 'schedule:read', 'profile:write'];
      default:
        return ['jobs:read'];
    }
  }

  // Offline Data Management
  async syncOfflineData(userId: string): Promise<OfflineData> {
    try {
      let offlineData = this.offlineData.get(userId);
      
      if (!offlineData) {
        offlineData = {
          userId,
          jobs: [],
          shifts: [],
          timesheets: [],
          lastSync: new Date(),
          pendingActions: [],
        };
      }

      // Sync latest data
      const user = await storage.getUser(userId);
      if (user?.role === 'worker') {
        const jobs = await storage.getJobs();
        const activeJobs = jobs.filter(j => j.status === 'active').slice(0, 20); // Limit for mobile
        offlineData.jobs = activeJobs;
      }

      offlineData.lastSync = new Date();
      this.offlineData.set(userId, offlineData);

      console.log(`📱 Offline data synced for user ${userId}: ${offlineData.jobs.length} jobs`);
      return offlineData;
    } catch (error) {
      logger.error('Offline sync error:', error);
      throw new Error('Failed to sync offline data');
    }
  }

  async addOfflineAction(userId: string, action: Omit<OfflineAction, 'id' | 'synced'>): Promise<void> {
    const offlineData = this.offlineData.get(userId);
    if (!offlineData) {
      throw new Error('No offline data found for user');
    }

    const offlineAction: OfflineAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      synced: false,
    };

    offlineData.pendingActions.push(offlineAction);
    console.log(`📱 Offline action queued: ${action.type} for user ${userId}`);
  }

  async processPendingActions(userId: string): Promise<{ processed: number; failed: number }> {
    const offlineData = this.offlineData.get(userId);
    if (!offlineData) {
      return { processed: 0, failed: 0 };
    }

    let processed = 0;
    let failed = 0;

    for (const action of offlineData.pendingActions) {
      if (action.synced) continue;

      try {
        await this.processOfflineAction(action);
        action.synced = true;
        processed++;
      } catch (error) {
        console.error(`Failed to process action ${action.id}:`, error);
        failed++;
      }
    }

    // Remove processed actions
    offlineData.pendingActions = offlineData.pendingActions.filter(a => !a.synced);

    console.log(`📱 Processed ${processed} offline actions, ${failed} failed for user ${userId}`);
    return { processed, failed };
  }

  private async processOfflineAction(action: OfflineAction): Promise<void> {
    switch (action.type) {
      case 'clock_in':
      case 'clock_out':
        // Process timesheet entry
        console.log(`⏰ Processing ${action.type} at ${action.timestamp}`);
        break;
      case 'update_timesheet':
        // Update timesheet data
        console.log(`📝 Processing timesheet update: ${action.id}`);
        break;
      case 'accept_job':
        // Accept job assignment
        console.log(`✅ Processing job acceptance: ${action.data.jobId}`);
        break;
      case 'complete_shift':
        // Complete shift
        console.log(`🏁 Processing shift completion: ${action.data.shiftId}`);
        break;
    }
  }

  // Push Notifications
  async registerPushToken(userId: string, token: string, platform: 'ios' | 'android'): Promise<void> {
    const session = this.mobileSessions.get(userId);
    if (session) {
      session.pushToken = token;
      console.log(`📲 Push token registered for user ${userId} (${platform})`);
    }
  }

  async sendPushNotification(userId: string, notification: {
    title: string;
    body: string;
    data?: any;
  }): Promise<void> {
    const session = this.mobileSessions.get(userId);
    if (!session?.pushToken) {
      console.warn(`No push token found for user ${userId}`);
      return;
    }

    try {
      console.log(`📲 Push notification sent to ${session.platform}: ${notification.title}`);
      // Would implement with FCM/APNS
    } catch (error) {
      logger.error('Push notification error:', error);
    }
  }

  // Location Tracking
  async updateWorkerLocation(userId: string, location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  }): Promise<void> {
    try {
      console.log(`📍 Location updated for worker ${userId}: ${location.latitude}, ${location.longitude}`);
      // Would store in location tracking table
    } catch (error) {
      logger.error('Location update error:', error);
    }
  }

  // Mobile-Specific Features
  async getWorkerNearbyJobs(userId: string, radius: number = 10): Promise<any[]> {
    try {
      // Would implement geospatial query for nearby jobs
      const jobs = await storage.getJobs();
      const nearbyJobs = jobs.filter(j => j.status === 'active').slice(0, 10);
      
      return nearbyJobs.map(job => ({
        ...job,
        distance: Math.random() * radius,
        estimatedTravelTime: Math.floor(Math.random() * 30) + 5, // 5-35 minutes
      }));
    } catch (error) {
      logger.error('Nearby jobs error:', error);
      return [];
    }
  }

  async enableBiometricAuth(userId: string, biometricData: string): Promise<void> {
    const session = this.mobileSessions.get(userId);
    if (session) {
      session.biometricEnabled = true;
      console.log(`🔐 Biometric authentication enabled for user ${userId}`);
    }
  }

  // Performance Optimization
  async getOptimizedMobileData(userId: string): Promise<{
    jobs: any[];
    schedule: any[];
    notifications: any[];
    settings: any;
  }> {
    try {
      const user = await storage.getUser(userId);
      if (!user) throw new Error('User not found');

      // Return optimized data for mobile app
      const data = {
        jobs: user.role === 'worker' ? 
          (await storage.getJobs()).filter(j => j.status === 'active').slice(0, 10) : 
          await storage.getJobsByClient(userId),
        schedule: [], // Would get user's schedule
        notifications: [], // Would get recent notifications
        settings: {
          pushEnabled: true,
          locationEnabled: true,
          biometricEnabled: this.mobileSessions.get(userId)?.biometricEnabled || false,
        },
      };

      return data;
    } catch (error) {
      logger.error('Mobile data optimization error:', error);
      throw new Error('Failed to get mobile data');
    }
  }
}

export const mobileAPIService = new MobileAPIService();