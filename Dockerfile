FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt .
RUN pip install --default-timeout=100 --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ .

EXPOSE 8005

CMD ["python", "run.py"]
