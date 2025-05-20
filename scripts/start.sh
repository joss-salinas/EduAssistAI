#!/bin/bash

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Iniciando EduAssistAI...${NC}"

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

# Verificar si el archivo .env existe
if [ ! -f .env ]; then
    echo -e "${YELLOW}Aviso: Archivo .env no encontrado. Creando uno a partir de .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}Archivo .env creado. Por favor, edítalo con tus configuraciones si es necesario.${NC}"
    else
        echo -e "${RED}Error: Archivo .env.example no encontrado. Por favor, crea un archivo .env manualmente.${NC}"
        exit 1
    fi
fi

# Crear directorios necesarios si no existen
mkdir -p data/documents
mkdir -p data/models
mkdir -p data/logs

# Iniciar los servicios con Docker Compose
echo -e "${GREEN}Iniciando servicios con Docker Compose...${NC}"
docker-compose up -d

# Verificar si los servicios se iniciaron correctamente
if [ $? -eq 0 ]; then
    echo -e "${GREEN}¡EduAssistAI se ha iniciado correctamente!${NC}"
    echo -e "Accede a la interfaz web en: ${YELLOW}http://localhost:3000${NC}"
    echo -e "Panel de administración de la base de datos: ${YELLOW}http://localhost:8080${NC}"
    echo -e "API de Rasa: ${YELLOW}http://localhost:5005${NC}"
    echo -e "API del backend: ${YELLOW}http://localhost:8000${NC}"
    echo -e "\nPara detener EduAssistAI, ejecuta: ${YELLOW}docker-compose down${NC}"
else
    echo -e "${RED}Error al iniciar EduAssistAI. Por favor, revisa los logs para más información.${NC}"
    echo -e "Puedes ver los logs con: ${YELLOW}docker-compose logs${NC}"
    exit 1
fi
