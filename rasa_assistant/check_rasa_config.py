#!/usr/bin/env python3
"""
Script para verificar la configuración de Rasa.
Ejecutar este script con: python check_rasa_config.py
"""

import os
import sys
import yaml
import subprocess
import requests
from colorama import init, Fore, Style

# Inicializar colorama para colores en la terminal
init()

def print_success(message):
    """Imprime un mensaje de éxito."""
    print(f"{Fore.GREEN}✅ {message}{Style.RESET_ALL}")

def print_warning(message):
    """Imprime un mensaje de advertencia."""
    print(f"{Fore.YELLOW}⚠️ {message}{Style.RESET_ALL}")

def print_error(message):
    """Imprime un mensaje de error."""
    print(f"{Fore.RED}❌ {message}{Style.RESET_ALL}")

def print_info(message):
    """Imprime un mensaje informativo."""
    print(f"{Fore.BLUE}ℹ️ {message}{Style.RESET_ALL}")

def print_header(message):
    """Imprime un encabezado."""
    print(f"\n{Fore.CYAN}=== {message} ==={Style.RESET_ALL}")

def check_rasa_installation():
    """Verifica la instalación de Rasa."""
    print_header("Verificando instalación de Rasa")
    try:
        result = subprocess.run(["rasa", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            print_success(f"Rasa está instalado: {version}")
            return True
        else:
            print_error("Rasa no está instalado correctamente.")
            return False
    except FileNotFoundError:
        print_error("Rasa no está instalado o no está en el PATH.")
        print_info("Instala Rasa con: pip install rasa")
        return False

def check_rasa_sdk_installation():
    """Verifica la instalación de Rasa SDK."""
    print_header("Verificando instalación de Rasa SDK")
    try:
        # Intentar importar rasa_sdk
        import rasa_sdk
        print_success(f"Rasa SDK está instalado: {rasa_sdk.__version__}")
        return True
    except ImportError:
        print_error("Rasa SDK no está instalado.")
        print_info("Instala Rasa SDK con: pip install rasa-sdk")
        return False

def check_endpoints_config():
    """Verifica la configuración de endpoints.yml."""
    print_header("Verificando configuración de endpoints.yml")
    
    if not os.path.exists("endpoints.yml"):
        print_error("El archivo endpoints.yml no existe.")
        return False
    
    try:
        with open("endpoints.yml", "r") as file:
            config = yaml.safe_load(file)
        
        if not config:
            print_error("El archivo endpoints.yml está vacío o mal formateado.")
            return False
        
        # Verificar la configuración del endpoint de acciones
        if "action_endpoint" in config and "url" in config["action_endpoint"]:
            action_url = config["action_endpoint"]["url"]
            print_success(f"Endpoint de acciones configurado: {action_url}")
            
            # Verificar si el servidor de acciones está en ejecución
            try:
                response = requests.get(f"{action_url}/health", timeout=2)
                if response.status_code == 200:
                    print_success("El servidor de acciones está en ejecución.")
                else:
                    print_warning(f"El servidor de acciones respondió con código {response.status_code}.")
            except requests.exceptions.RequestException:
                print_warning("No se pudo conectar al servidor de acciones. Asegúrate de que esté en ejecución.")
        else:
            print_error("No se encontró la configuración del endpoint de acciones en endpoints.yml.")
            print_info("Añade la siguiente configuración a endpoints.yml:")
            print_info("""
action_endpoint:
  url: "http://localhost:5055/webhook"
            """)
            return False
        
        return True
    except Exception as e:
        print_error(f"Error al leer endpoints.yml: {e}")
        return False

def check_actions_implementation():
    """Verifica la implementación de acciones personalizadas."""
    print_header("Verificando implementación de acciones personalizadas")
    
    if not os.path.exists("actions"):
        print_error("El directorio 'actions' no existe.")
        return False
    
    if not os.path.exists("actions/actions.py"):
        print_error("El archivo actions/actions.py no existe.")
        return False
    
    try:
        with open("actions/actions.py", "r") as file:
            content = file.read()
        
        # Verificar la implementación de acciones específicas
        actions_to_check = [
            "ActionGreetWithTimeAwareness",
            "ActionHandleSmallTalk",
            "ActionSearchKnowledgeBase",
            "ActionDetectAndRespondToEmotion",
            "ActionMaintainConversationContext",
            "ActionGenerateContextualResponse"
        ]
        
        missing_actions = []
        for action in actions_to_check:
            if f"class {action}" not in content:
                missing_actions.append(action)
        
        if missing_actions:
            print_error(f"Faltan las siguientes acciones en actions.py: {', '.join(missing_actions)}")
            return False
        else:
            print_success("Todas las acciones necesarias están implementadas en actions.py.")
            return True
    except Exception as e:
        print_error(f"Error al verificar actions.py: {e}")
        return False

def check_domain_configuration():
    """Verifica la configuración del dominio."""
    print_header("Verificando configuración del dominio")
    
    if not os.path.exists("domain.yml"):
        print_error("El archivo domain.yml no existe.")
        return False
    
    try:
        with open("domain.yml", "r") as file:
            domain = yaml.safe_load(file)
        
        if not domain:
            print_error("El archivo domain.yml está vacío o mal formateado.")
            return False
        
        # Verificar que las acciones personalizadas estén definidas en el dominio
        if "actions" in domain:
            actions_to_check = [
                "action_greet_with_time_awareness",
                "action_handle_small_talk",
                "action_search_knowledge_base",
                "action_detect_and_respond_to_emotion",
                "action_maintain_conversation_context",
                "action_generate_contextual_response"
            ]
            
            missing_actions = []
            for action in actions_to_check:
                if action not in domain["actions"]:
                    missing_actions.append(action)
            
            if missing_actions:
                print_error(f"Faltan las siguientes acciones en domain.yml: {', '.join(missing_actions)}")
            else:
                print_success("Todas las acciones necesarias están definidas en domain.yml.")
        else:
            print_error("No se encontró la sección 'actions' en domain.yml.")
            return False
        
        return True
    except Exception as e:
        print_error(f"Error al verificar domain.yml: {e}")
        return False

def main():
    """Función principal."""
    print_header("VERIFICACIÓN DE CONFIGURACIÓN DE RASA")
    
    # Cambiar al directorio del script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Verificar instalaciones
    rasa_installed = check_rasa_installation()
    rasa_sdk_installed = check_rasa_sdk_installation()
    
    if not rasa_installed or not rasa_sdk_installed:
        print_error("Por favor, instala los componentes faltantes antes de continuar.")
        return
    
    # Verificar configuraciones
    endpoints_ok = check_endpoints_config()
    actions_ok = check_actions_implementation()
    domain_ok = check_domain_configuration()
    
    # Resumen
    print_header("RESUMEN")
    if endpoints_ok and actions_ok and domain_ok:
        print_success("¡Todas las verificaciones pasaron correctamente!")
        print_info("Para iniciar el sistema completo, ejecuta: python start_rasa.py")
    else:
        print_warning("Algunas verificaciones fallaron. Por favor, corrige los problemas antes de iniciar el sistema.")
        print_info("Para más información, consulta el archivo README.md.")

if __name__ == "__main__":
    main()
