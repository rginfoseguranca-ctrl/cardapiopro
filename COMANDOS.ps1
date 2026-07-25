# ============================================
# CardapioPro - Comandos Uteis
# Abra este arquivo no Bloco de Notas pra copiar
# ============================================

# --- MATAR PROCESSOS ANTIGOS (portas 3001, 5173, 5174) ---
# Copie e cole esta linha no PowerShell:
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }; Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }; Get-NetTCPConnection -LocalPort 5174 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# --- RODAR O DEV SERVER ---
# Copie e cole esta linha no PowerShell:
cd C:\cardapiopro; npm run dev

# --- CREDENCIAIS DO ADMIN ---
# Email: admin@index.local
# Senha: aparece no terminal como [SEED] Admin temporario: admin@index.local / xxxxxxxxxx
# (a senha e a parte depois do /)

# --- LINKS PARA TESTAR ---
# Landing page:  http://localhost:5174
# Cardapio:       http://localhost:5174/cardapio
# Planos:         http://localhost:5174/planos
# Login:          http://localhost:5174/login
# Cadastro:       http://localhost:5174/cadastro
# Dashboard:      http://localhost:5174/dashboard
# Admin SaaS:     http://localhost:5174/dashboard (login com admin@index.local)
