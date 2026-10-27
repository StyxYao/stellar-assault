@echo off
cd /d "%~dp0.."
node tools\lan_server.mjs %1 %2
