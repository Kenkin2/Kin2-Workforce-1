import express from 'express'
import { health } from './routes/health'
const app = express()
app.use(health)
const port = process.env.PORT || 8080
app.listen(port, () => console.log(`Kin2 listening on :${port}`))
