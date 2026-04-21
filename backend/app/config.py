"""
AutoPilot AI Workspace — Application Configuration
Reads all settings from environment variables (.env file).
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List


class Settings(BaseSettings):
    # OpenAI
    openai_api_key: str = Field(..., env="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o", env="OPENAI_MODEL")

    # Supabase
    supabase_url: str = Field(..., env="SUPABASE_URL")
    supabase_anon_key: str = Field(..., env="SUPABASE_ANON_KEY")
    supabase_service_role_key: str = Field(..., env="SUPABASE_SERVICE_ROLE_KEY")

    # App
    app_env: str = Field(default="development", env="APP_ENV")
    app_host: str = Field(default="0.0.0.0", env="APP_HOST")
    app_port: int = Field(default=8000, env="APP_PORT")
    secret_key: str = Field(..., env="SECRET_KEY")

    # CORS
    cors_origins: str = Field(
        default="http://localhost:3000", env="CORS_ORIGINS"
    )

    # Optional integrations
    sendgrid_api_key: str = Field(default="", env="SENDGRID_API_KEY")
    redis_url: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")

    @property
    def allowed_origins(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
