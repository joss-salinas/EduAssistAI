#!/bin/bash

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Configurando entorno para Rasa en macOS ARM64 (Apple Silicon) ===${NC}"

# Verificar si estamos en macOS ARM64
if [[ "$(uname)" != "Darwin" || "$(uname -m)" != "arm64" ]]; then
    echo -e "${YELLOW}Este script está diseñado para macOS con Apple Silicon (ARM64).${NC}"
    echo -e "${YELLOW}Puede que necesites ajustar las dependencias para tu plataforma.${NC}"
    read -p "¿Deseas continuar de todos modos? (s/n): " choice
    if [[ "$choice" != "s" && "$choice" != "S" ]]; then
        echo "Operación cancelada."
        exit 0
    fi
fi

# Verificar si conda está instalado
if ! command -v conda &> /dev/null; then
    echo -e "${RED}Conda no está instalado. Por favor, instala Miniconda o Anaconda primero.${NC}"
    echo "Puedes descargarlo desde: https://docs.conda.io/en/latest/miniconda.html"
    exit 1
fi

# Nombre del entorno
ENV_NAME="rasa-apple-silicon"

# Preguntar si se debe eliminar el entorno existente
if conda env list | grep -q "$ENV_NAME"; then
    echo -e "${YELLOW}El entorno '$ENV_NAME' ya existe.${NC}"
    read -p "¿Deseas eliminarlo y crear uno nuevo? (s/n): " choice
    if [[ "$choice" == "s" || "$choice" == "S" ]]; then
        echo "Eliminando entorno existente..."
        conda env remove -n "$ENV_NAME"
    else
        echo "Usando el entorno existente. Esto podría causar conflictos."
    fi
fi

# Crear nuevo entorno con Python 3.10
echo -e "${GREEN}Creando entorno conda con Python 3.10...${NC}"
conda create -n "$ENV_NAME" python=3.10 -y

# Activar el entorno
echo -e "${GREEN}Activando entorno...${NC}"
eval "$(conda shell.bash hook)"
conda activate "$ENV_NAME"

# Verificar que estamos en el entorno correcto
if [[ "$CONDA_DEFAULT_ENV" != "$ENV_NAME" ]]; then
    echo -e "${RED}Error al activar el entorno conda.${NC}"
    exit 1
fi

# Instalar dependencias en el orden correcto
echo -e "${GREEN}Instalando numpy compatible...${NC}"
pip install numpy==1.24.3

echo -e "${GREEN}Instalando tensorflow-macos...${NC}"
pip install tensorflow-macos==2.12.0

echo -e "${GREEN}Instalando tensorflow-metal para aceleración GPU...${NC}"
pip install tensorflow-metal==0.8.0

echo -e "${GREEN}Instalando pydantic compatible...${NC}"
pip install pydantic==1.10.9

echo -e "${GREEN}Instalando Rasa...${NC}"
pip install rasa==3.6.21

echo -e "${GREEN}Instalando Rasa SDK...${NC}"
pip install rasa-sdk==3.6.2

echo -e "${GREEN}Instalando dependencias para análisis de sentimiento...${NC}"
pip install nltk==3.8.1 spacy==3.7.2 scikit-learn==1.3.2 textblob==0.17.1

echo -e "${GREEN}Descargando recursos de NLTK...${NC}"
python -m nltk.downloader vader_lexicon punkt stopwords wordnet

echo -e "${GREEN}Descargando modelos de spaCy...${NC}"
python -m spacy download es_core_news_md
python -m spacy download en_core_web_md

echo -e "${GREEN}Instalación completada con éxito!${NC}"
echo ""
echo -e "${YELLOW}Para activar este entorno, ejecuta:${NC}"
echo -e "  ${GREEN}conda activate $ENV_NAME${NC}"
echo ""
echo -e "${YELLOW}Para iniciar el servidor de acciones, ejecuta:${NC}"
echo -e "  ${GREEN}cd rasa_assistant${NC}"
echo -e "  ${GREEN}python start_action_server.py${NC}"
echo ""
echo -e "${YELLOW}Para iniciar el servidor de Rasa, ejecuta en otra terminal:${NC}"
echo -e "  ${GREEN}conda activate $ENV_NAME${NC}"
echo -e "  ${GREEN}cd rasa_assistant${NC}"
echo -e "  ${GREEN}rasa run --enable-api --cors \"*\"${NC}"
