#!/bin/bash

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Instalando TensorFlow para macOS ARM64 (Apple Silicon) ===${NC}"

# Verificar si estamos en macOS ARM64
if [[ "$(uname)" != "Darwin" || "$(uname -m)" != "arm64" ]]; then
    echo -e "${RED}Este script está diseñado para macOS con Apple Silicon (ARM64).${NC}"
    exit 1
fi

# Verificar si estamos en un entorno virtual
if [[ -z "$VIRTUAL_ENV" ]]; then
    echo -e "${YELLOW}No se detectó un entorno virtual activo.${NC}"
    echo -e "${YELLOW}Por favor, activa tu entorno virtual antes de ejecutar este script.${NC}"
    echo -e "${YELLOW}Ejemplo: source rasa-venv/bin/activate${NC}"
    exit 1
fi

echo -e "${GREEN}Entorno virtual detectado: $VIRTUAL_ENV${NC}"

# Verificar la versión de Python
PYTHON_VERSION=$(python --version 2>&1 | cut -d' ' -f2)
echo -e "${GREEN}Versión de Python: $PYTHON_VERSION${NC}"

# Verificar si numpy está instalado y su versión
echo -e "${GREEN}Verificando numpy...${NC}"
if pip list | grep -q "numpy"; then
    NUMPY_VERSION=$(pip list | grep numpy | awk '{print $2}')
    echo -e "${GREEN}numpy $NUMPY_VERSION está instalado.${NC}"
    
    # Verificar si la versión de numpy es compatible
    if [[ $(python -c "from packaging import version; print(version.parse('$NUMPY_VERSION') >= version.parse('1.19.2') and version.parse('$NUMPY_VERSION') < version.parse('1.25.0'))") == "False" ]]; then
        echo -e "${YELLOW}La versión de numpy ($NUMPY_VERSION) no es compatible con Rasa 3.6.21.${NC}"
        echo -e "${YELLOW}Se recomienda numpy >= 1.19.2 y < 1.25.0${NC}"
        echo -e "${YELLOW}Desinstalando numpy actual...${NC}"
        pip uninstall -y numpy
        echo -e "${GREEN}Instalando numpy 1.24.3...${NC}"
        pip install numpy==1.24.3
    fi
else
    echo -e "${GREEN}numpy no está instalado. Instalando numpy 1.24.3...${NC}"
    pip install numpy==1.24.3
fi

# Verificar si tensorflow o tensorflow-macos está instalado
echo -e "${GREEN}Verificando tensorflow...${NC}"
if pip list | grep -q "tensorflow-macos"; then
    TF_VERSION=$(pip list | grep tensorflow-macos | awk '{print $2}')
    echo -e "${GREEN}tensorflow-macos $TF_VERSION está instalado.${NC}"
    
    # Verificar si es la versión recomendada
    if [[ "$TF_VERSION" != "2.12.0" ]]; then
        echo -e "${YELLOW}La versión de tensorflow-macos ($TF_VERSION) no es la recomendada para Rasa 3.6.21.${NC}"
        echo -e "${YELLOW}Se recomienda tensorflow-macos 2.12.0${NC}"
        echo -e "${YELLOW}Desinstalando tensorflow-macos actual...${NC}"
        pip uninstall -y tensorflow-macos
        echo -e "${GREEN}Instalando tensorflow-macos 2.12.0...${NC}"
        pip install tensorflow-macos==2.12.0
    fi
elif pip list | grep -q "tensorflow"; then
    TF_VERSION=$(pip list | grep tensorflow | awk '{print $2}')
    echo -e "${YELLOW}tensorflow $TF_VERSION está instalado, pero se recomienda tensorflow-macos para Apple Silicon.${NC}"
    echo -e "${YELLOW}Desinstalando tensorflow...${NC}"
    pip uninstall -y tensorflow
    echo -e "${GREEN}Instalando tensorflow-macos 2.12.0...${NC}"
    pip install tensorflow-macos==2.12.0
else
    echo -e "${GREEN}tensorflow no está instalado. Instalando tensorflow-macos 2.12.0...${NC}"
    pip install tensorflow-macos==2.12.0
fi

# Instalar tensorflow-metal para aceleración GPU
echo -e "${GREEN}Instalando tensorflow-metal para aceleración GPU...${NC}"
pip install tensorflow-metal==0.8.0

# Verificar si pydantic está instalado y su versión
echo -e "${GREEN}Verificando pydantic...${NC}"
if pip list | grep -q "pydantic"; then
    PYDANTIC_VERSION=$(pip list | grep pydantic | awk '{print $2}')
    echo -e "${GREEN}pydantic $PYDANTIC_VERSION está instalado.${NC}"
    
    # Verificar si la versión de pydantic es compatible
    if [[ $(python -c "from packaging import version; print(version.parse('$PYDANTIC_VERSION') >= version.parse('1.10.10'))") == "True" ]]; then
        echo -e "${YELLOW}La versión de pydantic ($PYDANTIC_VERSION) no es compatible con Rasa 3.6.21.${NC}"
        echo -e "${YELLOW}Se recomienda pydantic < 1.10.10${NC}"
        echo -e "${YELLOW}Desinstalando pydantic actual...${NC}"
        pip uninstall -y pydantic
        echo -e "${GREEN}Instalando pydantic 1.10.9...${NC}"
        pip install pydantic==1.10.9
    fi
else
    echo -e "${GREEN}pydantic no está instalado. Instalando pydantic 1.10.9...${NC}"
    pip install pydantic==1.10.9
fi

# Verificar la instalación
echo -e "${GREEN}Verificando la instalación de tensorflow-macos...${NC}"
if python -c "import tensorflow as tf; print(f'TensorFlow version: {tf.__version__}')"; then
    echo -e "${GREEN}✅ TensorFlow está instalado correctamente.${NC}"
else
    echo -e "${RED}❌ Hubo un problema con la instalación de TensorFlow.${NC}"
    exit 1
fi

echo -e "${GREEN}Instalación completada con éxito!${NC}"
echo ""
echo -e "${YELLOW}Ahora puedes entrenar tu modelo Rasa con:${NC}"
echo -e "  ${GREEN}cd rasa_assistant${NC}"
echo -e "  ${GREEN}rasa train${NC}"
