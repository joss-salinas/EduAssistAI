FROM rasa/rasa:3.6.2

# Copiar archivos de configuración
COPY config.yml config.yml
COPY domain.yml domain.yml
COPY endpoints.yml endpoints.yml
COPY credentials.yml credentials.yml
COPY data/ data/

# Copiar acciones personalizadas
COPY actions/ actions/

# Instalar dependencias adicionales
USER root
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

# Entrenar el modelo inicial
RUN rasa train

# Comando por defecto
CMD ["run", "--enable-api", "--cors", "*"]
