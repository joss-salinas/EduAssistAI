-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS edu_assistant_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE edu_assistant_db;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'teacher', 'admin') NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de documentos
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INT NOT NULL,
    content TEXT,
    uploaded_by INT NOT NULL,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de intenciones
CREATE TABLE IF NOT EXISTS intents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de ejemplos de intenciones
CREATE TABLE IF NOT EXISTS intent_examples (
    id INT AUTO_INCREMENT PRIMARY KEY,
    intent_id INT NOT NULL,
    text TEXT NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (intent_id) REFERENCES intents(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de entidades
CREATE TABLE IF NOT EXISTS entities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de ejemplos de entidades
CREATE TABLE IF NOT EXISTS entity_examples (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_id INT NOT NULL,
    value VARCHAR(255) NOT NULL,
    synonym BOOLEAN DEFAULT FALSE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de modelos entrenados
CREATE TABLE IF NOT EXISTS trained_models (
    id INT AUTO_INCREMENT PRIMARY KEY,
    version VARCHAR(50) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    trained_by INT NOT NULL,
    performance_metrics JSON,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trained_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de conversaciones
CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_id VARCHAR(100) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla de mensajes
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender ENUM('user', 'assistant') NOT NULL,
    message TEXT NOT NULL,
    intent VARCHAR(100),
    confidence DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Tabla de configuración del asistente
CREATE TABLE IF NOT EXISTS assistant_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) DEFAULT 'EduAssistant',
    greeting TEXT DEFAULT '¡Hola! Soy el asistente virtual de la institución. ¿En qué puedo ayudarte hoy?',
    fallback_message TEXT DEFAULT 'Lo siento, no he entendido tu consulta. ¿Podrías reformularla?',
    confidence_threshold DECIMAL(3,2) DEFAULT 0.7,
    continuous_learning BOOLEAN DEFAULT TRUE,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla de estadísticas
CREATE TABLE IF NOT EXISTS statistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    total_queries INT DEFAULT 0,
    successful_queries INT DEFAULT 0,
    fallback_queries INT DEFAULT 0,
    avg_confidence DECIMAL(5,4) DEFAULT 0,
    avg_response_time DECIMAL(10,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar datos de ejemplo para usuarios
INSERT INTO users (name, email, password, role) VALUES
('Admin Usuario', 'admin@ejemplo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Profesor Ejemplo', 'profesor@ejemplo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher'),
('Estudiante Ejemplo', 'estudiante@ejemplo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student');

-- Insertar configuración inicial del asistente
INSERT INTO assistant_config (name, greeting, fallback_message, confidence_threshold, continuous_learning, updated_by)
VALUES ('EduAssistant', '¡Hola! Soy el asistente virtual de la institución. ¿En qué puedo ayudarte hoy?', 
'Lo siento, no he entendido tu consulta. ¿Podrías reformularla?', 0.7, TRUE, 1);

-- Insertar algunas intenciones de ejemplo
INSERT INTO intents (name, description) VALUES
('saludo', 'Saludos del usuario'),
('despedida', 'Despedidas del usuario'),
('consultar_horario', 'Consultas sobre horarios de clases o instalaciones'),
('consultar_profesor', 'Consultas sobre profesores'),
('consultar_curso', 'Consultas sobre cursos y materias');

-- Insertar ejemplos de intenciones
INSERT INTO intent_examples (intent_id, text, created_by) VALUES
(1, 'hola', 1),
(1, 'buenos días', 1),
(1, 'buenas tardes', 1),
(2, 'adiós', 1),
(2, 'hasta luego', 1),
(3, '¿Cuál es el horario de matemáticas?', 1),
(3, '¿A qué hora es la clase de física?', 1),
(4, '¿Quién es el profesor de matemáticas?', 1),
(4, '¿Quién imparte física?', 1),
(5, '¿Dónde se imparte matemáticas?', 1);

-- Insertar algunas entidades de ejemplo
INSERT INTO entities (name, description) VALUES
('curso', 'Nombres de cursos o materias'),
('profesor', 'Nombres de profesores'),
('horario', 'Horarios de clases o instalaciones'),
('lugar', 'Lugares o ubicaciones dentro de la institución');

-- Insertar ejemplos de entidades
INSERT INTO entity_examples (entity_id, value, synonym, created_by) VALUES
(1, 'matemáticas', FALSE, 1),
(1, 'física', FALSE, 1),
(1, 'historia', FALSE, 1),
(2, 'García', FALSE, 1),
(2, 'Martínez', FALSE, 1),
(3, '8:00 AM a 10:00 AM', FALSE, 1),
(3, '10:00 AM a 12:00 PM', FALSE, 1),
(4, 'aula 101', FALSE, 1),
(4, 'laboratorio', FALSE, 1),
(4, 'biblioteca', FALSE, 1);
