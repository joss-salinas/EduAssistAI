"""
Módulo para análisis de sentimiento y detección de emociones.
Versión simplificada con menos dependencias.
"""

import re
from typing import Dict, Any, List, Tuple, Optional

try:
    import nltk
    from nltk.sentiment.vader import SentimentIntensityAnalyzer
    
    # Descargar recursos necesarios si no existen
    try:
        nltk.data.find('vader_lexicon')
    except LookupError:
        nltk.download('vader_lexicon')
    
    try:
        nltk.data.find('punkt')
    except LookupError:
        nltk.download('punkt')
    
    NLTK_AVAILABLE = True
except ImportError:
    NLTK_AVAILABLE = False
    print("⚠️ NLTK no está disponible. La funcionalidad de análisis de sentimiento será limitada.")

try:
    import spacy
    try:
        nlp = spacy.load("es_core_news_md")
        SPACY_SPANISH_AVAILABLE = True
    except OSError:
        try:
            nlp = spacy.load("en_core_web_md")
            SPACY_SPANISH_AVAILABLE = False
            print("⚠️ Modelo español de spaCy no encontrado, usando modelo inglés como fallback.")
        except OSError:
            nlp = None
            SPACY_AVAILABLE = False
            print("⚠️ Modelos de spaCy no encontrados. Algunas funcionalidades estarán limitadas.")
    
    SPACY_AVAILABLE = nlp is not None
except ImportError:
    SPACY_AVAILABLE = False
    SPACY_SPANISH_AVAILABLE = False
    print("⚠️ spaCy no está disponible. La funcionalidad de análisis lingüístico será limitada.")

class EmotionDetector:
    """Detector simplificado de emociones y matices en texto."""
    
    # Emociones básicas y sus variantes (versión reducida)
    EMOTION_LEXICON = {
        "alegría": ["feliz", "contento", "encantado", "emocionado", "entusiasmado"],
        "tristeza": ["triste", "deprimido", "desanimado", "apenado", "desilusionado"],
        "enojo": ["enojado", "molesto", "irritado", "furioso", "indignado"],
        "miedo": ["asustado", "temeroso", "preocupado", "inquieto", "nervioso"],
        "sorpresa": ["sorprendido", "asombrado", "impresionado", "impactado"],
        "confusión": ["confundido", "perdido", "desorientado", "desconcertado"]
    }
    
    def __init__(self):
        """Inicializa el detector de emociones."""
        self.sia = SentimentIntensityAnalyzer() if NLTK_AVAILABLE else None
    
    def detect_emotions(self, text: str) -> Dict[str, Any]:
        """
        Analiza el texto para detectar emociones básicas.
        
        Args:
            text: El texto a analizar
            
        Returns:
            Un diccionario con los resultados del análisis
        """
        # Normalizar texto
        normalized_text = text.lower()
        
        # Análisis de sentimiento básico
        sentiment_scores = {}
        if NLTK_AVAILABLE and self.sia:
            sentiment_scores = self.sia.polarity_scores(text)
        else:
            # Análisis básico sin NLTK
            positive_words = ["bueno", "excelente", "genial", "fantástico", "maravilloso"]
            negative_words = ["malo", "terrible", "horrible", "pésimo", "desagradable"]
            
            positive_count = sum(1 for word in positive_words if word in normalized_text)
            negative_count = sum(1 for word in negative_words if word in normalized_text)
            total = positive_count + negative_count or 1  # Evitar división por cero
            
            sentiment_scores = {
                "pos": positive_count / total if total > 0 else 0,
                "neg": negative_count / total if total > 0 else 0,
                "neu": 1 - (positive_count + negative_count) / total if total > 0 else 1,
                "compound": (positive_count - negative_count) / total if total > 0 else 0
            }
        
        # Detectar emociones específicas
        emotions = self._detect_specific_emotions(normalized_text)
        
        # Determinar la emoción dominante
        dominant_emotion = max(emotions.items(), key=lambda x: x[1])[0] if emotions else "neutral"
        
        # Construir resultado final
        result = {
            "sentiment": sentiment_scores,
            "emotions": emotions,
            "dominant_emotion": dominant_emotion
        }
        
        return result
    
    def _detect_specific_emotions(self, text: str) -> Dict[str, float]:
        """Detecta emociones específicas en el texto."""
        emotions = {}
        
        # Tokenizar el texto de manera simple
        tokens = text.split() if not NLTK_AVAILABLE else nltk.word_tokenize(text)
        
        # Contar ocurrencias de palabras emocionales
        for emotion, keywords in self.EMOTION_LEXICON.items():
            count = 0
            for keyword in keywords:
                # Buscar coincidencias
                count += sum(1 for token in tokens if keyword in token)
            
            if count > 0:
                # Normalizar por longitud del texto
                emotions[emotion] = count / len(tokens) if tokens else 0
        
        # Si no se detectaron emociones, asignar "neutral"
        if not emotions:
            emotions["neutral"] = 1.0
        else:
            # Normalizar puntuaciones para que sumen 1
            total = sum(emotions.values())
            emotions = {k: v/total for k, v in emotions.items()}
        
        return emotions

# Instancia global para uso en acciones
emotion_detector = EmotionDetector()

def analyze_sentiment(text: str) -> Dict[str, Any]:
    """
    Función de conveniencia para analizar el sentimiento de un texto.
    
    Args:
        text: El texto a analizar
        
    Returns:
        Un diccionario con los resultados del análisis
    """
    return emotion_detector.detect_emotions(text)
