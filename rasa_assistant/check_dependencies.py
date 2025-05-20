#!/usr/bin/env python3
"""
Script para verificar la compatibilidad de las dependencias de Rasa.
"""

import sys
import platform
import subprocess
import importlib.util
from packaging import version

def print_header(message):
    """Imprime un encabezado formateado."""
    print(f"\n{'='*80}\n{message}\n{'='*80}")

def check_package_version(package_name, min_version=None, max_version=None):
    """Verifica si un paquete está instalado y su versión."""
    try:
        spec = importlib.util.find_spec(package_name)
        if spec is None:
            print(f"❌ {package_name} no está instalado.")
            return False
        
        # Obtener la versión del paquete
        if package_name == "tensorflow":
            # Caso especial para tensorflow/tensorflow-macos
            try:
                import tensorflow as tf
                pkg_version = tf.__version__
                pkg_name = "tensorflow" if not tf.__file__.endswith("macos") else "tensorflow-macos"
                print(f"✅ {pkg_name} {pkg_version} está instalado.")
            except Exception as e:
                print(f"❌ Error al importar tensorflow: {e}")
                return False
        else:
            try:
                pkg = __import__(package_name)
                pkg_version = pkg.__version__
                print(f"✅ {package_name} {pkg_version} está instalado.")
            except (AttributeError, ImportError) as e:
                print(f"⚠️ No se pudo determinar la versión de {package_name}: {e}")
                return True
        
        # Verificar versión mínima
        if min_version and version.parse(pkg_version) < version.parse(min_version):
            print(f"⚠️ La versión de {package_name} ({pkg_version}) es menor que la mínima requerida ({min_version}).")
            return False
        
        # Verificar versión máxima
        if max_version and version.parse(pkg_version) > version.parse(max_version):
            print(f"⚠️ La versión de {package_name} ({pkg_version}) es mayor que la máxima permitida ({max_version}).")
            return False
        
        return True
    except Exception as e:
        print(f"❌ Error al verificar {package_name}: {e}")
        return False

def check_system_compatibility():
    """Verifica la compatibilidad del sistema."""
    print_header("VERIFICACIÓN DEL SISTEMA")
    
    system = platform.system()
    machine = platform.machine()
    python_version = platform.python_version()
    
    print(f"Sistema operativo: {system}")
    print(f"Arquitectura: {machine}")
    print(f"Versión de Python: {python_version}")
    
    # Verificar si estamos en macOS ARM64 (Apple Silicon)
    is_macos_arm64 = system == "Darwin" and machine == "arm64"
    if is_macos_arm64:
        print("✅ Detectado macOS con Apple Silicon (ARM64).")
    else:
        print("ℹ️ No se detectó macOS con Apple Silicon. Las recomendaciones pueden variar.")
    
    # Verificar versión de Python
    if version.parse(python_version) < version.parse("3.8") or version.parse(python_version) >= version.parse("3.11"):
        print("⚠️ Rasa 3.6.21 funciona mejor con Python 3.8-3.10.")
    else:
        print("✅ Versión de Python compatible con Rasa 3.6.21.")
    
    return is_macos_arm64

def check_rasa_dependencies():
    """Verifica las dependencias principales de Rasa."""
    print_header("VERIFICACIÓN DE DEPENDENCIAS DE RASA")
    
    # Verificar Rasa
    rasa_ok = check_package_version("rasa")
    
    # Verificar dependencias críticas
    numpy_ok = check_package_version("numpy", min_version="1.19.2", max_version="1.24.9")
    tensorflow_ok = check_package_version("tensorflow")
    pydantic_ok = check_package_version("pydantic", max_version="1.10.9")
    
    # Verificar otras dependencias importantes
    check_package_version("sklearn")
    check_package_version("spacy")
    check_package_version("nltk")
    
    # Verificar modelos de spaCy
    print("\nVerificando modelos de spaCy:")
    try:
        import spacy
        for model in ["es_core_news_md", "en_core_web_md"]:
            try:
                spacy.load(model)
                print(f"✅ Modelo spaCy '{model}' está instalado y cargado correctamente.")
            except:
                print(f"❌ Modelo spaCy '{model}' no está instalado o no se puede cargar.")
    except ImportError:
        print("❌ No se pudo importar spaCy para verificar los modelos.")
    
    # Verificar recursos de NLTK
    print("\nVerificando recursos de NLTK:")
    try:
        import nltk
        for resource in ["vader_lexicon", "punkt", "stopwords", "wordnet"]:
            try:
                nltk.data.find(f"tokenizers/{resource}" if resource == "punkt" else resource)
                print(f"✅ Recurso NLTK '{resource}' está instalado.")
            except LookupError:
                print(f"❌ Recurso NLTK '{resource}' no está instalado.")
    except ImportError:
        print("❌ No se pudo importar NLTK para verificar los recursos.")
    
    return rasa_ok and numpy_ok and tensorflow_ok and pydantic_ok

def suggest_fixes(is_macos_arm64):
    """Sugiere soluciones para problemas comunes."""
    print_header("SUGERENCIAS PARA RESOLVER PROBLEMAS")
    
    print("Si encuentras conflictos de dependencias, prueba lo siguiente:")
    
    if is_macos_arm64:
        print("\n1. Crea un nuevo entorno conda específico para Rasa en Apple Silicon:")
        print("   $ conda create -n rasa-apple-silicon python=3.10")
        print("   $ conda activate rasa-apple-silicon")
        print("\n2. Instala las dependencias en este orden específico:")
        print("   $ pip install numpy==1.24.3")
        print("   $ pip install tensorflow-macos==2.12.0")
        print("   $ pip install tensorflow-metal==0.8.0")
        print("   $ pip install pydantic==1.10.9")
        print("   $ pip install rasa==3.6.21")
        print("   $ pip install rasa-sdk==3.6.2")
    else:
        print("\n1. Crea un nuevo entorno virtual para Rasa:")
        print("   $ python -m venv rasa-env")
        print("   $ source rasa-env/bin/activate  # En Windows: rasa-env\\Scripts\\activate")
        print("\n2. Instala las dependencias en este orden específico:")
        print("   $ pip install numpy==1.24.3")
        print("   $ pip install tensorflow==2.12.0")
        print("   $ pip install pydantic==1.10.9")
        print("   $ pip install rasa==3.6.21")
        print("   $ pip install rasa-sdk==3.6.2")
    
    print("\n3. Instala las dependencias para el análisis de sentimiento:")
    print("   $ pip install nltk==3.8.1 spacy==3.7.2 scikit-learn==1.3.2 textblob==0.17.1")
    print("\n4. Descarga los recursos necesarios:")
    print("   $ python -m nltk.downloader vader_lexicon punkt stopwords wordnet")
    print("   $ python -m spacy download es_core_news_md")
    print("   $ python -m spacy download en_core_web_md")
    
    print("\nAlternativamente, puedes usar el script 'setup_rasa_environment.sh' incluido:")
    print("   $ bash setup_rasa_environment.sh")

def main():
    """Función principal."""
    print_header("VERIFICADOR DE COMPATIBILIDAD DE RASA")
    
    is_macos_arm64 = check_system_compatibility()
    dependencies_ok = check_rasa_dependencies()
    
    if dependencies_ok:
        print_header("RESULTADO")
        print("✅ Todas las dependencias principales están correctamente instaladas.")
        print("Puedes iniciar el servidor de acciones y el servidor de Rasa.")
    else:
        print_header("RESULTADO")
        print("⚠️ Se encontraron problemas con las dependencias.")
        suggest_fixes(is_macos_arm64)

if __name__ == "__main__":
    main()
