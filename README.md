# EduAssistAI: Asistente de IA para Instituciones Educativas

EduAssistAI es un asistente de inteligencia artificial completo, diseñado específicamente para instituciones educativas. Facilita la comunicación y colaboración entre estudiantes y docentes a través de una interfaz conversacional intuitiva y personalizable.

## Características Principales

- 🤖 **Asistente Virtual Inteligente**: Basado en Rasa, capaz de mantener conversaciones naturales y responder preguntas.
- 🔄 **Personalizable**: Fácil de adaptar a las necesidades específicas de cada institución educativa.
- 🚀 **Fácil Despliegue**: Inicia todo el sistema con un solo comando gracias a Docker.
- 📱 **Accesible**: Interfaz web responsive que funciona en cualquier dispositivo.
- 🔒 **Seguro**: Protección de datos sensibles y control de acceso.
- 📊 **Analíticas**: Seguimiento de interacciones y métricas de uso.
- 📚 **Documentación Completa**: Guías detalladas para instalación, uso y personalización.

## Inicio Rápido

### Requisitos Previos

- Docker y Docker Compose
- Git (opcional, para clonar el repositorio)

### Instalación

1. Clona el repositorio o descarga el archivo ZIP:

\`\`\`bash
git clone https://github.com/eduassistai/eduassistai.git
cd eduassistai
\`\`\`

2. Ejecuta el script de configuración:

\`\`\`bash
chmod +x scripts/setup.sh
./scripts/setup.sh
\`\`\`

3. Inicia el sistema con un solo comando:

\`\`\`bash
chmod +x scripts/start.sh
./scripts/start.sh
\`\`\`

4. Accede a la interfaz web en tu navegador:

\`\`\`
http://localhost:3000
\`\`\`

## Personalización

### Añadir Datos Institucionales

1. Coloca tus documentos institucionales (PDF, DOCX, TXT) en la carpeta `data/documents/`.
2. Accede a la interfaz web y ve a la sección "Administración > Documentos".
3. Haz clic en "Procesar Documentos" para extraer información.
4. Revisa y edita la información extraída si es necesario.
5. Haz clic en "Entrenar Asistente" para actualizar el modelo con la nueva información.

### Personalizar Respuestas

1. Accede a la interfaz web y ve a la sección "Administración > Respuestas".
2. Añade o edita respuestas para preguntas específicas.
3. Haz clic en "Guardar Cambios" y luego en "Entrenar Asistente".

## Documentación

Para información más detallada, consulta la documentación en la carpeta `docs/`:

- [Guía de Instalación](docs/installation.md)
- [Guía de Uso](docs/usage.md)
- [Guía de Entrenamiento](docs/training.md)
- [Guía de Seguridad](docs/security.md)
- [Documentación de la API](docs/api.md)
- [Preguntas Frecuentes](docs/faq.md)

## Contribuir

¡Las contribuciones son bienvenidas! Por favor, lee nuestra [guía de contribución](CONTRIBUTING.md) antes de enviar pull requests.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
\`\`\`

Ahora, vamos a crear el archivo de licencia:

```text file="LICENSE" type="code"
MIT License

Copyright (c) 2023 EduAssistAI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
