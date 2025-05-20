-- Tabla de materias
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de relación profesor-materia
CREATE TABLE IF NOT EXISTS teacher_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    subject_id INT NOT NULL,
    is_coordinator BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE KEY (teacher_id, subject_id)
);

-- Tabla para clasificación de mensajes por materia
CREATE TABLE IF NOT EXISTS message_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT NOT NULL,
    subject_id INT NOT NULL,
    confidence DECIMAL(5,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE KEY (message_id, subject_id)
);

-- Tabla para métricas de preguntas por materia
CREATE TABLE IF NOT EXISTS subject_question_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    subject_id INT NOT NULL,
    total_questions INT DEFAULT 0,
    avg_confidence DECIMAL(5,4) DEFAULT 0,
    fallback_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE KEY (date, subject_id)
);

-- Tabla para temas frecuentes por materia
CREATE TABLE IF NOT EXISTS subject_topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    topic VARCHAR(100) NOT NULL,
    count INT DEFAULT 0,
    last_asked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE KEY (subject_id, topic)
);

-- Tabla para preguntas difíciles por materia
CREATE TABLE IF NOT EXISTS difficult_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    question TEXT NOT NULL,
    fallback_count INT DEFAULT 0,
    last_asked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Procedimiento almacenado para clasificar un mensaje por materia
DELIMITER //
CREATE PROCEDURE classify_message_by_subject(IN p_message_id INT, IN p_message_text TEXT)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE subject_id INT;
    DECLARE subject_name VARCHAR(100);
    DECLARE confidence DECIMAL(5,4);
    
    -- Cursor para recorrer todas las materias
    DECLARE cur CURSOR FOR SELECT id, name FROM subjects;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO subject_id, subject_name;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Algoritmo simple de clasificación basado en coincidencia de palabras clave
        -- En una implementación real, esto sería un algoritmo de NLP más sofisticado
        IF p_message_text LIKE CONCAT('%', subject_name, '%') THEN
            -- Si el nombre de la materia aparece en el mensaje, asignamos una confianza alta
            SET confidence = 0.9;
            
            -- Insertar la clasificación
            INSERT INTO message_subjects (message_id, subject_id, confidence)
            VALUES (p_message_id, subject_id, confidence)
            ON DUPLICATE KEY UPDATE confidence = VALUES(confidence);
            
            -- Actualizar métricas de la materia
            INSERT INTO subject_question_metrics (date, subject_id, total_questions)
            VALUES (CURDATE(), subject_id, 1)
            ON DUPLICATE KEY UPDATE total_questions = total_questions + 1;
        END IF;
    END LOOP;
    
    CLOSE cur;
END //
DELIMITER ;

-- Trigger para clasificar mensajes automáticamente
DELIMITER //
CREATE TRIGGER after_message_insert
AFTER INSERT ON messages
FOR EACH ROW
BEGIN
    IF NEW.sender = 'user' THEN
        CALL classify_message_by_subject(NEW.id, NEW.message);
    END IF;
END //
DELIMITER ;

-- Insertar datos de ejemplo para materias
INSERT INTO subjects (name, code, description) VALUES
('Matemáticas', 'MAT101', 'Curso básico de matemáticas'),
('Física', 'FIS101', 'Principios fundamentales de física'),
('Historia', 'HIS101', 'Historia mundial'),
('Literatura', 'LIT101', 'Literatura clásica y contemporánea'),
('Programación', 'PRG101', 'Introducción a la programación'),
('Química', 'QUI101', 'Fundamentos de química'),
('Biología', 'BIO101', 'Estudio de los seres vivos'),
('Economía', 'ECO101', 'Principios de economía');

-- Asignar materias a profesores (asumiendo que hay profesores con IDs 2, 3, 4)
INSERT INTO teacher_subjects (teacher_id, subject_id, is_coordinator) VALUES
(2, 1, TRUE),  -- Profesor 2 enseña Matemáticas y es coordinador
(2, 2, FALSE), -- Profesor 2 enseña Física
(3, 3, TRUE),  -- Profesor 3 enseña Historia y es coordinador
(3, 4, FALSE), -- Profesor 3 enseña Literatura
(4, 5, TRUE),  -- Profesor 4 enseña Programación y es coordinador
(4, 6, FALSE); -- Profesor 4 enseña Química

-- Insertar algunos temas frecuentes por materia
INSERT INTO subject_topics (subject_id, topic, count) VALUES
(1, 'Álgebra', 25),
(1, 'Cálculo', 18),
(1, 'Geometría', 15),
(1, 'Trigonometría', 12),
(2, 'Mecánica', 20),
(2, 'Electricidad', 15),
(2, 'Termodinámica', 10),
(3, 'Edad Media', 18),
(3, 'Revolución Industrial', 14),
(3, 'Guerra Mundial', 22),
(4, 'Shakespeare', 15),
(4, 'Cervantes', 12),
(5, 'Variables', 20),
(5, 'Funciones', 18),
(5, 'Bucles', 15),
(5, 'Objetos', 12);

-- Insertar algunas preguntas difíciles
INSERT INTO difficult_questions (subject_id, question, fallback_count) VALUES
(1, '¿Cómo se resuelve una ecuación diferencial de segundo orden?', 5),
(1, '¿Qué es el teorema de la incompletitud de Gödel?', 4),
(2, '¿Cómo funciona la dualidad onda-partícula en mecánica cuántica?', 6),
(3, '¿Cuáles fueron las causas exactas del colapso del Imperio Romano?', 3),
(4, '¿Cuál es la interpretación correcta del final de Cien años de soledad?', 4),
(5, '¿Cómo implementar un algoritmo de aprendizaje profundo desde cero?', 7);
