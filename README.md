# CardápioPro

Plataforma SaaS completa para cardápio digital e gestão de restaurantes/lanchonetes.

## Funcionalidades

### Cardápio Digital
- Cardápio responsivo para celular e desktop
- Categorias, produtos com imagens e preços
- Sistema de complementos (radio/checkbox)
- Combos de produtos
- Produtos em destaque

### Pedidos
- Delivery, retirada, mesa e balcão
- Pedidos agendados
- Status em tempo real (SSE)
- Notificações push
- Comanda HTML para impressão
- Verificação de horário de funcionamento

### Pagamento PIX
- QR Code PIX automático no checkout
- Chave PIX configurável por loja
- BR Code (padrão EMVCo) para pagamento
- Compatível com InfinitePay, Nubank, Mercado Pago, etc.

### Gestão
- Dashboard com métricas
- Gestão de clientes (CRM)
- Programa de fidelidade
- Cashback
- Cupons de desconto
- Campanhas de marketing (WhatsApp)
- Blog integrado

### Financeiro
- Contas bancárias e caixa
- Categorias de receitas/despesas
- Transações financeiras
- Despesas recorrentes
- Caixa registradora
- Fiado (conta corrente)

### Operações
- Gestão de mesas
- KDS (Kitchen Display System)
- PDV integrado
- Impressoras por setor
- Estoque de insumos e receitas
- Rotas de entrega
- Gestão de entregadores

### SaaS
- Sistema de planos (Delivery, Mesas, Premium)
- Planos gratuitos (todos os recursos inclusos)
- Multi-lojas
- Feature gating por plano

### Infraestrutura
- Autenticação JWT com refresh
- Rate limiting
- Sentry para monitoramento
- Swagger/OpenAPI
- Docker
- CI/CD com GitHub Actions

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React 19, Vite, TypeScript
- **Mobile**: React Native, Expo
- **Banco**: SQLite (sql.js)
- **Auth**: JWT
- **Pagamentos**: PIX (InfinitePay)
- **Monitoramento**: Sentry
- **Deploy**: Guara Cloud (brasileiro)

## Pré-requisitos

- Node.js 20+
- npm 10+

## Setup Rápido

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/cardapiopro.git
cd cardapiopro

# Execute o script de setup
# Windows:
setup.bat

# Linux/Mac:
chmod +x setup.sh
./setup.sh
```

## Configuração

Edite o arquivo `.env`:

```env
PORT=3001
NODE_ENV=development
JWT_SECRET=sua_chave_secreta_aqui
CORS_ORIGIN=http://localhost:5173
SENTRY_DSN=
APP_URL=http://localhost:3001
```

## Desenvolvimento

```bash
# Iniciar em modo desenvolvimento
npm run dev

# Acessar
http://localhost:3001
```

## Build e Deploy

```bash
# Compilar
npm run build

# Iniciar em produção
npm start
```

## Docker

```bash
# Build e rodar
docker-compose up -d

# Acessar
http://localhost:3001
```

## Deploy no Guara Cloud

1. Crie uma conta no [Guara Cloud](https://guaracloud.com.br)
2. Conecte o repositório GitHub
3. O Guara Cloud detecta automaticamente o `Dockerfile`
4. Configure as variáveis de ambiente no painel
5. Deploy automático a cada push

## Estrutura do Projeto

```
cardapiopro/
├── server/           # Backend API
│   └── src/
│       ├── routes/   # 35 rotas REST
│       └── middleware/ # Auth, plan-gate
├── client/           # Frontend Web
│   └── src/
│       ├── pages/    # 24 páginas
│       ├── components/ # 23 componentes
│       └── hooks/    # Zustand stores
├── mobile/           # App React Native
│   └── src/
│       ├── screens/  # 6 telas
│       └── components/
├── shared/           # Tipos compartilhados
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

## API

A documentação da API está disponível em `/api-docs` (Swagger).

### Rotas Principais

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/auth/register | Cadastro de loja |
| POST | /api/auth/login | Login |
| GET | /api/products | Produtos públicos |
| POST | /api/orders | Criar pedido |
| GET | /api/dashboard | Métricas |
| GET | /api/billing/plans | Planos disponíveis |

## Planos

| Plano | Preço | Recursos |
|-------|-------|----------|
| Delivery | Grátis | Cardápio, pedidos, delivery |
| Mesas | Grátis | + Mesas, KDS, PDV, impressoras |
| Premium | Grátis | + Tudo, chatbot IA, CRM, financeiro |

## Licença

MIT

## Suporte

- Email: rginfoseguranca@gmail.com
- WhatsApp: (62) 99324-8326
