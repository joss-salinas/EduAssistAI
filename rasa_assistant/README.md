# Configuración del Servidor de Acciones de Rasa

Este documento proporciona instrucciones para configurar y ejecutar el servidor de acciones de Rasa, necesario para las acciones personalizadas del asistente.

## Requisitos Previos

- Python 3.7 o superior
- Rasa instalado (`pip install rasa`)
- Rasa SDK instalado (`pip install rasa-sdk`)

## Pasos para Ejecutar el Servidor de Acciones

### Opción 1: Usando el Script Automatizado

1. Navega al directorio del proyecto Rasa:
   \`\`\`
   cd rasa_assistant
   \`\`\`

2. Ejecuta el script de inicio del servidor de acciones:
   \`\`\`
   python start_action_server.py
   \`\`\`

3. El script verificará las dependencias, creará los archivos necesarios si no existen, y iniciará el servidor de acciones en el puerto 5055.

### Opción 2: Ejecución Manual

1. Navega al directorio del proyecto Rasa:
   \`\`\`
   cd rasa_assistant
   \`\`\`

2. Inicia el servidor de acciones:
   \`\`\`
   rasa run actions --port 5055
   \`\`\`

## Verificación

Para verificar que el servidor de acciones está funcionando correctamente:

1. Abre un navegador y visita: `http://localhost:5055/health`
2. Deberías ver un mensaje indicando que el servidor está funcionando.

## Solución de Problemas

Si encuentras errores al ejecutar el servidor de acciones:

1. **Error de importación de módulos**: Asegúrate de que rasa-sdk está instalado con `pip install rasa-sdk`.

2. **Error de puerto en uso**: Si el puerto 5055 ya está en uso, puedes cambiar el puerto en el comando y en el archivo `endpoints.yml`.

3. **Error de acciones no encontradas**: Asegúrate de que el archivo `actions.py` está en el directorio `actions` y contiene las clases de acción correctas.

4. **Error de conexión**: Verifica que la URL en `endpoints.yml` coincide con el puerto donde se está ejecutando el servidor de acciones.

## Estructura de Archivos

- `endpoints.yml`: Contiene la configuración del endpoint para el servidor de acciones.
- `actions/actions.py`: Contiene la implementación de las acciones personalizadas.
- `start_action_server.py`: Script para iniciar el servidor de acciones.

## Notas Importantes

- El servidor de acciones debe estar en ejecución mientras se utiliza el asistente.
- Cualquier cambio en los archivos de acciones requiere reiniciar el servidor de acciones.
- Asegúrate de que el modelo de Rasa esté entrenado con las acciones personalizadas definidas en el archivo `domain.yml`.
