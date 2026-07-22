# Guia de Setup - CardápioPro SaaS

Guia completo para configurar e lançar o CardápioPro como SaaS.

---

## 1. Conta na InfinitePay (Para receber PIX dos clientes)

A InfinitePay é gratuita para CNPJ/MEI e oferece PIX ilimitado sem taxas.

### Criar conta
1. Acesse https://infinitepay.io
2. Cadastre-se com seu CNPJ ou CPF
3. Complete a verificação de identidade
4. Aguarde aprovação (geralmente 1-2 dias úteis)

### Configurar PIX
1. No app InfinitePay, vá em **PIX**
2. Copie sua **chave PIX** (pode ser CPF, CNPJ, e-mail ou aleatória)
3. Essa chave será configurada na loja para os clientes pagarem

---

## 2. Domínio (Obrigatório para produção)

### Opções de domínio
- **Registro.br** (.com.br): https://registro.br — ~R$ 40/ano
- **Cloudflare Registrar** (~$8/ano): https://www.cloudflare.com/products/registrar/
- **Namecheap**: https://www.namecheap.com

### Subdomínio gratuito (para testes)
Se não quiser comprar domínio, use o subdomínio gratuito do Guara Cloud (ex: `cardapiopro.guaratecnologia.com.br`).

### DNS configuration
Após comprar, configure os records DNS para apontar ao Guara Cloud.

---

## 3. Deploy no Guara Cloud (Recomendado - Brasileiro)

### Criar conta
1. Acesse https://guaracloud.com.br
2. Crie uma conta gratuita
3. O plano Hobby é gratuito (sem cartão de crédito)

### Deploy via Git
1. Faça push do código para o GitHub
2. No painel do Guara Cloud, crie um novo serviço
3. Conecte o repositório GitHub
4. O Guara Cloud detecta automaticamente o `Dockerfile`
5. Configure as variáveis de ambiente (veja abaixo)
6. Deploy automático a cada push no `main`

### Variáveis de ambiente para o Guara Cloud

```
PORT=3001
NODE_ENV=production
JWT_SECRET=<gere uma chave forte, 64 caracteres>
CORS_ORIGIN=https://seu-dominio.com
APP_URL=https://seu-dominio.com
SENTRY_DSN=
```

### Domínio personalizado
1. No painel do Guara Cloud, vá em **Settings** → **Domains**
2. Adicione seu domínio
3. Configure os records DNS conforme instruções do Guara Cloud
4. HTTPS é configurado automaticamente

---

## 4. Outras opções de Deploy

### Opção B: Railway
1. Crie conta: https://railway.app
2. Conecte seu GitHub
3. Clique **New Project** → **Deploy from GitHub repo**
4. O Railway detecta automaticamente o `railway.json`
5. Configure as variáveis de ambiente
6. Gere o domínio em **Settings** → **Networking** → **Generate Domain**

### Opção C: VPS (DigitalOcean, AWS, etc.)
1. Crie uma VPS (mínimo 1GB RAM, Ubuntu 22.04)
2. Instale Docker:
```bash
curl -fsSL https://get.docker.com | sh
```
3. Clone e rode:
```bash
git clone https://github.com/seu-usuario/cardapiopro.git
cd cardapiopro
cp .env.example .env
nano .env  # configure as variáveis
docker-compose up -d
```

---

## 5. Configurar PIX nas Lojas

Cada loja configurada no CardápioPro precisa informar sua chave PIX para receber pagamentos.

### Como funciona
1. O dono da loja faz login no dashboard
2. Vai em **Configurações** → **Pagamento**
3. Informa sua **chave PIX** (da InfinitePay ou outro banco)
4. Informa o **nome do titular**
5. Salva

### Fluxo do cliente
1. Cliente monta o pedido no cardápio digital
2. Escolhe **PIX** como forma de pagamento
3. Vê a chave PIX + QR Code na tela
4. Paga pelo app do banco
5. Pedido é confirmado pela loja

---

## 6. Email/SMTP (Para recuperação de senha)

### Opção gratuita: Resend
1. Crie conta: https://resend.com
2. Domínio verificado
3. API Key → adicione no `.env`:
```
RESEND_API_KEY=re_xxxxx
```

### Opção com Gmail
1. Ative verificação em 2 etapas
2. Gere uma "Senha de app"
3. Configure no `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
```

---

## 7. Monitoramento (Opcional)

### Sentry (Erros)
1. Crie conta: https://sentry.io
2. Crie um projeto Node.js
3. Copie o DSN
4. Adicione no `.env`:
```
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

---

## 8. Primeiro Acesso

Após o deploy:

1. Acesse `https://seu-dominio.com`
2. Clique em **"Cadastre-se"**
3. Preencha os dados da loja
4. Faça login com as credenciais criadas
5. Configure o cardápio, produtos, PIX, etc.
6. Acesse o dashboard: `https://seu-dominio.com/dashboard`

### Admin SaaS (para gerenciar todas as lojas)
1. Acesse o dashboard
2. Faça login com o email `admin@index.local`
3. Use a senha gerada no primeiro boot (verifique os logs)
4. IMPORTANTE: Altere a senha imediatamente!

---

## 9. Checklist de Lançamento

- [ ] Conta InfinitePay criada
- [ ] Domínio comprado (ou subdomínio do Guara Cloud)
- [ ] Deploy feito no Guara Cloud
- [ ] HTTPS/SSL ativo (automático no Guara Cloud)
- [ ] Variáveis de ambiente configuradas
- [ ] Email/SMTP configurado
- [ ] Teste de pedido completo (criar → PIX → confirmar)
- [ ] Páginas legais revisadas (Termos, Privacidade)
- [ ] Landing page com dados corretos
- [ ] Suporte funcionando (WhatsApp, email)
- [ ] Sentry configurado (opcional)

---

## 10. Custos de Infraestrutura

| Serviço | Custo mensal |
|---------|-------------|
| Guara Cloud (Hobby) | Grátis |
| Guara Cloud (Starter) | R$ 19,99/mês |
| InfinitePay (PIX) | Grátis |
| Domínio .com.br | ~R$ 3,50/mês |
| Sentry (Hobby) | Grátis |
| **Total mínimo** | **~R$ 3,50/mês** |

---

## 11. Geração de JWT_SECRET

Gere uma chave forte:
```bash
# Linux/Mac
openssl rand -hex 64

# PowerShell (Windows)
-join ((1..64) | ForEach-Object { '{0:x2}' -f (Get-Random -Max 256) })
```

---

## 12. Comandos Úteis

```bash
# Deploy manual (após push para GitHub)
# Guara Cloud faz deploy automaticamente

# Rodar testes
cd server && npm test

# Compilar
npm run build

# Rodar local
npm run dev

# Docker local
docker-compose up -d
```
