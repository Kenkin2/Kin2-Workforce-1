import { describe, it, expect } from 'vitest'
import request from 'supertest'
import express from 'express'
import { health } from '../src/routes/health'

describe('health endpoints', () => {
  const app = express().use(health)

  it('GET /healthz -> ok', async () => {
    const res = await request(app).get('/healthz')
    expect(res.status).toBe(200)
  })

  it('GET /readyz -> ready', async () => {
    const res = await request(app).get('/readyz')
    expect(res.status).toBe(200)
  })
})
