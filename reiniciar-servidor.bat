@echo off
echo Deteniendo procesos Node.js...
taskkill /F /IM node.exe >nul 2>&1

echo Limpiando cache .next...
if exist .next rmdir /s /q .next

echo Levantando servidor limpio...
echo.
npm run dev
