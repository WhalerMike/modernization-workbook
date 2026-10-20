"""Turn the deck's speaker notes into per-slide narration audio (edge-tts neural voice).

Writes, next to the deck:
  narration/slideNN.mp3       one clip per slide
  narration/durations.json    seconds per clip
  HR_Authoritative_Identity_Narration_Script.md   the clean spoken script (practice copy)
"""
import asyncio
import json
import re
import sys
from pathlib import Path

import edge_tts
from mutagen.mp3 import MP3
from pptx import Presentation

DECK = Path(sys.argv[1])
OUT = DECK.parent / f"narration_{DECK.stem}"
OUT.mkdir(exist_ok=True)
VOICE = "en-US-AndrewNeural"
RATE = "+0%"

# Spoken-form fixes (applied only to the audio text, not the practice script).
PHON = [
    (r"\bPIN\b", "pin"), (r"\bSASE\b", "sassy"), (r"\bICAM\b", "eye-cam"), (r"\bPIV\b", "piv"), (r"\bHRIT\b", "H R I T"),
    (r"\bSCIM\b", "skim"), (r"\bSIEM\b", "sim"), (r"\bPIM\b", "pim"), (r"\bSCuBA\b", "scuba"),
    (r"\bConMon\b", "con-mon"), (r"\bDITM\b", "D I T M"), (r"\bCOR\b", "C O R"), (r"\bSF-50\b", "S F fifty"),
    (r"\bM-22-09\b", "M twenty-two oh-nine"), (r"\bM-19-17\b", "M nineteen seventeen"), (r"\bM-19-26\b", "M nineteen twenty-six"),
    (r"\bSP 800-207\b", "special publication eight hundred two-oh-seven"), (r"\b800-207\b", "eight hundred two-oh-seven"),
    (r"\bAC-2\b", "A C two"), (r"\bPS-4\b", "P S four"), (r"\bPS-5\b", "P S five"), (r"\bIA-4\b", "I A four"), (r"\bSI-12\b", "S I twelve"),
    (r"\bTIC 3\.0\b", "tick three point oh"), (r"\bBOD 25-01\b", "B O D twenty-five oh-one"), (r"\bFedRAMP 20x\b", "fed-ramp twenty X"),
    (r"\bOMB/OPM\b", "O M B and O P M"), (r"\bHCM\b", "H C M"), (r"\bEHRI\b", "E H R I"), (r"\beOPF\b", "E O P F"),
    (r"\bIAL\b", "I A L"), (r"\bAAL\b", "A A L"), (r"\bAD\b", "A D"), (r"\bDDI\b", "D D I"), (r"\bGPO\b", "G P O"),
    (r"\bSOA\b", "S O A"), (r"\bPIA\b", "P I A"), (r"\bSORNs\b", "sorns"), (r"\bSORN\b", "sorn"), (r"\bNOA\b", "N O A"),
    (r"\b100 series\b", "one hundred series"), (r"\b200 series\b", "two hundred series"), (r"\b300 series\b", "three hundred series"),
    (r"\b400 series\b", "four hundred series"), (r"\b500 series\b", "five hundred series"), (r"\b700 series\b", "seven hundred series"),
    (r"—", ", "),
]


def clean(notes: str) -> str:
    t = re.sub(r"^\[[^\]]*\]\s*", "", notes.strip())          # timing cue
    t = t.split("\n\nWorkbook:")[0]                             # workbook reference
    t = re.sub(r"\n?\[[^\]]*\]\s*$", "", t.strip())             # trailing [Stop by 15:00.]
    t = re.sub(r"\n\([^)]*\)\s*$", "", t.strip())                # trailing (Verify ...)
    t = re.sub(r"\s*\((Confirm|Verify)[^)]*\)", "", t)          # inline (Confirm ...)
    return t.strip()


def spoken(text: str) -> str:
    for pat, rep in PHON:
        text = re.sub(pat, rep, text)
    return text


async def main():
    prs = Presentation(DECK)
    script, durations = ["# HR-Driven Identity — narration script (practice copy)\n"], {}
    for i, slide in enumerate(prs.slides, 1):
        title = next((sh.text_frame.text for sh in slide.shapes if sh.is_placeholder and sh.placeholder_format.idx == 0 and sh.has_text_frame), None)             or next((sh.text_frame.text for sh in slide.shapes if sh.has_text_frame and sh.text_frame.text.strip()), f"Slide {i}")
        if title.strip() == "Backup":  # executive cut: the backup section is not narrated
            break
        notes = slide.notes_slide.notes_text_frame.text if slide.has_notes_slide else ""
        text = clean(notes)
        if title.startswith("More modernizations"):  # teaser: drop the stage direction
            text = re.sub(r"^Leave up during questions.*?\n", "", text).strip()
        script.append(f"\n## Slide {i} — {title}\n\n{text}\n")
        mp3 = OUT / f"slide{i:02d}.mp3"
        if not (mp3.exists() and mp3.stat().st_size > 10000):
            for attempt in range(5):
                try:
                    await edge_tts.Communicate(spoken(text), VOICE, rate=RATE).save(str(mp3))
                    secs = MP3(mp3).info.length
                    if secs < 0.2 * len(text.split()):  # truncated stream (normal ~0.3-0.43 s/word; truncations ~0.1)
                        raise RuntimeError(f"truncated: {secs:.1f}s for {len(text.split())} words")
                    break
                except Exception as e:
                    print(f"  slide {i} attempt {attempt + 1} failed: {e}; retrying")
                    await asyncio.sleep(5 * (attempt + 1))
            else:
                raise SystemExit(f"slide {i}: no audio after retries")
        durations[i] = round(MP3(mp3).info.length, 2)
        print(f"slide {i:2d}: {durations[i]:6.1f}s  {title[:60]}")
    (OUT / "durations.json").write_text(json.dumps(durations, indent=1), encoding="utf-8")
    (DECK.parent / f"{DECK.stem}_Narration_Script.md").write_text("".join(script), encoding="utf-8")
    last = max(durations)
    total = sum(v for k, v in durations.items() if k != last)
    print(f"total (without teaser): {total/60:.1f} min; with teaser: {sum(durations.values())/60:.1f} min")

asyncio.run(main())
