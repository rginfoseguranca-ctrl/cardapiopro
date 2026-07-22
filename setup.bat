@echo off
echo ========================================
echo   CardápioPro - Setup
echo ========================================
echo.

echo [1/4] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo Erro ao instalar dependencias
    exit /b 1
)

echo.
echo [2/4] Configurando ambiente...
if not exist .env (
    copy .env.example .env
    echo Arquivo .env criado! Edite com suas configuracoes.
) else (
    echo Arquivo .env ja existe.
)

echo.
echo [3/4] Compilando projeto...
call npm run build
if %errorlevel% neq 0 (
    echo Erro ao compilar projeto
    exit /b 1
)

echo.
echo [4/4] Executando testes...
cd server
call npx vitest run
cd ..

echo.
echo ========================================
echo   Setup completo!
echo ========================================
echo.
echo Para iniciar em desenvolvimento:
echo   npm run dev
echo.
echo Para iniciar em producao:
echo   npm start
echo.
echo Acesse: http://localhost:3001
echo.
