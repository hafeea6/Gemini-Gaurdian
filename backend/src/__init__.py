# =============================================================================
# GEMINI GUARDIAN - BACKEND SOURCE PACKAGE
# =============================================================================
# This package contains all the source code for the Gemini Guardian backend.
# The backend is built with FastAPI and provides real-time emergency assistance
# through video/audio analysis using Google's Gemini AI models.
#
# Package Structure:
# - config/       : Configuration and environment management
# - controllers/  : Request handlers and HTTP response logic
# - dtos/         : Data Transfer Objects for request/response validation
# - middlewares/  : Request/response interceptors (logging, CORS, errors)
# - models/       : Database models and Pydantic schemas
# - repositories/ : Data access layer (if database is used)
# - routes/       : API endpoint definitions
# - services/     : Core business logic and AI integration
# - utils/        : Shared utility functions
# =============================================================================

"""
Gemini Guardian Backend Package

This is a life-critical application for real-time emergency assistance.
All code must be clean, defensive, and predictable.
"""

__version__ = "1.0.0"
__author__ = "Gemini Guardian Team"
