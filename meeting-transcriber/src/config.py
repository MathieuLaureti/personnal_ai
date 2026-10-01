from __future__ import annotations

import torch
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    hf_token: str = Field(..., alias="HF_TOKEN", min_length=1)
    whisper_model: str = Field(default="large-v3-turbo", alias="WHISPER_MODEL")
    batch_size: int = Field(default=16, alias="BATCH_SIZE", ge=1)

    @property
    def device(self) -> str:
        return "cuda" if torch.cuda.is_available() else "cpu"

    @property
    def compute_type(self) -> str:
        return "float16" if self.device == "cuda" else "int8"

    @field_validator("hf_token")
    @classmethod
    def strip_token(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("HF_TOKEN must be set for Pyannote diarization")
        return stripped


def load_settings(**overrides: object) -> Settings:
    return Settings(**overrides)  # type: ignore[arg-type]
