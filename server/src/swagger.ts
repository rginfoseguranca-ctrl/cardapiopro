import swaggerUi from 'swagger-ui-express'
import { Express } from 'express'

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'CardápioPro API',
    description: 'API do plataforma SaaS de cardápio digital para restaurantes',
    version: '1.0.0',
    contact: { name: 'CardápioPro', url: 'https://cardapiopro.com' },
  },
  servers: [{ url: '/api', description: 'API Principal' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['admin', 'staff'] },
          storeId: { type: 'string' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          customerName: { type: 'string' },
          customerPhone: { type: 'string' },
          items: { type: 'array', items: { type: 'object' } },
          subtotal: { type: 'number' },
          total: { type: 'number' },
          status: { type: 'string', enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'] },
          paymentMethod: { type: 'string' },
          deliveryType: { type: 'string', enum: ['delivery', 'pickup', 'mesa', 'balcao'] },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          categoryId: { type: 'string' },
          isAvailable: { type: 'integer' },
        },
      },
      Plan: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          price: { type: 'number' },
          features: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Cadastrar nova loja',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['storeName', 'name', 'email', 'password'],
                properties: {
                  storeName: { type: 'string', example: 'Lanchonete do Zé' },
                  name: { type: 'string', example: 'João Silva' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Conta criada com trial de 14 dias' } },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: { email: { type: 'string' }, password: { type: 'string' } },
              },
            },
          },
        },
        responses: { '200': { description: 'Token JWT retornado' } },
      },
    },
    '/orders': {
      get: {
        tags: ['Orders'],
        summary: 'Listar pedidos',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Lista de pedidos' } },
      },
      post: {
        tags: ['Orders'],
        summary: 'Criar pedido',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['customerName', 'customerPhone', 'items', 'paymentMethod'],
                properties: {
                  customerName: { type: 'string' },
                  customerPhone: { type: 'string' },
                  items: { type: 'array', items: { type: 'object' } },
                  paymentMethod: { type: 'string' },
                  deliveryType: { type: 'string', enum: ['delivery', 'pickup', 'mesa', 'balcao'] },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Pedido criado' } },
      },
    },
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'Listar produtos disponíveis',
        responses: { '200': { description: 'Lista de produtos' } },
      },
    },
    '/store': {
      get: {
        tags: ['Store'],
        summary: 'Obter configurações da loja',
        responses: { '200': { description: 'Configurações da loja' } },
      },
    },
    '/billing/plans': {
      get: {
        tags: ['Billing'],
        summary: 'Listar planos disponíveis',
        responses: { '200': { description: 'Planos e preços' } },
      },
    },
    '/billing/subscription': {
      get: {
        tags: ['Billing'],
        summary: 'Status da assinatura',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Detalhes da assinatura' } },
      },
    },
    '/dashboard/summary': {
      get: {
        tags: ['Dashboard'],
        summary: 'Resumo do dashboard',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Estatísticas do dia' } },
      },
    },
    '/customers': {
      get: {
        tags: ['Customers'],
        summary: 'Listar clientes',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'Lista paginada de clientes' } },
      },
    },
  },
}

export function setupSwagger(app: Express) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'CardápioPro API Docs',
  }))
}
