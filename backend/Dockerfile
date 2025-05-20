FROM python:3.10-slim

WORKDIR /app

# Instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código
COPY . .

# Exponer el puerto
EXPOSE 5000

# Comando para iniciar la aplicación
CMD ["python", "app.py"]
