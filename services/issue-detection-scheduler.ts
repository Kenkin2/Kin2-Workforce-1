import logger from '../utils/logger';
import { IssueDetectionService } from './issue-detection-service';
import { IStorage } from '../storage';

export class IssueDetectionScheduler {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private detectionService: IssueDetectionService;
  
  constructor(private storage: IStorage) {
    this.detectionService = new IssueDetectionService(storage);
  }

  start(intervalMinutes: number = 15): void {
    if (this.isRunning) {
      logger.info('⚠️ Issue detection scheduler already running');
      return;
    }

    this.isRunning = true;
    const intervalMs = intervalMinutes * 60 * 1000;

    console.log(`🔍 Starting issue detection scheduler (runs every ${intervalMinutes} minutes)`);

    this.runDetection();

    this.intervalId = setInterval(() => {
      this.runDetection();
    }, intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('⏹️ Issue detection scheduler stopped');
  }

  private async runDetection(): Promise<void> {
    try {
      logger.info('🔍 Running scheduled issue detection...');
      const startTime = Date.now();

      const jobs = await this.storage.getJobs();
      const payments = await this.storage.getPayments();
      const shifts = await this.storage.getShifts();
      
      const alerts = await this.detectionService.detectAllIssues({
        jobs,
        payments,
        shifts
      });

      // Store detected issues in database
      if (alerts.length > 0) {
        const storedAlerts = await this.detectionService.storeDetectedIssues(alerts);
        console.log(`   💾 Stored ${storedAlerts.length} issue alerts in database`);
      } else {
        console.log(`   ✅ No issues detected - system healthy`);
      }

      const criticalAlerts = alerts.filter(a => a.alert.severity === 'critical');
      const highAlerts = alerts.filter(a => a.alert.severity === 'high');
      const mediumAlerts = alerts.filter(a => a.alert.severity === 'medium');
      const duration = Date.now() - startTime;

      console.log(`✅ Issue detection completed in ${duration}ms`);
      console.log(`   Found: ${criticalAlerts.length} critical, ${highAlerts.length} high, ${mediumAlerts.length} medium priority issues`);

      if (criticalAlerts.length > 0) {
        console.log(`   🚨 Critical issues detected requiring immediate attention!`);
      }
    } catch (error) {
      logger.error('❌ Error during scheduled issue detection:', error);
    }
  }

  async runNow(): Promise<void> {
    logger.info('🔍 Running on-demand issue detection...');
    await this.runDetection();
  }

  isSchedulerRunning(): boolean {
    return this.isRunning;
  }
}

export const createIssueDetectionScheduler = (storage: IStorage): IssueDetectionScheduler => {
  return new IssueDetectionScheduler(storage);
};
