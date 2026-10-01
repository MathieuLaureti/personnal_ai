from __future__ import annotations

import logging
import time
from typing import Any

import torch
import whisperx

from .config import Settings, load_settings

logger = logging.getLogger(__name__)


def _create_diarization_pipeline(token: str, device: str) -> Any:
    try:
        return whisperx.DiarizationPipeline(use_auth_token=token, device=device)
    except TypeError:
        return whisperx.DiarizationPipeline(token=token, device=device)


class MeetingTranscriber:
    """Sequential WhisperX transcribe → align → diarize with explicit GPU cleanup."""

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or load_settings()

    def process(
        self,
        audio_path: str,
        min_speakers: int | None = None,
        max_speakers: int | None = None,
    ) -> list[dict[str, Any]]:
        timings: dict[str, float] = {}
        cfg = self.settings

        t0 = time.perf_counter()
        audio = whisperx.load_audio(audio_path)
        timings["load_audio"] = time.perf_counter() - t0
        logger.info("Loaded audio in %.2fs", timings["load_audio"])

        t0 = time.perf_counter()
        model = whisperx.load_model(
            cfg.whisper_model,
            device=cfg.device,
            compute_type=cfg.compute_type,
        )
        result = model.transcribe(audio, batch_size=cfg.batch_size)
        del model
        if cfg.device == "cuda":
            torch.cuda.empty_cache()
        timings["transcribe"] = time.perf_counter() - t0
        logger.info("Transcribed in %.2fs", timings["transcribe"])

        language = result.get("language") or "en"

        t0 = time.perf_counter()
        align_model, metadata = whisperx.load_align_model(
            language_code=language,
            device=cfg.device,
        )
        result = whisperx.align(
            result["segments"],
            align_model,
            metadata,
            audio,
            cfg.device,
            return_char_alignments=False,
        )
        del align_model
        if cfg.device == "cuda":
            torch.cuda.empty_cache()
        timings["align"] = time.perf_counter() - t0
        logger.info("Aligned in %.2fs", timings["align"])

        t0 = time.perf_counter()
        diarize_model = _create_diarization_pipeline(cfg.hf_token, cfg.device)
        diarize_kwargs: dict[str, int] = {}
        if min_speakers is not None:
            diarize_kwargs["min_speakers"] = min_speakers
        if max_speakers is not None:
            diarize_kwargs["max_speakers"] = max_speakers
        diarize_segments = diarize_model(audio, **diarize_kwargs)
        result = whisperx.assign_word_speakers(diarize_segments, result)
        del diarize_model
        if cfg.device == "cuda":
            torch.cuda.empty_cache()
        timings["diarize"] = time.perf_counter() - t0
        logger.info("Diarized in %.2fs", timings["diarize"])

        self._last_timings = timings
        return result.get("segments") or []

    @property
    def last_timings(self) -> dict[str, float]:
        return getattr(self, "_last_timings", {})
