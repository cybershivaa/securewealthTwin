from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "SecureWealth Twin"
    environment: str = Field(default="development", alias="ENVIRONMENT")
    api_version: str = "v1"
    database_url: str = Field(default="postgresql+asyncpg://securewealth:securewealth@localhost:5432/securewealth", alias="DATABASE_URL")
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    jwt_issuer: str = "securewealth-twin"
    jwt_audience: str = "securewealth-mobile"
    jwt_access_ttl_seconds: int = 900
    jwt_refresh_ttl_seconds: int = 86400
    clock_skew_seconds: int = 90
    request_ttl_seconds: int = 60
    master_key_b64: str = Field(default="", alias="MASTER_KEY_B64")
    server_kyber_public_b64: str = Field(default="", alias="SERVER_KYBER_PUBLIC_B64")
    server_kyber_private_b64: str = Field(default="", alias="SERVER_KYBER_PRIVATE_B64")
    server_dilithium_private_b64: str = Field(default="", alias="SERVER_DILITHIUM_PRIVATE_B64")
    server_dilithium_public_b64: str = Field(default="", alias="SERVER_DILITHIUM_PUBLIC_B64")
    api_signing_key_b64: str = Field(default="", alias="API_SIGNING_KEY_B64")
    api_verification_key_b64: str = Field(default="", alias="API_VERIFICATION_KEY_B64")
    # Optional AWS Secrets Manager integration
    aws_region: str = Field(default="", alias="AWS_REGION")
    aws_secret_name: str = Field(default="", alias="AWS_SECRET_NAME")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
