#!/usr/bin/env python3
"""
Script para iniciar todos los componentes de Rasa.
Ejecutar este script con: python start_rasa.py
"""

import subprocess
import os
import sys
import time
import threading

def run_command(command, name):
    """Ejecuta un comando en un subproceso."""
    try:
        print(f"\n🚀 Iniciando {name}...")
        subprocess.run(command, check=True)
    except KeyboardInterrupt:
        print(f"\n🛑 {name} detenido.")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error al ejecutar {name}: {e}")
    except Exception as e:
        print(f"❌ Error inesperado en {name}: {e}")

def start_action_server():
    """Inicia el servidor de acciones."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    action_script = os.path.join(script_dir, "start_action_server.py")
    run_command([sys.executable, action_script], "Servidor de Acciones")

def start_rasa_server():
    """Inicia el servidor principal de Rasa."""
    run_command(["rasa", "run", "--enable-api", "--cors", "*"], "Servidor Rasa")

def main():
    """Función principal que inicia todos los componentes."""
    print("🤖 Iniciando el sistema Rasa completo...")
    
    # Verificar si el modelo existe
    if not os.path.exists("models"):
        print("⚠️ No se encontró ningún modelo. Entrenando un nuevo modelo...")
        try:
            subprocess.run(["rasa", "train"], check=True)
            print("✅ Modelo entrenado correctamente.")
        except subprocess.CalledProcessError:
            print("❌ Error al entrenar el modelo. Por favor, entrena el modelo manualmente con 'rasa train'.")
            return
    
    # Iniciar el servidor de acciones en un hilo separado
    action_thread = threading.Thread(target=start_action_server)
    action_thread.daemon = True
    action_thread.start()
    
    # Dar tiempo para que el servidor de acciones se inicie
    print("⏳ Esperando a que el servidor de acciones se inicie...")
    time.sleep(5)
    
    # Iniciar el servidor principal de Rasa
    start_rasa_server()

if __name__ == "__main__":
    main()
