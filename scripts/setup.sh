#!/bin/bash

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Sin color

echo -e "${GREEN}Iniciando configuración de EduAssistAI...${NC}"

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker no está instalado.${NC}"
    echo "Visita https://docs.docker.com/get-docker/ para instrucciones de instalación."
    exit 1
fi

# Verificar si Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose no está instalado.${NC}"
    echo "Visita https://docs.docker.com/compose/install/ para instrucciones de instalación."
    exit 1
fi

# Crear archivo .env a partir de .env.example si no existe
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creando archivo .env a partir de .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env

        # Generar una clave JWT aleatoria (opcional, si aplica a tu app)
        JWT_SECRET=$(openssl rand -hex 32)
        sed -i '' "s/your_jwt_secret_key/$JWT_SECRET/g" .env  # macOS usa BSD sed

        echo -e "${GREEN}Archivo .env creado con éxito.${NC}"
        echo -e "${YELLOW}Edita el archivo .env para ajustar tus configuraciones si es necesario.${NC}"
    else
        echo -e "${RED}Error: .env.example no encontrado.${NC}"
        exit 1
    fi
fi

# Crear directorios necesarios
echo -e "${YELLOW}Creando directorios necesarios...${NC}"
mkdir -p rasa/models
mkdir -p rasa/actions
echo -e "${GREEN}Directorios creados con éxito.${NC}"

echo -e "${GREEN}✔ Configuración inicial completada.${NC}"
echo -e "Ahora puedes ejecutar: ${YELLOW}./scripts/start.sh${NC}"