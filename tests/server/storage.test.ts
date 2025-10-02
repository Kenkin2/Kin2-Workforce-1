import { describe, it, expect, beforeEach } from 'vitest';
import { testDbManager, testEnv } from '../setup';

describe('Storage Layer', () => {
  beforeEach(async () => {
    await testDbManager.cleanup();
  });

  describe('User Operations', () => {
    it('should create and retrieve a user', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        firstName: 'John',
        lastName: 'Doe',
        role: 'worker' as const,
      };

      const user = await testDbManager.createTestUser(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.role).toBe(userData.role);
    });
  });

  describe('Job Operations', () => {
    it('should create a job successfully', async () => {
      const jobData = {
        title: 'Senior Developer',
        description: 'Looking for a senior dev',
        status: 'active' as const,
      };

      const job = await testDbManager.createTestJob(jobData);

      expect(job).toBeDefined();
      expect(job.title).toBe(jobData.title);
      expect(job.status).toBe(jobData.status);
    });
  });

  describe('Shift Operations', () => {
    it('should create a shift successfully', async () => {
      const shiftData = {
        status: 'scheduled' as const,
        location: 'Office',
      };

      const shift = await testDbManager.createTestShift(shiftData);

      expect(shift).toBeDefined();
      expect(shift.status).toBe(shiftData.status);
      expect(shift.location).toBe(shiftData.location);
    });
  });

  describe('Test Utilities', () => {
    it('should wait for async condition', async () => {
      let counter = 0;
      const condition = async () => {
        counter++;
        return counter >= 3;
      };

      await testEnv.utils.waitForCondition(condition, 1000, 50);
      expect(counter).toBeGreaterThanOrEqual(3);
    });

    it('should generate random string', () => {
      const str1 = testEnv.utils.generateRandomString(10);
      const str2 = testEnv.utils.generateRandomString(10);

      expect(str1).toHaveLength(10);
      expect(str2).toHaveLength(10);
      expect(str1).not.toBe(str2);
    });

    it('should measure execution time', async () => {
      const result = await testEnv.utils.measureExecutionTime(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'done';
      });

      expect(result.result).toBe('done');
      expect(result.duration).toBeGreaterThanOrEqual(100);
    });
  });
});
