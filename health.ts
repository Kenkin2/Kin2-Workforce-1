import { Router } from 'express'
export const health = Router()
health.get('/healthz', (_, res) => res.status(200).send('ok'))
health.get('/readyz', (_, res) => res.status(200).send('ready'))
