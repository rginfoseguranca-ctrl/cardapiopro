import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import path from 'path'
import * as Sentry from '@sentry/node'
import { initDatabase } from './database'
import { logger, createChildLogger } from './logger'
import productsRouter from './routes/products'
import ordersRouter from './routes/orders'
import promotionsRouter from './routes/promotions'
import dashboardRouter from './routes/dashboard'
import customersRouter from './routes/customers'
import customersPublicRouter from './routes/customers-public'
import reviewsRouter from './routes/reviews'
import chatRouter from './routes/chat'
import authRouter from './routes/auth'
import tablesRouter from './routes/tables'
import couponsRouter from './routes/coupons'
import loyaltyRouter from './routes/loyalty'
import campaignsRouter from './routes/campaigns'
import cashbackRouter from './routes/cashback'
import abandonedRouter from './routes/abandoned'
import { adminRouter as integrationsAdminRouter, webhookRouter as integrationsWebhookRouter } from './routes/integrations'
import cashRegisterRouter from './routes/cash-register'
import inventoryRouter from './routes/inventory'
import invoicesRouter from './routes/invoices'
import deliveryRouter from './routes/delivery'
import printersRouter from './routes/printers'
import fiadoRouter from './routes/fiado'
import blogRouter from './routes/blog'
import partnersRouter from './routes/partners'
import leadsRouter from './routes/leads'
import storeRouter from './routes/store'
import notificationsRouter from './routes/notifications'
import complementsRouter from './routes/complements'
import financeRouter from './routes/finance'
import driversRouter from './routes/drivers'
import storesRouter from './routes/stores'
import suppliesRouter from './routes/supplies'
import deliveryAreasRouter from './routes/delivery-areas'
import pdvRouter from './routes/pdv'
import tablesExtRouter from './routes/tables-ext'
import paymentWebhooksRouter from './routes/payment-webhooks'
import viacepRouter from './routes/viacep'
import billingRouter from './routes/billing'
import saasAdminRouter from './routes/saas-admin'
import { errorHandler, authMiddleware, adminMiddleware, resolveStoreScope, idempotencyMiddleware } from './middleware'
import { requireFeature } from './middleware/plan-gate'
import { confirmScheduledOrders } from './services/OrderService'
import { setupSwagger } from './swagger'

const serverLog = createChildLogger('server')

