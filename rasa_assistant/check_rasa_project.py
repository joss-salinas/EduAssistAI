#!/usr/bin/env python3
"""
Script para verificar y corregir problemas en un proyecto Rasa.
"""

import os
import sys
import glob
import yaml
import json
import shutil
from pathlib import Path

def print_header(message):
    """Imprime un encabezado formateado."""
    print(f"\n{'='*80}\n{message}\n{'='*80}")

def check_file_exists(file_path, create_if_missing=False, template=None):
    """Verifica si un archivo existe y lo crea si es necesario."""
    if os.path.exists(file_path):
        print(f"✅ {file_path} existe.")
        return True
    else:
        print(f"❌ {file_path} no existe.")
        if create_if_missing and template:
            print(f"Creando {file_path}...")
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, 'w') as f:
                f.write(template)
            print(f"✅ {file_path} creado.")
            return True
        return False

def check_directory_exists(dir_path, create_if_missing=False):
    """Verifica si un directorio existe y lo crea si es necesario."""
    if os.path.isdir(dir_path):
        print(f"✅ {dir_path} existe.")
        return True
    else:
        print(f"❌ {dir_path} no existe.")
        if create_if_missing:
            print(f"Creando {dir_path}...")
            os.makedirs(dir_path, exist_ok=True)
            print(f"✅ {dir_path} creado.")
            return True
        return False

