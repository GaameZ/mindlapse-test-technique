import { Worker, Job } from 'bullmq'
import Redis from 'ioredis'
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { config } from 'dotenv'
import { resolve } from 'node:path'
import type { AiAnalysisJobData } from '@mindlapse/shared'
import { AiAnalysisStatus as Status } from '@mindlapse/shared'
import { MockAiService } from './services/mock-ai.service.js'

config({ path: resolve(import.meta.dirname, '../../../.env') })

interface Database {
  suppliers: {
    id: string
    ai_risk_score: number | null
    ai_analysis: unknown | null
    ai_analysis_status: string
  }
}

// Validate environment variables
const REDIS_HOST = process.env.REDIS_HOST
if (!REDIS_HOST) {
  throw new Error('REDIS_HOST environment variable is required')
}

const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10)
if (isNaN(REDIS_PORT)) {
  throw new Error('REDIS_PORT must be a valid number')
}

const DB_HOST = process.env.DB_HOST
if (!DB_HOST) {
  throw new Error('DB_HOST environment variable is required')
}

const DB_PORT = parseInt(process.env.DB_PORT || '5432', 10)
if (isNaN(DB_PORT)) {
  throw new Error('DB_PORT must be a valid number')
}

const DB_USER = process.env.DB_USER
if (!DB_USER) {
  throw new Error('DB_USER environment variable is required')
}

const DB_PASSWORD = process.env.DB_PASSWORD || ''

const DB_DATABASE = process.env.DB_DATABASE
if (!DB_DATABASE) {
  throw new Error('DB_DATABASE environment variable is required')
}

const redisConnection = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
})

const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_DATABASE,
      max: 5,
    }),
  }),
})

// MOCK AI SERVICE
const aiService = new MockAiService()

/**
 * Process a single risk analysis job
 */
async function processRiskAnalysisJob(job: Job<AiAnalysisJobData>): Promise<void> {
  const {
    supplierId,
    supplierName,
    domain,
    category,
    status,
    contractEndDate,
    notes,
    organizationId,
  } = job.data

  console.log(`[Worker] Processing risk analysis for supplier: ${supplierName} (${supplierId})`)

  try {
    await db
      .updateTable('suppliers')
      .set({
        ai_analysis_status: Status.PENDING,
      })
      .where('id', '=', supplierId)
      .execute()

    const analysis = await aiService.analyzeSupplierRisk({
      supplierId,
      supplierName,
      domain,
      category,
      status,
      contractEndDate,
      notes,
      organizationId,
    })

    console.log(
      `[Worker] Analysis complete for ${supplierName}: Risk Score = ${analysis.riskScore}, Confidence = ${analysis.confidence}%`
    )

    await db
      .updateTable('suppliers')
      .set({
        ai_risk_score: analysis.riskScore,
        ai_analysis: JSON.stringify(analysis) as unknown,
        ai_analysis_status: Status.COMPLETE,
      })
      .where('id', '=', supplierId)
      .execute()

    console.log(`[Worker] Successfully updated supplier ${supplierId} with analysis results`)
  } catch (error) {
    console.error(`[Worker] Error processing job for supplier ${supplierId}:`, error)

    const attemptsMade = job.attemptsMade as number
    const maxAttempts = (job.opts.attempts as number | undefined) ?? 3

    if (attemptsMade >= maxAttempts) {
      await db
        .updateTable('suppliers')
        .set({
          ai_analysis_status: Status.ERROR,
        })
        .where('id', '=', supplierId)
        .execute()

      console.error(`[Worker] Max retries reached for supplier ${supplierId}, marked as ERROR`)
    }

    throw error
  }
}

const worker = new Worker<AiAnalysisJobData>('risk-analysis', processRiskAnalysisJob, {
  connection: redisConnection,
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 60000,
  },
  settings: {
    backoffStrategy: (attemptsMade: number) => {
      // Exponential backoff: 1s, 5s, 15s
      return Math.min(1000 * Math.pow(5, attemptsMade - 1), 15000)
    },
  },
})

worker.on('completed', (job: Job<AiAnalysisJobData>) => {
  console.log(`[Worker] ✅ Job ${job.id} completed successfully`)
})

worker.on('failed', (job: Job<AiAnalysisJobData> | undefined, error: Error) => {
  console.error(`[Worker] ❌ Job ${job?.id} failed:`, error.message)
})

worker.on('error', (error: Error) => {
  console.error('[Worker] Worker error:', error)
})

process.on('SIGTERM', async () => {
  console.log('[Worker] Received SIGTERM, shutting down gracefully...')
  await worker.close()
  await redisConnection.quit()
  await db.destroy()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('[Worker] Received SIGINT, shutting down gracefully...')
  await worker.close()
  await redisConnection.quit()
  await db.destroy()
  process.exit(0)
})
