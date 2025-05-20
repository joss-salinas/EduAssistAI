#!/bin/bash

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Configurando EduAssistAI...${NC}"

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker no está instalado. Por favor, instala Docker antes de continuar.${NC}"
    echo "Visita https://docs.docker.com/get-docker/ para instrucciones de instalación."
    exit 1
fi

# Verificar si Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose no está instalado. Por favor, instala Docker Compose antes de continuar.${NC}"
    echo "Visita https://docs.docker.com/compose/install/ para instrucciones de instalación."
    exit 1
fi

# Crear archivo .env a partir de .env.example si no existe
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creando archivo .env a partir de .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        
        # Generar una clave JWT aleatoria
        JWT_SECRET=$(openssl rand -hex 32)
        sed -i "s/your_jwt_secret_key/$JWT_SECRET/g" .env
        
        echo -e "${GREEN}Archivo .env creado con éxito.${NC}"
    else
        echo -e "${RED}Error: Archivo .env.example no encontrado.${NC}"
        exit 1
    fi
fi

# Crear directorios necesarios
echo -e "${YELLOW}Creando directorios necesarios...${NC}"
mkdir -p data/documents
mkdir -p data/models
mkdir -p data/logs
echo -e "${GREEN}Directorios creados con éxito.${NC}"

# Construir las imágenes de Docker
echo -e "${YELLOW}Construyendo imágenes de Docker...${NC}"
docker-compose build

# Verificar si la construcción fue exitosa
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Imágenes de Docker construidas con éxito.${NC}"
else
    echo -e "${RED}Error al construir las imágenes de Docker. Por favor, revisa los logs para más información.${NC}"
    exit 1
fi

# Inicializar la base de datos
echo -e "${YELLOW}Inicializando la base de datos...${NC}"
docker-compose up -d db
sleep 10  # Esperar a que la base de datos esté lista

# Verificar si la base de datos está lista
docker-compose exec db mysqladmin ping -h localhost -u root -p${DB_PASSWORD} --silent
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Base de datos inicializada con éxito.${NC}"
else
    echo -e "${RED}Error al inicializar la base de datos. Por favor, revisa los logs para más información.${NC}"
    docker-compose logs db
    exit 1
fi

# Detener todos los servicios
docker-compose down

echo -e "${GREEN}¡Configuración completada con éxito!${NC}"
echo -e "Para iniciar EduAssistAI, ejecuta: ${YELLOW}./scripts/start.sh${NC}"
