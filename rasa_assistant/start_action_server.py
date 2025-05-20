#!/usr/bin/env python3
"""
Script para iniciar el servidor de acciones de Rasa.
Ejecutar este script con: python start_action_server.py
"""

import subprocess
import os
import sys
import time

def check_dependencies():
    """Verifica si todas las dependencias necesarias están instaladas."""
    missing_dependencies = []
    
    # Lista de dependencias requeridas
    dependencies = ["rasa_sdk", "nltk", "spacy"]
    
    for dep in dependencies:
        try:
            __import__(dep)
        except ImportError:
            missing_dependencies.append(dep)
    
    if missing_dependencies:
        print(f"❌ Faltan las siguientes dependencias: {', '.join(missing_dependencies)}")
        print("\nPor favor, ejecuta el script de instalación de dependencias:")
        print("python install_dependencies.py")
        return False
    
    # Verificar recursos de NLTK
    try:
        import nltk
        nltk_resources = ["vader_lexicon", "punkt"]
        missing_nltk = []
        
        for resource in nltk_resources:
            try:
                nltk.data.find(resource)
            except LookupError:
                missing_nltk.append(resource)
        
        if missing_nltk:
            print(f"❌ Faltan los siguientes recursos de NLTK: {', '.join(missing_nltk)}")
            print("\nPor favor, ejecuta el script de instalación de dependencias:")
            print("python install_dependencies.py")
            return False
    except Exception as e:
        print(f"❌ Error al verificar recursos de NLTK: {e}")
        return False
    
    print("✅ Todas las dependencias necesarias están instaladas.")
    return True

def start_action_server():
    """Inicia el servidor de acciones de Rasa."""
    if not check_dependencies():
        return
    
    print("\n🚀 Iniciando el servidor de acciones en el puerto 5055...")
    
    # Asegurarse de que estamos en el directorio correcto
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Verificar si el directorio 'actions' existe
    if not os.path.exists("actions"):
        print("❌ El directorio 'actions' no existe. Creando directorio y archivos necesarios...")
        os.makedirs("actions", exist_ok=True)
        
        # Crear un archivo __init__.py vacío
        with open("actions/__init__.py", "w") as f:
            f.write("# Este archivo es necesario para que Python reconozca el directorio como un paquete\n")
    
    # Iniciar el servidor de acciones
    try:
        subprocess.run(["rasa", "run", "actions", "--port", "5055"])
    except KeyboardInterrupt:
        print("\n🛑 Servidor de acciones detenido.")
    except Exception as e:
        print(f"❌ Error al iniciar el servidor de acciones: {e}")
        print("\nIntenta ejecutar manualmente: rasa run actions --port 5055")

if __name__ == "__main__":
    start_action_server()
