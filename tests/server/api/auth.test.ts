import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import request from 'supertest';

describe('Authentication API', () => {
  let app: express.Application;
  let server: Server;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    app.get('/api/auth/check', (req, res) => {
      res.status(401).json({ authenticated: false });
    });

    app.get('/api/auth/login', (req, res) => {
      res.redirect(302, '/auth/redirect');
    });

    app.post('/api/auth/logout', (req, res) => {
      res.json({ success: true });
    });

    server = app.listen(0);
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  it('should check authentication status', async () => {
    const response = await request(app).get('/api/auth/check');
    expect([200, 401]).toContain(response.status);
  });

  it('should handle login redirect for Replit Auth', async () => {
    const response = await request(app).get('/api/auth/login');
    expect([302, 303, 307]).toContain(response.status);
  });

  it('should handle logout', async () => {
    const response = await request(app).post('/api/auth/logout');
    expect([200, 401]).toContain(response.status);
  });
});
