/**
 * Redis Cache Layer
 * Provides caching for AI analysis results, session lists, and batch job status.
 * Gracefully degrades to no-cache if Redis is unavailable.
 */

let redisClient: any = null
let redisAvailable = false

async function getRedisClient() {
  if (redisClient) return redisClient
  
  try {
    const { default: Redis } = await import('ioredis')
    const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 2000,
      lazyConnect: true,
    })
    
    await client.connect()
    await client.ping()
    redisClient = client
    redisAvailable = true
    console.log('✅ Redis connected')
    return redisClient
  } catch (err) {
    console.warn('⚠️ Redis unavailable, running without cache:', (err as Error).message)
    redisAvailable = false
    return null
  }
}

const CACHE_TTL = {
  SESSION_ANALYSIS: 60 * 60 * 24,    // 24 hours - AI analysis rarely changes
  SESSION_LIST: 60 * 5,               // 5 minutes - session list updates
  BATCH_STATUS: 60 * 2,              // 2 minutes - batch job status
  SUPERVISOR_SESSIONS: 60 * 3,       // 3 minutes
}

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const client = await getRedisClient()
    if (!client) return null
    
    try {
      const data = await client.get(key)
      if (!data) return null
      return JSON.parse(data) as T
    } catch (err) {
      console.warn('Cache get error:', err)
      return null
    }
  },

  async set(key: string, value: unknown, ttlSeconds: number = 300): Promise<void> {
    const client = await getRedisClient()
    if (!client) return
    
    try {
      await client.setex(key, ttlSeconds, JSON.stringify(value))
    } catch (err) {
      console.warn('Cache set error:', err)
    }
  },

  async delete(key: string): Promise<void> {
    const client = await getRedisClient()
    if (!client) return
    
    try {
      await client.del(key)
    } catch (err) {
      console.warn('Cache delete error:', err)
    }
  },

  async deletePattern(pattern: string): Promise<void> {
    const client = await getRedisClient()
    if (!client) return
    
    try {
      const keys = await client.keys(pattern)
      if (keys.length > 0) {
        await client.del(...keys)
      }
    } catch (err) {
      console.warn('Cache deletePattern error:', err)
    }
  },

  async isAvailable(): Promise<boolean> {
    const client = await getRedisClient()
    return !!client
  },

  keys: {
    sessionAnalysis: (sessionId: string) => `analysis:${sessionId}`,
    sessionList: (supervisorId: string, page: number) => `sessions:${supervisorId}:${page}`,
    batchStatus: (batchId: string) => `batch:${batchId}`,
    supervisorSessions: (supervisorId: string) => `supervisor:${supervisorId}:sessions`,
  },

  ttl: CACHE_TTL,
}