async function main() {
  await initDatabase()
  serverLog.info('Banco de dados inicializado')

  const app = express()
  const PORT = process.env.PORT || 3001

  // Sentry error tracking
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.2,
    })
    serverLog.info('Sentry error tracking habilitado')
  }

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
      }
    },
    crossOriginEmbedderPolicy: false,
  }))

  // Compression
  app.use(compression())

  // HTTP request logging via Pino
  app.use((req, res, next) => {
    const start = Date.now()
    res.on('finish', () => {
      const ms = Date.now() - start
      const meta = { method: req.method, url: req.url, status: res.statusCode, ms }
      if (res.statusCode >= 500) serverLog.error(meta, 'request')
      else if (res.statusCode >= 400) serverLog.warn(meta, 'request')
      else serverLog.info(meta, 'request')
    })
    next()
  })

  // Body size limit (10mb)
  app.use(express.json({ limit: '10mb' }))

  // CORS
  const corsOrigin = process.env.CORS_ORIGIN
  if (!corsOrigin || corsOrigin === '*') {
    serverLog.fatal('CORS_ORIGIN deve ser definido com domínio(s) específico(s), não wildcard.')
    process.exit(1)
  }
  app.use(cors({
    origin: corsOrigin.split(','),
    credentials: true,
  }))

  // Rate limiting - global
  const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
  })
  app.use('/api/', globalLimiter)

  // Idempotency for sync (POST/PUT/PATCH/DELETE)
  app.use('/api/', (req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      idempotencyMiddleware(req, res, next)
    } else {
      next()
    }
  })

  // Stricter rate limit for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
  })
  app.use('/api/auth/login', authLimiter)
  app.use('/api/auth/register', authLimiter)

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() })
  })

  // Auth
  app.use('/api/auth', authRouter)

  // Billing (public plan listing + auth-protected routes)
  app.use('/api/billing', billingRouter)

  // SaaS Admin (super-admin only)
  app.use('/api/saas', authMiddleware, adminMiddleware, saasAdminRouter)

  // Public read routes (store context resolved via JWT/slug; no auth required)
  app.use('/api/products', resolveStoreScope, productsRouter)
  app.use('/api/orders', resolveStoreScope, ordersRouter)
  app.use('/api/promotions', resolveStoreScope, promotionsRouter)
  app.use('/api/reviews', resolveStoreScope, reviewsRouter)
  app.use('/api/chat', resolveStoreScope, chatRouter)
  app.use('/api/notifications', resolveStoreScope, notificationsRouter)
  app.use('/api/viacep', viacepRouter)
  app.use('/api/webhooks/payment', paymentWebhooksRouter)
  app.use('/api/webhooks/integrations', integrationsWebhookRouter)

  // Public customer-facing routes
  app.use('/api/customers/public', resolveStoreScope, customersPublicRouter)
  app.use('/api/store', resolveStoreScope, storeRouter)
  app.use('/api/coupons', resolveStoreScope, couponsRouter)
  app.use('/api/complements', resolveStoreScope, complementsRouter)
  app.use('/api/blog', resolveStoreScope, blogRouter)
  app.use('/api/stores', resolveStoreScope, storesRouter)

  // Protected routes (auth required)
  app.use('/api/partners', authMiddleware, partnersRouter)
  app.use('/api/leads', authMiddleware, leadsRouter)
  app.use('/api/abandoned', authMiddleware, abandonedRouter)

  // Admin-only routes (auth required)
  app.use('/api/dashboard', authMiddleware, dashboardRouter)
  app.use('/api/customers', authMiddleware, customersRouter)
  app.use('/api/tables', authMiddleware, requireFeature('mesas'), tablesRouter)
  app.use('/api/loyalty', authMiddleware, loyaltyRouter)
  app.use('/api/campaigns', authMiddleware, campaignsRouter)
  app.use('/api/cashback', authMiddleware, cashbackRouter)
  app.use('/api/integrations', authMiddleware, integrationsAdminRouter)
  app.use('/api/cash-register', authMiddleware, cashRegisterRouter)
  app.use('/api/inventory', authMiddleware, requireFeature('inventory'), inventoryRouter)
  app.use('/api/invoices', authMiddleware, invoicesRouter)
  app.use('/api/delivery', authMiddleware, requireFeature('delivery'), deliveryRouter)
  app.use('/api/printers', authMiddleware, requireFeature('mesas'), printersRouter)
  app.use('/api/fiado', authMiddleware, requireFeature('fiado'), fiadoRouter)
  app.use('/api/finance', authMiddleware, financeRouter)
  app.use('/api/drivers', authMiddleware, requireFeature('delivery'), driversRouter)
  app.use('/api/delivery-areas', authMiddleware, deliveryAreasRouter)
  app.use('/api/supplies', authMiddleware, requireFeature('inventory'), suppliesRouter)
  app.use('/api/pdv', authMiddleware, pdvRouter)
  app.use('/api/tables-ext', authMiddleware, tablesExtRouter)

  // 404 for API routes
  app.use('/api/*', (_req, res) => {
    res.status(404).json({ error: 'Endpoint não encontrado' })
  })

  // Sentry error handler (before other error handlers)
  if (process.env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app)
  }
  app.use(errorHandler)

  // Swagger docs
  setupSwagger(app)

  // Static files + SPA
  app.use(express.static(path.join(__dirname, '..', '..', 'client', 'dist')))
  app.use('/uploads', express.static(path.join(__dirname, '..', '..', 'client', 'dist', 'uploads')))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'client', 'dist', 'index.html'))
  })

  // Graceful shutdown
  const server = app.listen(PORT, () => {
    serverLog.info({ port: PORT }, `Servidor rodando em http://localhost:${PORT}`)
  })

  setInterval(() => {
    try { confirmScheduledOrders() } catch (err) { serverLog.error({ err }, 'Erro ao processar pedidos agendados') }
  }, 60000)

  process.on('SIGTERM', () => {
    serverLog.info('SIGTERM recebido. Desligando graciosamente...')
    server.close(() => process.exit(0))
  })
  process.on('SIGINT', () => {
    serverLog.info('SIGINT recebido. Desligando graciosamente...')
    server.close(() => process.exit(0))
  })
}

main().catch(console.error)
