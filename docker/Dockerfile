FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app

# Default runs MCP server over stdio (for MCP hosts)
CMD ["python", "-m", "app.mcp.server"]
