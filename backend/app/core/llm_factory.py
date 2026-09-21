"""
Centralized LLM Factory for NyaySahayak.

Supports:
1. Google Gemini via langchain-google-genai (Default & Recommended for Legal Context)
2. OpenAI via langchain-openai
3. Graceful fallback when API keys are not configured.
"""

import os
import logging
from typing import Optional, Any
from pydantic import BaseModel

logger = logging.getLogger("nyaysahayak.llm_factory")

def get_configured_llm(temperature: float = 0.1) -> Optional[Any]:
    """
    Returns an instantiated LangChain ChatModel based on available environment variables.
    Checks GOOGLE_API_KEY / GEMINI_API_KEY first, then OPENAI_API_KEY.
    Returns None if no API key is set (allowing heuristic fallback).
    """
    google_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if google_key:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            # Use gemini-1.5-flash or gemini-2.0-flash
            model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
            return ChatGoogleGenerativeAI(
                model=model_name,
                temperature=temperature,
                google_api_key=google_key
            )
        except Exception as e:
            logger.warning(f"Failed to initialize ChatGoogleGenerativeAI: {e}")

    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        try:
            from langchain_openai import ChatOpenAI
            model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
            return ChatOpenAI(
                model=model_name,
                temperature=temperature,
                api_key=openai_key
            )
        except Exception as e:
            logger.warning(f"Failed to initialize ChatOpenAI: {e}")

    return None

def is_llm_available() -> bool:
    """Returns True if a live LLM provider is configured."""
    return get_configured_llm() is not None
