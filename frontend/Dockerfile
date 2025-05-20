FROM node:18-alpine

WORKDIR /app

# Instalar dependencias
COPY package.json package-lock.json* ./
RUN npm ci

# Copiar el código
COPY . .

# Construir la aplicación
RUN npm run build

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
