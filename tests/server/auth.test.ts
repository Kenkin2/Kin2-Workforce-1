import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../../server/db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

describe('Authentication Service', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'hashedPassword123',
    firstName: 'Test',
    lastName: 'User',
    role: 'worker' as const,
  };

  afterAll(async () => {
    await db.delete(users).where(eq(users.email, testUser.email));
  });

  it('should create a new user', async () => {
    const [newUser] = await db
      .insert(users)
      .values(testUser)
      .returning();

    expect(newUser).toBeDefined();
    expect(newUser.email).toBe(testUser.email);
    expect(newUser.firstName).toBe(testUser.firstName);
    expect(newUser.role).toBe(testUser.role);
  });

  it('should find user by email', async () => {
    const [foundUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, testUser.email));

    expect(foundUser).toBeDefined();
    expect(foundUser.email).toBe(testUser.email);
  });

  it('should not allow duplicate emails', async () => {
    await expect(async () => {
      await db.insert(users).values(testUser);
    }).rejects.toThrow();
  });
});
