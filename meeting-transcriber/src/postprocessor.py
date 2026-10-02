from __future__ import annotations

import json
from typing import Any

MERGE_GAP_SECONDS = 1.5


def _segment_text(segment: dict[str, Any]) -> str:
    text = segment.get("text") or ""
    return str(text).strip()


def merge_consecutive_speaker_turns(
    segments: list[dict[str, Any]],
    max_gap_seconds: float = MERGE_GAP_SECONDS,
) -> list[dict[str, Any]]:
    if not segments:
        return []

    merged: list[dict[str, Any]] = []
    for seg in segments:
        speaker = seg.get("speaker") or "UNKNOWN"
        start = float(seg.get("start", 0.0))
        end = float(seg.get("end", start))
        text = _segment_text(seg)
        if not text:
            continue

        if (
            merged
            and merged[-1].get("speaker") == speaker
            and start - float(merged[-1]["end"]) <= max_gap_seconds
        ):
            merged[-1]["end"] = end
            merged[-1]["text"] = f"{merged[-1]['text']} {text}".strip()
        else:
            merged.append(
                {
                    "speaker": speaker,
                    "start": start,
                    "end": end,
                    "text": text,
                }
            )
    return merged


def format_timestamp_mmss(seconds: float) -> str:
    total = max(0, int(seconds))
    minutes, secs = divmod(total, 60)
    return f"{minutes:02d}:{secs:02d}"


def format_timestamp_srt(seconds: float) -> str:
    total_ms = max(0, int(round(seconds * 1000)))
    hours, rem = divmod(total_ms, 3_600_000)
    minutes, rem = divmod(rem, 60_000)
    secs, ms = divmod(rem, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{ms:03d}"


def export_json(turns: list[dict[str, Any]]) -> str:
    return json.dumps(turns, indent=2, ensure_ascii=False) + "\n"


def export_plaintext(turns: list[dict[str, Any]], markdown: bool = False) -> str:
    lines: list[str] = []
    for turn in turns:
        stamp = format_timestamp_mmss(float(turn["start"]))
        line = f"[{stamp}] {turn['speaker']}: {turn['text']}"
        lines.append(line)
    body = "\n".join(lines)
    if markdown:
        return body + "\n"
    return body + "\n"


def export_srt(turns: list[dict[str, Any]]) -> str:
    blocks: list[str] = []
    for index, turn in enumerate(turns, start=1):
        start = format_timestamp_srt(float(turn["start"]))
        end = format_timestamp_srt(float(turn["end"]))
        text = f"{turn['speaker']}: {turn['text']}"
        blocks.append(f"{index}\n{start} --> {end}\n{text}\n")
    return "\n".join(blocks)
