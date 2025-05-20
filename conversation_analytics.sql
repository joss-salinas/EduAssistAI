-- Tabla para almacenar métricas diarias
CREATE TABLE IF NOT EXISTS conversation_metrics_daily (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    total_conversations INT DEFAULT 0,
    total_messages INT DEFAULT 0,
    avg_messages_per_conversation DECIMAL(5,2) DEFAULT 0,
    avg_response_time_ms INT DEFAULT 0,
    fallback_rate DECIMAL(5,2) DEFAULT 0,
    satisfaction_score DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (date)
);

-- Tabla para almacenar métricas de intenciones
CREATE TABLE IF NOT EXISTS intent_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    intent_name VARCHAR(100) NOT NULL,
    count INT DEFAULT 0,
    avg_confidence DECIMAL(5,4) DEFAULT 0,
    fallback_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (date, intent_name)
);

-- Tabla para almacenar feedback de usuarios
CREATE TABLE IF NOT EXISTS conversation_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Tabla para almacenar palabras clave frecuentes
CREATE TABLE IF NOT EXISTS keyword_frequency (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    keyword VARCHAR(100) NOT NULL,
    count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (date, keyword)
);

-- Tabla para almacenar sesiones de usuario
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    user_id INT,
    device_type VARCHAR(50),
    browser VARCHAR(50),
    ip_address VARCHAR(50),
    location VARCHAR(100),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    duration_seconds INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla para almacenar métricas por categoría de usuario
CREATE TABLE IF NOT EXISTS user_category_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    user_category VARCHAR(50) NOT NULL,
    total_conversations INT DEFAULT 0,
    avg_messages_per_conversation DECIMAL(5,2) DEFAULT 0,
    avg_satisfaction DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (date, user_category)
);

-- Procedimiento almacenado para calcular métricas diarias
DELIMITER //
CREATE PROCEDURE calculate_daily_metrics(IN calculation_date DATE)
BEGIN
    -- Calcular métricas básicas
    INSERT INTO conversation_metrics_daily (
        date, 
        total_conversations, 
        total_messages, 
        avg_messages_per_conversation,
        avg_response_time_ms,
        fallback_rate
    )
    SELECT 
        calculation_date,
        COUNT(DISTINCT c.id) as total_conversations,
        COUNT(m.id) as total_messages,
        IFNULL(COUNT(m.id) / NULLIF(COUNT(DISTINCT c.id), 0), 0) as avg_messages,
        IFNULL(AVG(CASE WHEN m.sender = 'assistant' THEN TIMESTAMPDIFF(MICROSECOND, LAG(m.created_at) OVER (PARTITION BY c.id ORDER BY m.created_at), m.created_at) / 1000 ELSE NULL END), 0) as avg_response_time,
        IFNULL(SUM(CASE WHEN m.intent = 'fallback' THEN 1 ELSE 0 END) / NULLIF(COUNT(CASE WHEN m.sender = 'user' THEN 1 ELSE NULL END), 0), 0) as fallback_rate
    FROM 
        conversations c
    JOIN 
        messages m ON c.id = m.conversation_id
    WHERE 
        DATE(c.started_at) = calculation_date
    ON DUPLICATE KEY UPDATE
        total_conversations = VALUES(total_conversations),
        total_messages = VALUES(total_messages),
        avg_messages_per_conversation = VALUES(avg_messages_per_conversation),
        avg_response_time_ms = VALUES(avg_response_time_ms),
        fallback_rate = VALUES(fallback_rate);
        
    -- Calcular métricas de intenciones
    INSERT INTO intent_metrics (
        date,
        intent_name,
        count,
        avg_confidence,
        fallback_count
    )
    SELECT 
        calculation_date,
        IFNULL(m.intent, 'unknown') as intent_name,
        COUNT(*) as count,
        AVG(m.confidence) as avg_confidence,
        SUM(CASE WHEN m.intent = 'fallback' THEN 1 ELSE 0 END) as fallback_count
    FROM 
        messages m
    JOIN 
        conversations c ON m.conversation_id = c.id
    WHERE 
        DATE(m.created_at) = calculation_date
        AND m.sender = 'user'
        AND m.intent IS NOT NULL
    GROUP BY 
        intent_name
    ON DUPLICATE KEY UPDATE
        count = VALUES(count),
        avg_confidence = VALUES(avg_confidence),
        fallback_count = VALUES(fallback_count);
END //
DELIMITER ;

-- Trigger para actualizar métricas cuando termina una conversación
DELIMITER //
CREATE TRIGGER after_conversation_end
AFTER UPDATE ON conversations
FOR EACH ROW
BEGIN
    IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
        CALL calculate_daily_metrics(DATE(NEW.started_at));
    END IF;
END //
DELIMITER ;

-- Insertar algunos datos de ejemplo para pruebas
INSERT INTO conversation_metrics_daily 
(date, total_conversations, total_messages, avg_messages_per_conversation, avg_response_time_ms, fallback_rate, satisfaction_score)
VALUES
(DATE_SUB(CURDATE(), INTERVAL 6 DAY), 45, 230, 5.11, 320, 0.08, 4.2),
(DATE_SUB(CURDATE(), INTERVAL 5 DAY), 52, 278, 5.35, 305, 0.07, 4.3),
(DATE_SUB(CURDATE(), INTERVAL 4 DAY), 48, 245, 5.10, 315, 0.09, 4.1),
(DATE_SUB(CURDATE(), INTERVAL 3 DAY), 56, 310, 5.54, 290, 0.06, 4.4),
(DATE_SUB(CURDATE(), INTERVAL 2 DAY), 62, 348, 5.61, 285, 0.05, 4.5),
(DATE_SUB(CURDATE(), INTERVAL 1 DAY), 58, 325, 5.60, 280, 0.06, 4.4),
(CURDATE(), 35, 182, 5.20, 295, 0.07, 4.3);

INSERT INTO intent_metrics
(date, intent_name, count, avg_confidence, fallback_count)
VALUES
(CURDATE(), 'saludo', 35, 0.92, 0),
(CURDATE(), 'consultar_horario', 28, 0.85, 2),
(CURDATE(), 'consultar_profesor', 22, 0.88, 1),
(CURDATE(), 'consultar_curso', 18, 0.82, 3),
(CURDATE(), 'consultar_evento', 15, 0.79, 2),
(CURDATE(), 'despedida', 30, 0.94, 0),
(CURDATE(), 'agradecer', 25, 0.91, 0),
(CURDATE(), 'fallback', 9, 0.35, 9);

INSERT INTO keyword_frequency
(date, keyword, count)
VALUES
(CURDATE(), 'horario', 42),
(CURDATE(), 'profesor', 38),
(CURDATE(), 'examen', 35),
(CURDATE(), 'clase', 30),
(CURDATE(), 'biblioteca', 25),
(CURDATE(), 'inscripción', 22),
(CURDATE(), 'curso', 20),
(CURDATE(), 'calendario', 18),
(CURDATE(), 'nota', 15),
(CURDATE(), 'tarea', 12);

INSERT INTO user_category_metrics
(date, user_category, total_conversations, avg_messages_per_conversation, avg_satisfaction)
VALUES
(CURDATE(), 'student', 25, 5.8, 4.2),
(CURDATE(), 'teacher', 8, 4.5, 4.5),
(CURDATE(), 'admin', 2, 3.5, 4.8);
