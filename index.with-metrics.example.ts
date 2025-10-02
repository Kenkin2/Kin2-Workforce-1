import express from 'express'
import { health } from './routes/health'
import { metrics } from './routes/metrics'
import { env } from './config/env'

const app = express()
app.use(health)
app.use(metrics)

const port = Number(env.PORT || 8080)
app.listen(port, () => console.log(`Kin2 listening on :${port} (${env.NODE_ENV})`))
