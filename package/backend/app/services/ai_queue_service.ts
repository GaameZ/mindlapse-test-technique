import { Queue } from 'bullmq'
import { Redis } from 'ioredis'
import env from '#start/env'
import type { AiAnalysisJobData } from '@mindlapse/shared'

class AiQueueService {
  private queue: Queue<AiAnalysisJobData>
  private connection: Redis

  constructor() {
    this.connection = new Redis({
      host: env.get('REDIS_HOST'),
      port: env.get('REDIS_PORT'),
      maxRetriesPerRequest: null,
    })

    this.queue = new Queue<AiAnalysisJobData>('risk-analysis', {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: {
          age: 24 * 3600,
          count: 1000,
        },
        removeOnFail: {
          age: 7 * 24 * 3600,
        },
      },
    })
  }

  async enqueueRiskAnalysis(data: AiAnalysisJobData): Promise<string> {
    const job = await this.queue.add('analyze-risk', data, {
      jobId: `risk-analysis-${data.supplierId}-${Date.now()}`,
      priority: this.calculatePriority(data),
    })

    console.log(`[AiQueue] Enqueued risk analysis job ${job.id} for supplier ${data.supplierName}`)

    return job.id!
  }

  private calculatePriority(data: AiAnalysisJobData): number {
    if (data.category === 'infrastructure') return 1

    if (data.category === 'saas') return 5

    return 10
  }

  async close(): Promise<void> {
    await this.queue.close()
    await this.connection.quit()
  }
}

export const aiQueueService = new AiQueueService()

process.on('SIGTERM', async () => {
  await aiQueueService.close()
})

process.on('SIGINT', async () => {
  await aiQueueService.close()
})
