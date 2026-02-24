@echo off
title Gestor Canal do Livro - Launcher
color 0F

:: --- 1. GARANTIR QUE ESTAMOS NA PASTA CERTA ---
cd /d "%~dp0"
echo O script esta rodando na pasta: %CD%
echo.

:: --- 2. VERIFICAR NODE.JS ---
echo [1/3] Verificando Node.js...
node -v >nul 2>&1
if %errorlevel% equ 0 goto :VERIFICAR_MODULOS

echo [AVISO] Node.js nao encontrado.
echo Baixando instalador...
set "NODE_URL=https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
set "NODE_MSI=node_installer.msi"

curl -o %NODE_MSI% %NODE_URL%
if not exist %NODE_MSI% (
    echo [ERRO] Nao foi possivel baixar o Node.js. Verifique sua internet.
    pause
    exit
)

echo Instalando Node.js (Aguarde a janela do Windows)...
msiexec /i %NODE_MSI% /passive
del %NODE_MSI%
echo [OK] Node.js instalado.
echo.

:VERIFICAR_MODULOS
:: --- 3. VERIFICAR SE PRECISA INSTALAR O SISTEMA ---
if exist "node_modules" goto :INICIAR

echo [2/3] Configurando o sistema pela primeira vez...
echo Isso pode levar alguns minutos...
call npm install
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias (npm install).
    pause
    exit
)
echo [OK] Sistema configurado.
echo.

:INICIAR
:: --- 4. ABRIR O PROGRAMA ---
echo [3/3] Iniciando o Gestor Canal do Livro...
call npm start

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] O programa fechou com erro.
    pause
)