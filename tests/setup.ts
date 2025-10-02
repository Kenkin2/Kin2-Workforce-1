import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { db } from '../server/db.js';
import { users, jobs, shifts, payments, organizations } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

// Test database setup
export const testDb = db;

// Test data helpers
export class TestDataFactory {
  static createTestUser(overrides = {}) {
    return {
      id: `test-user-${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      role: 'worker' as 'worker',
      organizationId: 'test-org',
      karmaCoins: 100,
      isActive: true,
      ...overrides
    };
  }

  static createTestJob(overrides = {}) {
    return {
      id: `test-job-${Date.now()}`,
      title: 'Test Job',
      description: 'Test job description',
      category: 'technology',
      status: 'active' as 'active',
      clientId: 'test-client',
      budget: 1000,
      location: 'Remote',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      skillsRequired: ['React', 'TypeScript'],
      experienceLevel: 'mid' as 'mid',
      ...overrides
    };
  }

  static createTestShift(overrides = {}) {
    return {
      id: `test-shift-${Date.now()}`,
      jobId: 'test-job',
      workerId: 'test-worker',
      startTime: new Date(),
      endTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
      status: 'scheduled' as 'scheduled',
      location: 'Office',
      ...overrides
    };
  }

  static createTestOrganization(overrides = {}) {
    return {
      id: `test-org-${Date.now()}`,
      name: 'Test Organization',
      subdomain: `test-${Date.now()}`,
      plan: 'professional' as 'professional',
      isActive: true,
      settings: {},
      branding: {},
      ...overrides
    };
  }
}

// Database cleanup helpers
export class TestDatabaseManager {
  private createdRecords = new Map<string, string[]>();

  async createTestUser(userData = {}) {
    const user = TestDataFactory.createTestUser(userData);
    await testDb.insert(users).values(user);
    this.trackRecord('users', user.id);
    return user;
  }

  async createTestJob(jobData = {}) {
    const job = TestDataFactory.createTestJob(jobData);
    await testDb.insert(jobs).values(job);
    this.trackRecord('jobs', job.id);
    return job;
  }

  async createTestShift(shiftData = {}) {
    const shift = TestDataFactory.createTestShift(shiftData);
    await testDb.insert(shifts).values(shift);
    this.trackRecord('shifts', shift.id);
    return shift;
  }

  async createTestOrganization(orgData = {}) {
    const org = TestDataFactory.createTestOrganization(orgData);
    await testDb.insert(organizations).values(org);
    this.trackRecord('organizations', org.id);
    return org;
  }

  private trackRecord(table: string, id: string) {
    if (!this.createdRecords.has(table)) {
      this.createdRecords.set(table, []);
    }
    this.createdRecords.get(table)!.push(id);
  }

  async cleanup() {
    // Clean up test records in reverse order to handle dependencies
    const cleanupOrder = ['shifts', 'jobs', 'payments', 'users', 'organizations'];
    
    for (const table of cleanupOrder) {
      const ids = this.createdRecords.get(table) || [];
      if (ids.length > 0) {
        await this.cleanupTable(table, ids);
      }
    }

    this.createdRecords.clear();
  }

  private async cleanupTable(table: string, ids: string[]) {
    try {
      switch (table) {
        case 'users':
          for (const id of ids) {
            await testDb.delete(users).where(eq(users.id, id));
          }
          break;
        case 'jobs':
          for (const id of ids) {
            await testDb.delete(jobs).where(eq(jobs.id, id));
          }
          break;
        case 'shifts':
          for (const id of ids) {
            await testDb.delete(shifts).where(eq(shifts.id, id));
          }
          break;
        case 'payments':
          for (const id of ids) {
            await testDb.delete(payments).where(eq(payments.id, id));
          }
          break;
        case 'organizations':
          for (const id of ids) {
            await testDb.delete(organizations).where(eq(organizations.id, id));
          }
          break;
      }
    } catch (error) {
      console.warn(`Failed to cleanup ${table}:`, error);
    }
  }
}

// Global test setup
export const testDbManager = new TestDatabaseManager();

beforeEach(async () => {
  // Setup runs before each test
  await testDbManager.cleanup();
});

afterEach(async () => {
  // Cleanup runs after each test
  await testDbManager.cleanup();
});

// Mock data generators
export class MockDataGenerator {
  static generateJobsData(count = 10) {
    return Array.from({ length: count }, (_, i) => ({
      id: `job-${i}`,
      title: `Test Job ${i + 1}`,
      description: `Description for job ${i + 1}`,
      category: ['technology', 'healthcare', 'construction'][i % 3],
      status: ['active', 'completed', 'draft'][i % 3] as const,
      clientId: `client-${i % 3}`,
      budget: 1000 + (i * 500),
      location: i % 2 === 0 ? 'Remote' : 'On-site',
      deadline: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
      skillsRequired: ['React', 'TypeScript', 'Node.js'].slice(0, (i % 3) + 1),
      experienceLevel: ['entry', 'mid', 'senior'][i % 3] as const,
      createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    }));
  }

  static generateUsersData(count = 20) {
    return Array.from({ length: count }, (_, i) => ({
      id: `user-${i}`,
      email: `user${i}@example.com`,
      firstName: `FirstName${i}`,
      lastName: `LastName${i}`,
      role: ['worker', 'client', 'admin'][i % 3] as const,
      organizationId: `org-${i % 3}`,
      karmaCoins: i * 10,
      isActive: i % 10 !== 0, // 90% active rate
      createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    }));
  }

  static generateShiftsData(count = 30) {
    return Array.from({ length: count }, (_, i) => ({
      id: `shift-${i}`,
      jobId: `job-${i % 10}`,
      workerId: `worker-${i % 20}`,
      startTime: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + i * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
      status: ['scheduled', 'in-progress', 'completed', 'cancelled'][i % 4] as const,
      location: i % 2 === 0 ? 'Office A' : 'Remote',
      notes: `Shift notes for ${i + 1}`,
      createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    }));
  }

  static generatePaymentsData(count = 15) {
    return Array.from({ length: count }, (_, i) => ({
      id: `payment-${i}`,
      jobId: `job-${i}`,
      workerId: `worker-${i % 10}`,
      amount: 500 + (i * 100),
      status: ['pending', 'completed', 'failed'][i % 3] as const,
      paymentMethod: 'stripe',
      stripePaymentIntentId: `pi_test_${i}`,
      createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    }));
  }
}

// Test utilities
export class TestUtils {
  static async waitForCondition(
    condition: () => Promise<boolean>,
    timeout = 5000,
    interval = 100
  ): Promise<void> {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  static generateRandomString(length = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static createDateRange(days = 30): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    return { start, end };
  }

  static async measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    return { result, duration };
  }
}

// Export test environment
export const testEnv = {
  db: testDb,
  dataFactory: TestDataFactory,
  dbManager: testDbManager,
  mockData: MockDataGenerator,
  utils: TestUtils
};