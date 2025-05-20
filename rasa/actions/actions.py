from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
import os
import logging
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuración de la base de datos
DB_HOST = os.getenv("DB_HOST", "db")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_DATABASE = os.getenv("DB_DATABASE", "eduassistai")
DB_USERNAME = os.getenv("DB_USERNAME", "eduassistai")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")

class ActionConsultaKnowledgeBase(Action):
    """Acción para consultar la base de conocimiento."""

    def name(self) -> Text:
        return "action_consulta_knowledge_base"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # Obtener la consulta del usuario
        user_message = tracker.latest_message.get("text", "")
        
        try:
            # Conectar a la base de datos
            connection = mysql.connector.connect(
                host=DB_HOST,
                port=DB_PORT,
                database=DB_DATABASE,
                user=DB_USERNAME,
                password=DB_PASSWORD
            )
            
            if connection.is_connected():
                cursor = connection.cursor(dictionary=True)
                
                # Consultar la base de conocimiento
                query = """
                SELECT answer
                FROM knowledge_base
                WHERE MATCH(question) AGAINST(%s IN NATURAL LANGUAGE MODE)
                ORDER BY MATCH(question) AGAINST(%s IN NATURAL LANGUAGE MODE) DESC
                LIMIT 1
                """
                cursor.execute(query, (user_message, user_message))
                result = cursor.fetchone()
                
                if result:
                    # Responder con la información encontrada
                    dispatcher.utter_message(text=result["answer"])
                else:
                    # No se encontró información en la base de conocimiento
                    dispatcher.utter_message(text="Lo siento, no tengo información específica sobre eso en mi base de conocimiento. ¿Hay algo más en lo que pueda ayudarte?")
                
                cursor.close()
                connection.close()
                
        except Error as e:
            logger.error(f"Error al conectar a la base de datos: {e}")
            dispatcher.utter_message(text="Lo siento, ha ocurrido un error al consultar la información. Por favor, inténtalo de nuevo más tarde.")
        
        return []

class ActionRegistrarFeedback(Action):
    """Acción para registrar el feedback del usuario."""

    def name(self) -> Text:
        return "action_registrar_feedback"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # Obtener el rating del usuario (si existe)
        rating = next(tracker.get_latest_entity_values("rating"), None)
        
        # Obtener el comentario del usuario
        user_message = tracker.latest_message.get("text", "")
        
        # Obtener el ID del mensaje al que se refiere el feedback
        message_id = tracker.get_slot("last_message_id")
        
        if not rating or not message_id:
            dispatcher.utter_message(text="Lo siento, no pude registrar tu feedback. Por favor, intenta de nuevo proporcionando una calificación del 1 al 5.")
            return []
        
        try:
            # Conectar a la base de datos
            connection = mysql.connector.connect(
                host=DB_HOST,
                port=DB_PORT,
                database=DB_DATABASE,
                user=DB_USERNAME,
                password=DB_PASSWORD
            )
            
            if connection.is_connected():
                cursor = connection.cursor()
                
                # Registrar el feedback
                query = """
                INSERT INTO feedback (message_id, rating, comment)
                VALUES (%s, %s, %s)
                """
                cursor.execute(query, (message_id, rating, user_message))
                connection.commit()
                
                cursor.close()
                connection.close()
                
                dispatcher.utter_message(text=f"¡Gracias por tu feedback! Has calificado con {rating} estrellas.")
                
        except Error as e:
            logger.error(f"Error al conectar a la base de datos: {e}")
            dispatcher.utter_message(text="Lo siento, ha ocurrido un error al registrar tu feedback. Por favor, inténtalo de nuevo más tarde.")
        
        # Limpiar el slot
        return [SlotSet("last_message_id", None)]

class ActionGuardarMensaje(Action):
    """Acción para guardar el mensaje en la base de datos."""

    def name(self) -> Text:
        return "action_guardar_mensaje"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # Obtener información del mensaje
        user_message = tracker.latest_message.get("text", "")
        intent = tracker.latest_message.get("intent", {}).get("name", "")
        confidence = tracker.latest_message.get("intent", {}).get("confidence", 0.0)
        sender_id = tracker.sender_id
        
        try:
            # Conectar a la base de datos
            connection = mysql.connector.connect(
                host=DB_HOST,
                port=DB_PORT,
                database=DB_DATABASE,
                user=DB_USERNAME,
                password=DB_PASSWORD
            )
            
            if connection.is_connected():
                cursor = connection.cursor()
                
                # Verificar si existe una conversación activa para este usuario
                query = """
                SELECT id FROM conversations
                WHERE session_id = %s AND ended_at IS NULL
                ORDER BY started_at DESC
                LIMIT 1
                """
                cursor.execute(query, (sender_id,))
                result = cursor.fetchone()
                
                if result:
                    conversation_id = result[0]
                else:
                    # Crear una nueva conversación
                    query = """
                    INSERT INTO conversations (session_id)
                    VALUES (%s)
                    """
                    cursor.execute(query, (sender_id,))
                    connection.commit()
                    conversation_id = cursor.lastrowid
                
                # Guardar el mensaje
                query = """
                INSERT INTO messages (conversation_id, sender, message, intent, confidence)
                VALUES (%s, %s, %s, %s, %s)
                """
                cursor.execute(query, (conversation_id, "user", user_message, intent, confidence))
                connection.commit()
                message_id = cursor.lastrowid
                
                # Guardar entidades
                for entity in tracker.latest_message.get("entities", []):
                    query = """
                    INSERT INTO entities (message_id, entity_name, entity_value, confidence)
                    VALUES (%s, %s, %s, %s)
                    """
                    cursor.execute(query, (message_id, entity.get("entity"), entity.get("value"), entity.get("confidence", 0.0)))
                    connection.commit()
                
                cursor.close()
                connection.close()
                
                # Establecer el ID del último mensaje para posible feedback
                return [SlotSet("last_message_id", message_id)]
                
        except Error as e:
            logger.error(f"Error al conectar a la base de datos: {e}")
        
        return []
