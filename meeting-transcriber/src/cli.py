from __future__ import annotations

import argparse
import logging
import sys
import time
from pathlib import Path

from .config import load_settings
from .pipeline import MeetingTranscriber
from .postprocessor import (
    export_json,
    export_plaintext,
    export_srt,
    merge_consecutive_speaker_turns,
)


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Transcribe meeting audio with WhisperX and speaker diarization.",
    )
    parser.add_argument(
        "audio_path",
        type=Path,
        help="Input audio file (.wav, .mp3, .m4a, …)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("./output"),
        help="Directory for transcript files (default: ./output)",
    )
    parser.add_argument(
        "--format",
        choices=("json", "txt", "srt", "all"),
        default="all",
        help="Output format(s) to write",
    )
    parser.add_argument("--min-speakers", type=int, default=None)
    parser.add_argument("--max-speakers", type=int, default=None)
    parser.add_argument(
        "--model",
        default=None,
        help="Whisper model id (default: WHISPER_MODEL env or large-v3-turbo)",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Enable debug logging",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)s %(message)s",
    )

    audio_path = args.audio_path.expanduser().resolve()
    if not audio_path.is_file():
        logging.error("Audio file not found: %s", audio_path)
        return 1

    overrides: dict[str, object] = {}
    if args.model:
        overrides["whisper_model"] = args.model

    try:
        settings = load_settings(**overrides)
    except Exception as exc:
        logging.error("Configuration error: %s", exc)
        return 1

    t0 = time.perf_counter()
    transcriber = MeetingTranscriber(settings=settings)
    raw_segments = transcriber.process(
        str(audio_path),
        min_speakers=args.min_speakers,
        max_speakers=args.max_speakers,
    )
    turns = merge_consecutive_speaker_turns(raw_segments)
    total = time.perf_counter() - t0

    out_dir = args.output_dir.expanduser().resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = audio_path.stem

    formats = (
        ("json", "txt", "srt")
        if args.format == "all"
        else (args.format,)
    )
    if "json" in formats:
        (out_dir / f"{stem}.json").write_text(
            export_json(turns),
            encoding="utf-8",
        )
    if "txt" in formats:
        (out_dir / f"{stem}.txt").write_text(
            export_plaintext(turns),
            encoding="utf-8",
        )
    if "srt" in formats:
        (out_dir / f"{stem}.srt").write_text(
            export_srt(turns),
            encoding="utf-8",
        )

    timings = transcriber.last_timings
    logging.info(
        "Done in %.2fs (load %.2fs, transcribe %.2fs, align %.2fs, diarize %.2fs)",
        total,
        timings.get("load_audio", 0.0),
        timings.get("transcribe", 0.0),
        timings.get("align", 0.0),
        timings.get("diarize", 0.0),
    )
    logging.info("Wrote output under %s", out_dir)
    return 0


if __name__ == "__main__":
    sys.exit(main())
