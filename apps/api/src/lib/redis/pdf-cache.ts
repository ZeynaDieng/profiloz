import crypto from 'crypto'

/**
 * Service de cache PDF avec Redis
 * Permet d'éviter la régénération de PDF identiques
 */
export class PdfCacheService {
  private redis: any = null
  private enabled: boolean = false
  private defaultTtl: number = 30 // 30 secondes par défaut

  constructor() {
    this.initialize()
  }

  private async initialize() {
    try {
      const redisUrl = process.env.REDIS_URL
      if (!redisUrl) {
        console.log('Redis non configuré : cache PDF désactivé')
        return
      }

      // Import dynamique de ioredis
      const Redis = (await import('ioredis')).default
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => Math.min(times * 50, 2000),
      })

      this.redis.on('error', (err: Error) => {
        console.error('Erreur Redis:', err)
        this.enabled = false
      })

      this.redis.on('connect', () => {
        console.log('Redis connecté : cache PDF activé')
        this.enabled = true
      })

      this.defaultTtl = parseInt(process.env.REDIS_CACHE_TTL || '30', 10)
    } catch (error) {
      console.error('Impossible d\'initialiser Redis:', error)
      this.enabled = false
    }
  }

  /**
   * Génère une clé de cache unique basée sur le contenu du snapshot
   */
  private generateCacheKey(snapshot: any, kind: 'resume' | 'cover_letter' | 'dossier'): string {
    const content = JSON.stringify({
      kind,
      templateSlug: snapshot.templateSlug || snapshot.templateSlug,
      // Pour les CV : inclure les données essentielles
      ...(kind === 'resume' && {
        personalInfo: snapshot.personalInfo,
        summary: snapshot.summary,
        experiences: snapshot.experiences,
        educations: snapshot.educations,
        skills: snapshot.skills,
        languages: snapshot.languages,
        templateConfig: snapshot.templateConfig,
      }),
      // Pour les lettres : inclure le contenu
      ...(kind === 'cover_letter' && {
        templateSlug: snapshot.templateSlug,
        title: snapshot.title,
        content: snapshot.content,
        companyName: snapshot.companyName,
        position: snapshot.position,
      }),
      // Pour les dossiers : inclure CV + lettres
      ...(kind === 'dossier' && {
        resume: {
          templateSlug: snapshot.templateSlug,
          personalInfo: snapshot.personalInfo,
          experiences: snapshot.experiences,
        },
        letters: snapshot.letters?.map((l: any) => ({
          templateSlug: l.templateSlug,
          content: l.content,
        })),
      }),
    })

    const hash = crypto.createHash('sha256').update(content).digest('hex')
    return `pdf:cache:${kind}:${hash}`
  }

  /**
   * Récupère un PDF depuis le cache
   */
  async get(snapshot: any, kind: 'resume' | 'cover_letter' | 'dossier'): Promise<Buffer | null> {
    if (!this.enabled || !this.redis) return null

    try {
      const key = this.generateCacheKey(snapshot, kind)
      const cached = await this.redis.getBuffer(key)
      
      if (cached) {
        console.log(`Cache PDF hit : ${key}`)
        return cached
      }
      
      return null
    } catch (error) {
      console.error('Erreur lecture cache PDF:', error)
      return null
    }
  }

  /**
   * Stocke un PDF dans le cache
   */
  async set(snapshot: any, kind: 'resume' | 'cover_letter' | 'dossier', buffer: Buffer, ttl?: number): Promise<void> {
    if (!this.enabled || !this.redis) return

    try {
      const key = this.generateCacheKey(snapshot, kind)
      const cacheTtl = ttl || this.defaultTtl
      
      await this.redis.setex(key, cacheTtl, buffer)
      console.log(`Cache PDF set : ${key} (TTL: ${cacheTtl}s)`)
    } catch (error) {
      console.error('Erreur écriture cache PDF:', error)
    }
  }

  /**
   * Invalide le cache pour un snapshot spécifique
   */
  async invalidate(snapshot: any, kind: 'resume' | 'cover_letter' | 'dossier'): Promise<void> {
    if (!this.enabled || !this.redis) return

    try {
      const key = this.generateCacheKey(snapshot, kind)
      await this.redis.del(key)
      console.log(`Cache PDF invalidé : ${key}`)
    } catch (error) {
      console.error('Erreur invalidation cache PDF:', error)
    }
  }

  /**
   * Vide tout le cache PDF
   */
  async flush(): Promise<void> {
    if (!this.enabled || !this.redis) return

    try {
      const keys = await this.redis.keys('pdf:cache:*')
      if (keys.length > 0) {
        await this.redis.del(...keys)
        console.log(`Cache PDF vidé : ${keys.length} clés supprimées`)
      }
    } catch (error) {
      console.error('Erreur vidage cache PDF:', error)
    }
  }

  /**
   * Vérifie si le cache est actif
   */
  isActive(): boolean {
    return this.enabled
  }

  /**
   * Ferme la connexion Redis
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
      this.enabled = false
    }
  }
}

export const pdfCacheService = new PdfCacheService()
