#!/usr/bin/env python3
"""
Script para verificar y corregir dependencias de Rasa en macOS ARM64.
"""

import sys
import os
import platform
import subprocess
import importlib.util
from packaging import version

def print_header(message):
    """Imprime un encabezado formateado."""
    print(f"\n{'='*80}\n{message}\n{'='*80}")

def run_command(command):
    """Ejecuta un comando y devuelve su salida."""
    try:
        result = subprocess.run(command, shell=True, check=True, 
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                               text=True)
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr

def check_and_install_package(package_name, version_spec=None, uninstall_first=False):
    """Verifica si un paquete está instalado y lo instala si es necesario."""
    print(f"Verificando {package_name}...")
    
    # Comprobar si el paquete está instalado
    success, output = run_command(f"pip list | grep {package_name}")
    
    if success:
        # El paquete está instalado
        installed_version = output.split()[1]
        print(f"{package_name} {installed_version} está instalado.")
        
        # Si se especifica una versión, verificar si es compatible
        if version_spec:
            if version_spec.startswith("=="):
                # Versión exacta
                required_version = version_spec[2:]
                if installed_version != required_version:
                    print(f"La versión instalada ({installed_version}) no coincide con la requerida ({required_version}).")
                    uninstall_first = True
            elif version_spec.startswith("<"):
                # Versión máxima
                max_version = version_spec[1:]
                if version.parse(installed_version) >= version.parse(max_version):
                    print(f"La versión instalada ({installed_version}) es mayor que la máxima permitida ({max_version}).")
                    uninstall_first = True
            elif version_spec.startswith(">="):
                # Versión mínima
                min_version = version_spec[2:]
                if version.parse(installed_version) < version.parse(min_version):
                    print(f"La versión instalada ({installed_version}) es menor que la mínima requerida ({min_version}).")
                    uninstall_first = True
    else:
        # El paquete no está instalado
        print(f"{package_name} no está instalado.")
        uninstall_first = False
    
    # Desinstalar si es necesario
    if uninstall_first:
        print(f"Desinstalando {package_name}...")
        run_command(f"pip uninstall -y {package_name}")
    
    # Instalar el paquete con la versión especificada
    if uninstall_first or not success:
        install_cmd = f"pip install {package_name}"
        if version_spec:
            install_cmd += f"{version_spec}"
        
        print(f"Instalando {package_name}...")
        success, output = run_command(install_cmd)
        if success:
            print(f"{package_name} instalado correctamente.")
        else:
            print(f"Error al instalar {package_name}: {output}")
            return False
    
    return True

def fix_tensorflow_for_macos():
    """Instala la versión correcta de TensorFlow para macOS ARM64."""
    print_header("INSTALACIÓN DE TENSORFLOW PARA MACOS ARM64")
    
    # Desinstalar tensorflow si está instalado
    run_command("pip uninstall -y tensorflow")
    
    # Instalar tensorflow-macos
    if not check_and_install_package("tensorflow-macos", "==2.12.0"):
        return False
    
    # Instalar tensorflow-metal para aceleración GPU
    if not check_and_install_package("tensorflow-metal", "==0.8.0"):
        return False
    
    # Verificar la instalación
    try:
        import tensorflow as tf
        print(f"TensorFlow instalado correctamente. Versión: {tf.__version__}")
        return True
    except ImportError:
        print("Error: No se pudo importar tensorflow después de la instalación.")
        return False

def fix_numpy():
    """Instala la versión correcta de NumPy para Rasa."""
    print_header("INSTALACIÓN DE NUMPY COMPATIBLE")
    return check_and_install_package("numpy", "==1.24.3", uninstall_first=True)

def fix_pydantic():
    """Instala la versión correcta de Pydantic para Rasa."""
    print_header("INSTALACIÓN DE PYDANTIC COMPATIBLE")
    return check_and_install_package("pydantic", "==1.10.9", uninstall_first=True)

def fix_dependencies():
    """Corrige todas las dependencias para Rasa en macOS ARM64."""
    print_header("CORRECCIÓN DE DEPENDENCIAS PARA RASA EN MACOS ARM64")
    
    # Verificar si estamos en macOS ARM64
    system = platform.system()
    machine = platform.machine()
    
    if system != "Darwin" or machine != "arm64":
        print("Este script está diseñado para macOS con Apple Silicon (ARM64).")
        print(f"Sistema detectado: {system} {machine}")
        return False
    
    print(f"Sistema detectado: macOS {platform.mac_ver()[0]} {machine}")
    
    # Verificar si estamos en un entorno virtual
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("ADVERTENCIA: No se detectó un entorno virtual activo.")
        print("Se recomienda usar un entorno virtual para evitar conflictos de dependencias.")
        response = input("¿Deseas continuar de todos modos? (s/n): ")
        if response.lower() != 's':
            return False
    else:
        print(f"Entorno virtual detectado: {sys.prefix}")
    
    # Corregir dependencias en el orden correcto
    if not fix_numpy():
        print("Error al corregir numpy.")
        return False
    
    if not fix_tensorflow_for_macos():
        print("Error al corregir tensorflow.")
        return False
    
    if not fix_pydantic():
        print("Error al corregir pydantic.")
        return False
    
    print_header("DEPENDENCIAS CORREGIDAS EXITOSAMENTE")
    print("Todas las dependencias han sido corregidas correctamente.")
    print("Ahora puedes entrenar tu modelo Rasa con:")
    print("  rasa train")
    
    return True

if __name__ == "__main__":
    if not fix_dependencies():
        sys.exit(1)
