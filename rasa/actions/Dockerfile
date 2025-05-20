 FROM rasa/rasa-sdk:3.6.0

# Copiar acciones personalizadas
COPY . /app/actions

# Instalar dependencias del sistema necesarias para mysqlclient
USER root
RUN apt-get update && apt-get install -y \
    pkg-config \
    default-libmysqlclient-dev \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
RUN pip install --no-cache-dir \
    mysqlclient \
    pymysql \
    python-dotenv \
    spacy \
    nltk \
    PyPDF2 \
    python-docx

# Descargar modelos de spaCy
RUN python -m spacy download es_core_news_md
RUN python -m spacy download en_core_web_md

# Descargar recursos de NLTK
RUN python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('wordnet')"

# Cambiar al usuario no root
USER 1001

# Comando por defecto
CMD ["start", "--actions", "actions"]
