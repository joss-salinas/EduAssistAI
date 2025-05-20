#!/bin/bash

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Entrenando el modelo de Rasa...${NC}"

# Verificar si Docker está en ejecución
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker no está en ejecución. Por favor, inicia Docker antes de continuar.${NC}"
    exit 1
fi

# Verificar si los servicios de EduAssistAI están en ejecución
if ! docker-compose ps | grep -q "rasa"; then
    echo -e "${YELLOW}Aviso: Los servicios de EduAssistAI no están en ejecución. Iniciando servicios...${NC}"
    docker-compose up -d
    sleep 5
fi

# Entrenar el modelo de Rasa
echo -e "${YELLOW}Entrenando el modelo de Rasa...${NC}"
docker-compose exec rasa rasa train

# Verificar si el entrenamiento fue exitoso
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Modelo de Rasa entrenado con éxito.${NC}"
    echo -e "El nuevo modelo está disponible en la carpeta ${YELLOW}models/${NC}"
else
    echo -e "${RED}Error al entrenar el modelo de Rasa. Por favor, revisa los logs para más información.${NC}"
    docker-compose logs rasa
    exit 1
fi

echo -e "${GREEN}¡Entrenamiento completado con éxito!${NC}"
echo -e "Para reiniciar el servicio de Rasa con el nuevo modelo, ejecuta: ${YELLOW}docker-compose restart rasa${NC}"