def check_rasa_project_structure():
    """Verifica la estructura del proyecto Rasa."""
    print_header("VERIFICACIÓN DE LA ESTRUCTURA DEL PROYECTO RASA")
    
    # Verificar directorios principales
    check_directory_exists("data", create_if_missing=True)
    check_directory_exists("actions", create_if_missing=True)
    check_directory_exists("models", create_if_missing=True)
    
    # Verificar subdirectorios de datos
    check_directory_exists("data/nlu", create_if_missing=True)
    check_directory_exists("data/stories", create_if_missing=True)
    check_directory_exists("data/rules", create_if_missing=True)
    
    # Verificar archivos de configuración
    config_template = """language: es
pipeline:
  - name: SpacyNLP
    model: "es_core_news_md"
  - name: SpacyTokenizer
  - name: SpacyFeaturizer
  - name: RegexFeaturizer
  - name: LexicalSyntacticFeaturizer
  - name: CountVectorsFeaturizer
  - name: CountVectorsFeaturizer
    analyzer: "char_wb"
    min_ngram: 1
    max_ngram: 4
  - name: DIETClassifier
    epochs: 100
    constrain_similarities: true
  - name: EntitySynonymMapper
  - name: ResponseSelector
    epochs: 100
    constrain_similarities: true
  - name: FallbackClassifier
    threshold: 0.7
    ambiguity_threshold: 0.1

policies:
  - name: MemoizationPolicy
    max_history: 5
  - name: RulePolicy
    core_fallback_threshold: 0.3
    core_fallback_action_name: "action_default_fallback"
    enable_fallback_prediction: true
  - name: TEDPolicy
    max_history: 10
    epochs: 20
    constrain_similarities: true
"""
    check_file_exists("config.yml", create_if_missing=True, template=config_template)
    
    domain_template = """version: "3.1"

intents:
  - greet
  - goodbye
  - affirm
  - deny
  - mood_great
  - mood_unhappy
  - bot_challenge
  - inform
  - request_help
  - thank

entities:
  - subject
  - topic
  - question

slots:
  subject:
    type: text
    influence_conversation: true
    mappings:
    - type: from_entity
      entity: subject
  topic:
    type: text
    influence_conversation: true
    mappings:
    - type: from_entity
      entity: topic

responses:
  utter_greet:
  - text: "¡Hola! ¿En qué puedo ayudarte hoy?"
  
  utter_cheer_up:
  - text: "Aquí tienes algo para animarte:"
    image: "https://i.imgur.com/nGF1K8f.jpg"
    
  utter_did_that_help:
  - text: "¿Te ha sido útil?"
  
  utter_happy:
  - text: "¡Genial! ¿En qué más puedo ayudarte?"
  
  utter_goodbye:
  - text: "¡Hasta pronto!"
  
  utter_iamabot:
  - text: "Soy un asistente virtual diseñado para ayudarte con tus consultas educativas."
  
  utter_default:
  - text: "Lo siento, no entendí eso. ¿Podrías reformularlo?"

  utter_ask_subject:
  - text: "¿Sobre qué materia quieres consultar?"

  utter_ask_topic:
  - text: "¿Qué tema específico te interesa?"

actions:
  - action_greet_with_time_awareness
  - action_handle_small_talk
  - action_search_knowledge_base
  - action_detect_and_respond_to_emotion
  - action_maintain_conversation_context
  - action_generate_contextual_response
  - action_default_fallback

session_config:
  session_expiration_time: 60
  carry_over_slots_to_new_session: true
"""
    check_file_exists("domain.yml", create_if_missing=True, template=domain_template)
    
    endpoints_template = """# This file contains the different endpoints your bot can use.

# Server where the models are pulled from.
# https://rasa.com/docs/rasa/model-storage#fetching-models-from-a-server

#models:
#  url: http://my-server.com/models/default_core@latest
#  wait_time_between_pulls:  10   # [optional](default: 100)

# Server which runs your custom actions.
# https://rasa.com/docs/rasa/custom-actions

action_endpoint:
  url: "http://localhost:5055/webhook"

# Tracker store which is used to store the conversations.
# By default the conversations are stored in memory.
# https://rasa.com/docs/rasa/tracker-stores

#tracker_store:
#    type: redis
#    url: <host of the redis instance, e.g. localhost>
#    port: <port of your redis instance, usually 6379>
#    db: <number of your database within redis, e.g. 0>
#    password: <password used for authentication>
#    use_ssl: <whether or not the communication is encrypted, default false>

#tracker_store:
#    type: mongod
#    url: <url to your mongo instance, e.g. mongodb://localhost:27017>
#    db: <name of the db within your mongo instance, e.g. rasa>
#    username: <username used for authentication>
#    password: <password used for authentication>

# Event broker which all conversation events should be streamed to.
# https://rasa.com/docs/rasa/event-brokers

#event_broker:
#  url: localhost
#  username: username
#  password: password
#  queue: queue
"""
    check_file_exists("endpoints.yml", create_if_missing=True, template=endpoints_template)
    
    # Verificar archivos de datos
    nlu_template = """version: "3.1"

nlu:
- intent: greet
  examples: |
    - hola
    - buenos días
    - buenas tardes
    - buenas noches
    - qué tal
    - saludos
    - hey
    - cómo estás
    - qué hay de nuevo
    - cómo te va

- intent: goodbye
  examples: |
    - adiós
    - hasta luego
    - nos vemos
    - hasta pronto
    - chao
    - bye
    - que tengas un buen día
    - me voy
    - hasta la próxima

- intent: affirm
  examples: |
    - sí
    - claro
    - por supuesto
    - suena bien
    - correcto
    - estoy de acuerdo
    - exacto
    - así es
    - definitivamente
    - seguro

- intent: deny
  examples: |
    - no
    - nunca
    - no creo
    - no me gusta
    - no estoy de acuerdo
    - para nada
    - de ninguna manera
    - negativo
    - no exactamente
    - no estoy seguro

- intent: mood_great
  examples: |
    - perfecto
    - muy bien
    - genial
    - maravilloso
    - me siento bien
    - estoy feliz
    - increíble
    - me siento feliz
    - estoy contento
    - estoy muy bien

- intent: mood_unhappy
  examples: |
    - triste
    - muy triste
    - infeliz
    - mal
    - muy mal
    - terrible
    - horrible
    - no muy bien
    - extremadamente triste
    - tan triste

- intent: bot_challenge
  examples: |
    - eres un bot?
    - eres un humano?
    - estoy hablando con un bot?
    - estoy hablando con un humano?
    - quién eres?
    - qué eres?
    - eres real?
    - eres una persona?
    - eres una máquina?
    - eres un asistente virtual?

- intent: inform
  examples: |
    - quiero aprender sobre [matemáticas](subject)
    - me interesa [historia](subject)
    - necesito ayuda con [física](subject)
    - tengo dudas sobre [química](subject)
    - estoy estudiando [biología](subject)
    - quiero saber más sobre [álgebra](topic)
    - me gustaría entender [ecuaciones diferenciales](topic)
    - no entiendo [la revolución francesa](topic)
    - explícame [la fotosíntesis](topic)
    - háblame de [la segunda guerra mundial](topic)

- intent: request_help
  examples: |
    - necesito ayuda
    - puedes ayudarme
    - ayúdame por favor
    - estoy atascado
    - no entiendo esto
    - tengo problemas con
    - cómo puedo resolver
    - me podrías explicar
    - no sé cómo hacer
    - tengo una duda

- intent: thank
  examples: |
    - gracias
    - muchas gracias
    - te lo agradezco
    - muy amable
    - gracias por la ayuda
    - gracias por explicarme
    - te agradezco mucho
    - excelente, gracias
    - perfecto, gracias
    - genial, gracias
"""
    check_file_exists("data/nlu.yml", create_if_missing=True, template=nlu_template)
    
    stories_template = """version: "3.1"

stories:
- story: happy path
  steps:
  - intent: greet
  - action: action_greet_with_time_awareness
  - intent: mood_great
  - action: utter_happy
  - intent: goodbye
  - action: utter_goodbye

- story: sad path 1
  steps:
  - intent: greet
  - action: action_greet_with_time_awareness
  - intent: mood_unhappy
  - action: utter_cheer_up
  - action: utter_did_that_help
  - intent: affirm
  - action: utter_happy

- story: sad path 2
  steps:
  - intent: greet
  - action: action_greet_with_time_awareness
  - intent: mood_unhappy
  - action: utter_cheer_up
  - action: utter_did_that_help
  - intent: deny
  - action: action_detect_and_respond_to_emotion

- story: subject inquiry
  steps:
  - intent: greet
  - action: action_greet_with_time_awareness
  - intent: inform
    entities:
    - subject: "matemáticas"
  - slot_was_set:
    - subject: "matemáticas"
  - action: action_maintain_conversation_context
  - action: utter_ask_topic
  - intent: inform
    entities:
    - topic: "álgebra"
  - slot_was_set:
    - topic: "álgebra"
  - action: action_search_knowledge_base

- story: thank you
  steps:
  - intent: thank
  - action: action_handle_small_talk
  - intent: goodbye
  - action: utter_goodbye
"""
    check_file_exists("data/stories.yml", create_if_missing=True, template=stories_template)
    
    rules_template = """version: "3.1"

rules:
- rule: Say goodbye anytime the user says goodbye
  steps:
  - intent: goodbye
  - action: utter_goodbye

- rule: Say 'I am a bot' anytime the user challenges
  steps:
  - intent: bot_challenge
  - action: utter_iamabot

- rule: Activate form for subject inquiry
  steps:
  - intent: request_help
  - action: utter_ask_subject

- rule: Respond to thank you
  steps:
  - intent: thank
  - action: action_handle_small_talk

- rule: Fallback
  steps:
  - intent: nlu_fallback
  - action: action_default_fallback
"""
    check_file_exists("data/rules.yml", create_if_missing=True, template=rules_template)
    
    # Verificar archivo de acciones
    actions_init_template = """# Este archivo es necesario para que Python reconozca
# el directorio 'actions' como un paquete Python.
"""
    check_file_exists("actions/__init__.py", create_if_missing=True, template=actions_init_template)
    
    actions_template = """from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
import datetime
import random

class ActionGreetWithTimeAwareness(Action):
    def name(self) -> Text:
        return "action_greet_with_time_awareness"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # Obtener la hora actual
        current_time = datetime.datetime.now()
        hour = current_time.hour
        
        # Determinar el saludo según la hora
        if 5 <= hour < 12:
            greeting = "¡Buenos días!"
        elif 12 <= hour < 19:
            greeting = "¡Buenas tardes!"
        else:
            greeting = "¡Buenas noches!"
            
        # Añadir variabilidad a la respuesta
        responses = [
            f"{greeting} ¿En qué puedo ayudarte hoy?",
            f"{greeting} Soy tu asistente educativo. ¿Cómo puedo ayudarte?",
            f"{greeting} Estoy aquí para resolver tus dudas. ¿Qué necesitas?"
        ]
        
        dispatcher.utter_message(text=random.choice(responses))
        return []

class ActionHandleSmallTalk(Action):
    def name(self) -> Text:
        return "action_handle_small_talk"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # Obtener la última intención
        last_intent = tracker.latest_message.get("intent", {}).get("name", "")
        
        # Respuestas para small talk
        if last_intent == "thank":
            responses = [
                "¡De nada! Estoy aquí para ayudarte.",
                "Es un placer poder ayudarte.",
                "No hay de qué. ¿Hay algo más en lo que pueda ayudarte?",
                "Para eso estoy. ¿Necesitas algo más?"
            ]
            dispatcher.utter_message(text=random.choice(responses))
        else:
            dispatcher.utter_message(text="Entiendo. ¿En qué más puedo ayudarte?")
            
        return []

class ActionSearchKnowledgeBase(Action):
    def name(self) -> Text:
        return "action_search_knowledge_base"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # Obtener los slots relevantes
        subject = tracker.get_slot("subject")
        topic = tracker.get_slot("topic")
        
        # Simulación de búsqueda en base de conocimiento
        if subject and topic:
            dispatcher.utter_message(text=f"He encontrado información sobre {topic} en {subject}. "
                                         f"Aquí tienes un resumen de lo más importante...")
        elif subject:
            dispatcher.utter_message(text=f"Tengo varios recursos sobre {subject}. "
                                         f"¿Hay algún tema específico que te interese?")
        else:
            dispatcher.utter_message(text="Para ayudarte mejor, necesito saber qué materia te interesa.")
            
        return []

class ActionDetectAndRespondToEmotion(Action):
    def name(self) -> Text:
        return "action_detect_and_respond_to_emotion"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # Obtener el último mensaje
        last_message = tracker.latest_message.get("text", "")
        
        # Palabras clave para detectar emociones (simplificado)
        negative_emotions = ["triste", "mal", "terrible", "horrible", "infeliz", "frustrado", "enojado", "molesto"]
        positive_emotions = ["feliz", "contento", "genial", "excelente", "fantástico", "maravilloso", "alegre"]
        
        # Detectar emoción basada en palabras clave
        has_negative = any(word in last_message.lower() for word in negative_emotions)
        has_positive = any(word in last_message.lower() for word in positive_emotions)
        
        # Responder según la emoción detectada
        if has_negative:
            responses = [
                "Entiendo que te sientas así. Estoy aquí para ayudarte.",
                "Lamento que estés pasando por eso. Intentemos encontrar una solución juntos.",
                "A veces los temas difíciles pueden ser frustrantes. Vamos paso a paso."
            ]
            dispatcher.utter_message(text=random.choice(responses))
        elif has_positive:
            responses = [
                "¡Me alegra que te sientas así! Sigamos con ese entusiasmo.",
                "¡Excelente! Es genial ver que estás motivado/a.",
                "¡Qué bueno! Con esa actitud positiva, aprenderás rápidamente."
            ]
            dispatcher.utter_message(text=random.choice(responses))
        else:
            dispatcher.utter_message(text="Estoy aquí para ayudarte. ¿Qué necesitas?")
            
        return []

class ActionMaintainConversationContext(Action):
    def name(self) -> Text:
        return "action_maintain_conversation_context"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # Obtener los slots actuales
        subject = tracker.get_slot("subject")
        topic = tracker.get_slot("topic")
        
        # Mantener el contexto de la conversación
        if subject and not topic:
            dispatcher.utter_message(text=f"Estamos hablando sobre {subject}. "
                                         f"¿Hay algún tema específico que te interese?")
        elif subject and topic:
            dispatcher.utter_message(text=f"Continuamos con el tema {topic} en {subject}.")
        
        return []

class ActionGenerateContextualResponse(Action):
    def name(self) -> Text:
        return "action_generate_contextual_response"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # Obtener el historial de la conversación
        conversation_history = tracker.events
        
        # Generar una respuesta contextual basada en el historial
        # (Esta es una implementación simplificada)
        dispatcher.utter_message(text="Basándome en nuestra conversación, creo que puedo ayudarte con esto...")
        
        return []
"""
    check_file_exists("actions/actions.py", create_if_missing=True, template=actions_template)
    
    print_header("VERIFICACIÓN COMPLETADA")
    print("La estructura del proyecto Rasa ha sido verificada y corregida si era necesario.")
    print("Ahora puedes entrenar tu modelo con: rasa train")

if __name__ == "__main__":
    check_rasa_project_structure()
