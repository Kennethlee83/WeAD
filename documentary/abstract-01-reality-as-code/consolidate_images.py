#!/usr/bin/env python3
"""Copy generated images from Cursor artifacts into project images folder."""
import json
import shutil
from pathlib import Path

ARTIFACTS = Path("/opt/cursor/artifacts/assets")
DEST = Path("/workspace/documentary/abstract-01-reality-as-code/images")
PROMPTS = Path("/workspace/documentary/abstract-01-reality-as-code/IMAGE-PROMPTS.json")

def missing_ids():
    present = {p.stem.replace("abstract-01-", "") for p in DEST.glob("abstract-01-*.png")}
    return [f"{i:03d}" for i in range(1, 121) if f"{i:03d}" not in present]

def consolidate():
  copied = []
  for mid in missing_ids():
    src = ARTIFACTS / f"abstract-01-{mid}.png"
    dst = DEST / f"abstract-01-{mid}.png"
    if src.exists() and not dst.exists():
      shutil.copy2(src, dst)
      copied.append(mid)
  return copied

if __name__ == "__main__":
  missing = missing_ids()
  copied = consolidate()
  present = 120 - len(missing_ids())
  print(f"Present: {present}/120")
  print(f"Missing: {len(missing_ids())}")
  if copied:
    print(f"Copied: {', '.join(copied)}")
