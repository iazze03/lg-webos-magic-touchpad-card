FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    LG_SERVER_HOST=0.0.0.0 \
    LG_SERVER_PORT=5055 \
    LG_KEYFILE=/data/client_key.json

WORKDIR /app

COPY server/requirements.txt /app/server/requirements.txt
RUN pip install --no-cache-dir -r /app/server/requirements.txt

COPY server /app/server

VOLUME ["/data"]
EXPOSE 5055

CMD ["python", "/app/server/lg_touchpad_server.py"]
