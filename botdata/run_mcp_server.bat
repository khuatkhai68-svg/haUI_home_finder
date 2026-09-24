@echo off
cd /d "%~dp0\playwright-mcp"
echo Starting Playwright MCP Server...
node cli.js %*
pause
