#!/usr/bin/env python3
"""
Script para instalar todas las dependencias necesarias para el servidor de acciones de Rasa.
Ejecutar este script con: python install_dependencies.py
"""

import subprocess
import sys
import os
import platform

def print_step(message):
    """Imprime un mensaje de paso con formato."""
    print(f"\n{'='*80}\n{message}\n{'='*80}")

def run_command(command, description):
    """Ejecuta un comando y maneja errores."""
    print_step(description)
    try:
        subprocess.check_call(command)
        print(f"✅ {description} completado con éxito.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error al {description.lower()}: {e}")
        return False

def install_package(package, description=None):
    """Instala un paquete de Python."""
    if description is None:
        description = f"Instalando {package}"
    return run_command([sys.executable, "-m", "pip", "install", package], description)

def install_dependencies():
    """Instala todas las dependencias necesarias."""
    print_step("INSTALACIÓN DE DEPENDENCIAS PARA EL SERVIDOR DE ACCIONES DE RASA")
    
    # Lista de paquetes básicos necesarios
    packages = [
        "rasa-sdk",
        "nltk",
        "spacy",
        "scikit-learn",
        "pandas",
        "numpy",
        "matplotlib",
        "textblob",
    ]
    
    # Instalar paquetes básicos
    for package in packages:
        if not install_package(package):
            print(f"⚠️ No se pudo instalar {package}. Algunas funcionalidades pueden no estar disponibles.")
    
    # Descargar recursos de NLTK
    print_step("Descargando recursos de NLTK")
    try:
        import nltk
        nltk_resources = ["vader_lexicon", "punkt", "stopwords", "wordnet"]
        for resource in nltk_resources:
            try:
                nltk.data.find(resource)
                print(f"✅ Recurso NLTK '{resource}' ya está descargado.")
            except LookupError:
                print(f"Descargando recurso NLTK '{resource}'...")
                nltk.download(resource)
                print(f"✅ Recurso NLTK '{resource}' descargado correctamente.")
    except Exception as e:
        print(f"❌ Error al descargar recursos de NLTK: {e}")
    
    # Descargar modelos de spaCy
    print_step("Descargando modelos de spaCy")
    spacy_models = ["es_core_news_md", "en_core_web_md"]
    for model in spacy_models:
        try:
            run_command([sys.executable, "-m", "spacy", "download", model], f"Descargando modelo spaCy '{model}'")
        except Exception as e:
            print(f"❌ Error al descargar modelo spaCy '{model}': {e}")
    
    # Verificar la instalación
    print_step("Verificando la instalación")
    try:
        import nltk
        import spacy
        import sklearn
        import pandas
        import numpy
        import matplotlib
        import textblob
        
        print("✅ Todas las dependencias principales están instaladas correctamente.")
        
        # Verificar modelos de spaCy
        try:
            spacy.load("es_core_news_md")
            print("✅ Modelo spaCy 'es_core_news_md' cargado correctamente.")
        except:
            print("⚠️ No se pudo cargar el modelo spaCy 'es_core_news_md'.")
        
        try:
            spacy.load("en_core_web_md")
            print("✅ Modelo spaCy 'en_core_web_md' cargado correctamente.")
        except:
            print("⚠️ No se pudo cargar el modelo spaCy 'en_core_web_md'.")
        
    except ImportError as e:
        print(f"❌ Error al verificar la instalación: {e}")
    
    print_step("INSTALACIÓN COMPLETADA")
    print("""
Para iniciar el servidor de acciones, ejecuta:
python start_action_server.py

Para iniciar el servidor principal de Rasa, ejecuta en otra terminal:
rasa run --enable-api --cors "*"
""")

if __name__ == "__main__":
    install_dependencies()
