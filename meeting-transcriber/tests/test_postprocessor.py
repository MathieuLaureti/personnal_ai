import json
import unittest

from src.postprocessor import (
    export_json,
    export_plaintext,
    export_srt,
    merge_consecutive_speaker_turns,
)


class MergeSpeakerTurnsTests(unittest.TestCase):
    def test_merges_same_speaker_within_gap(self) -> None:
        segments = [
            {"speaker": "SPEAKER_01", "start": 0.0, "end": 2.0, "text": "Hello"},
            {"speaker": "SPEAKER_01", "start": 2.5, "end": 4.0, "text": "world"},
        ]
        merged = merge_consecutive_speaker_turns(segments)
        self.assertEqual(len(merged), 1)
        self.assertEqual(merged[0]["text"], "Hello world")
        self.assertEqual(merged[0]["end"], 4.0)

    def test_does_not_merge_when_gap_too_large(self) -> None:
        segments = [
            {"speaker": "SPEAKER_01", "start": 0.0, "end": 1.0, "text": "A"},
            {"speaker": "SPEAKER_01", "start": 3.0, "end": 4.0, "text": "B"},
        ]
        merged = merge_consecutive_speaker_turns(segments)
        self.assertEqual(len(merged), 2)

    def test_does_not_merge_different_speakers(self) -> None:
        segments = [
            {"speaker": "SPEAKER_01", "start": 0.0, "end": 1.0, "text": "Hi"},
            {"speaker": "SPEAKER_02", "start": 1.2, "end": 2.0, "text": "Hey"},
        ]
        merged = merge_consecutive_speaker_turns(segments)
        self.assertEqual(len(merged), 2)


class ExportTests(unittest.TestCase):
    def test_json_roundtrip_shape(self) -> None:
        turns = [
            {"speaker": "SPEAKER_01", "start": 0.0, "end": 4.2, "text": "Test"},
        ]
        data = json.loads(export_json(turns))
        self.assertEqual(data[0]["speaker"], "SPEAKER_01")

    def test_plaintext_format(self) -> None:
        turns = [
            {"speaker": "SPEAKER_01", "start": 65.0, "end": 70.0, "text": "Line"},
        ]
        text = export_plaintext(turns)
        self.assertIn("[01:05] SPEAKER_01: Line", text)

    def test_srt_contains_index_and_timestamps(self) -> None:
        turns = [
            {"speaker": "SPEAKER_01", "start": 1.0, "end": 2.5, "text": "Hi"},
        ]
        srt = export_srt(turns)
        self.assertIn("1\n", srt)
        self.assertIn("-->", srt)
        self.assertIn("SPEAKER_01: Hi", srt)


if __name__ == "__main__":
    unittest.main()
