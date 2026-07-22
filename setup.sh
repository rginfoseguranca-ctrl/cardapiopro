#!/bin/bash
echo "========================================"
echo "  CardápioPro - Setup"
echo "========================================"
echo ""

echo "[1/4] Instalando dependencias..."
npm install
if [ $? -ne 0 ]; then
    echo "Erro ao instalar dependencias"
    exit 1
fi

echo ""
echo "[2/4] Configurando ambiente..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Arquivo .env criado! Edite com suas configuracoes."
else
    echo "Arquivo .env ja existe."
fi

echo ""
echo "[3/4] Compilando projeto..."
npm run build
if [ $? -ne 0 ]; then
    echo "Erro ao compilar projeto"
    exit 1
fi

echo ""
echo "[4/4] Executando testes..."
cd server && npx vitest run
cd ..

echo ""
echo "========================================"
echo "  Setup completo!"
echo "========================================"
echo ""
echo "Para iniciar em desenvolvimento:"
echo "  npm run dev"
echo ""
echo "Para iniciar em producao:"
echo "  npm start"
echo ""
echo "Acesse: http://localhost:3001"
echo ""
