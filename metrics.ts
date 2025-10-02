import { Router } from 'express'
import client from 'prom-client'

const collectDefaultMetrics = client.collectDefaultMetrics
collectDefaultMetrics()

export const metrics = Router()
metrics.get('/metrics', async (_, res) => {
  try {
    res.set('Content-Type', client.register.contentType)
    res.end(await client.register.metrics())
  } catch (err) {
    res.status(500).send('metrics_error')
  }
})
