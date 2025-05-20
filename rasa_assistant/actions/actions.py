from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
import datetime
import random

# Importar el analizador de sentimiento con manejo de errores
try:
    from .sentiment_analyzer import analyze_sentiment
    SENTIMENT_ANALYZER_AVAILABLE = True
except ImportError:
    SENTIMENT_ANALYZER_AVAILABLE = False
    print("⚠️ No se pudo importar el analizador de sentimiento. La funcionalidad será limitada.")

class ActionGreetWithTimeAwareness(Action):
    def name(self) -> Text:
        return "action_greet_with_time_awareness"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # Obtener la hora actual
        current_time = datetime.datetime.now()
        hour = current_time.hour
        
        # Determinar el saludo apropiado según la hora
        if 5 <= hour < 12:
            greeting = "¡Buenos días!"
        elif 12 <= hour < 19:
            greeting = "¡Buenas tardes!"
        else:
            greeting = "¡Buenas noches!"
            
        # Obtener el nombre del usuario si está disponible
        user_name = tracker.get_slot("user_name")
        if user_name:
            greeting += f" {user_name}, es un placer verte de nuevo."
        
        dispatcher.utter_message(text=f"{greeting} ¿En qué puedo ayudarte hoy?")
        
        return []

class ActionHandleSmallTalk(Action):
    def name(self) -> Text:
        return "action_handle_small_talk"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # Obtener la intención detectada
        intent = tracker.latest_message.get("intent", {}).get("name", "")
        
        # Respuestas para small talk
        small_talk_responses = {
            "saludar": [
                "¡Hola! ¿En qué puedo ayudarte hoy?",
                "¡Saludos! Estoy aquí para asistirte.",
                "¡Hola! Es un placer hablar contigo."
            ],
            "despedir": [
                "¡Hasta luego! Fue un placer ayudarte.",
                "¡Adiós! Vuelve cuando necesites más ayuda.",
                "¡Hasta pronto! Estoy aquí cuando me necesites."
            ],
            "agradecer": [
                "¡De nada! Estoy aquí para ayudar.",
                "Es un placer poder asistirte.",
                "No hay de qué. ¿Hay algo más en lo que pueda ayudarte?"
            ],
            "preguntar_como_estas": [
                "¡Estoy funcionando perfectamente! Gracias por preguntar. ¿Y tú cómo estás?",
                "Todo bien por aquí, listo para ayudarte. ¿Cómo va tu día?",
                "Estoy bien, gracias. ¿En qué puedo asistirte hoy?"
            ]
        }
        
        # Seleccionar una respuesta aleatoria para la intención detectada
        if intent in small_talk_responses:
            responses = small_talk_responses[intent]
            response = random.choice(responses)
            dispatcher.utter_message(text=response)
        else:
            # Respuesta genérica si no se reconoce la intención
            dispatcher.utter_message(text="Estoy aquí para ayudarte. ¿Qué necesitas?")
        
        return []

class ActionDetectAndRespondToEmotion(Action):
    def name(self) -> Text:
        return "action_detect_and_respond_to_emotion"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # Obtener el último mensaje del usuario
        last_message = tracker.latest_message.get("text", "")
        
        # Analizar el sentimiento si el analizador está disponible
        if SENTIMENT_ANALYZER_AVAILABLE and last_message:
            try:
                analysis = analyze_sentiment(last_message)
                
                # Obtener la emoción dominante
                dominant_emotion = analysis.get("dominant_emotion", "neutral")
                
                # Respuestas según la emoción detectada
                emotion_responses = {
                    "alegría": [
                        "¡Me alegra que estés de buen humor!",
                        "Es genial verte tan positivo.",
                        "Tu entusiasmo es contagioso."
                    ],
                    "tristeza": [
                        "Lamento que te sientas así. ¿Puedo ayudarte en algo?",
                        "Entiendo que a veces las cosas pueden ser difíciles. Estoy aquí para ayudar.",
                        "¿Hay algo específico que te preocupe? Tal vez pueda ayudarte."
                    ],
                    "enojo": [
                        "Entiendo tu frustración. Intentemos resolver esto juntos.",
                        "Lamento que estés molesto. ¿Cómo puedo ayudarte?",
                        "Veo que esto es importante para ti. Hagamos lo posible por solucionarlo."
                    ],
                    "miedo": [
                        "Entiendo tu preocupación. Estoy aquí para ayudarte.",
                        "Es normal sentirse así ante la incertidumbre. Veamos qué podemos hacer.",
                        "Trabajemos juntos para abordar tus preocupaciones."
                    ],
                    "sorpresa": [
                        "¡Vaya! Parece que esto te ha sorprendido.",
                        "Entiendo tu asombro. A veces las cosas pueden ser inesperadas.",
                        "Es interesante, ¿verdad? Exploremos esto más a fondo."
                    ],
                    "confusión": [
                        "Parece que hay algo que no está claro. Intentaré explicarlo mejor.",
                        "Entiendo que esto puede ser confuso. Vamos paso a paso.",
                        "No te preocupes, es normal tener dudas. Estoy aquí para aclarar tus preguntas."
                    ],
                    "neutral": [
                        "¿En qué más puedo ayudarte hoy?",
                        "Estoy aquí para asistirte. ¿Qué necesitas?",
                        "¿Hay algo específico en lo que pueda ayudarte?"
                    ]
                }
                
                # Seleccionar una respuesta aleatoria para la emoción detectada
                if dominant_emotion in emotion_responses:
                    responses = emotion_responses[dominant_emotion]
                    response = random.choice(responses)
                    dispatcher.utter_message(text=response)
                else:
                    # Respuesta genérica si no se reconoce la emoción
                    dispatcher.utter_message(text="Estoy aquí para ayudarte. ¿Qué necesitas?")
                
            except Exception as e:
                print(f"Error al analizar el sentimiento: {e}")
                dispatcher.utter_message(text="¿En qué puedo ayudarte hoy?")
        else:
            # Si el analizador no está disponible, dar una respuesta genérica
            dispatcher.utter_message(text="¿En qué puedo ayudarte hoy?")
        
        return []

class ActionMaintainConversationContext(Action):
    def name(self) -> Text:
        return "action_maintain_conversation_context"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # Esta acción no envía mensajes, solo mantiene el contexto
        # En una implementación real, aquí se actualizarían slots o se realizarían otras operaciones
        
        return []

class ActionSearchKnowledgeBase(Action):
    def name(self) -> Text:
        return "action_search_knowledge_base"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # Obtener la consulta del usuario
        query = tracker.latest_message.get("text", "")
        
        # En una implementación real, aquí se buscaría en una base de conocimiento
        # Por ahora, solo damos una respuesta genérica
        
        dispatcher.utter_message(text=f"He buscado información sobre '{query}'. En una implementación real, aquí se mostraría el resultado de la búsqueda.")
        
        return []

class ActionGenerateContextualResponse(Action):
    def name(self) -> Text:
        return "action_generate_contextual_response"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # Obtener el historial de la conversación
        conversation_history = tracker.events
        
        # En una implementación real, aquí se analizaría el historial para generar una respuesta contextual
        # Por ahora, solo damos una respuesta genérica
        
        dispatcher.utter_message(text="Basándome en nuestra conversación, puedo ayudarte con eso. En una implementación real, aquí se generaría una respuesta más contextual.")
        
        return []
