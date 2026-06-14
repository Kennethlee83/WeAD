# Abstract 01 — Image Generation Status

| Item | Value |
|------|-------|
| Total images | 120 |
| **Completed** | **35 / 120** |
| Output dir | `documentary/abstract-01-reality-as-code/images/` |
| Prompt source | `IMAGE-PROMPTS.json` |

## Where to find images

**On this cloud branch** (after `git pull`):

```
documentary/abstract-01-reality-as-code/images/abstract-01-001.png
documentary/abstract-01-reality-as-code/images/abstract-01-002.png
... through abstract-01-120.png (when complete)
```

**On your local PC** (`c:\weaddashboard`): only exists if you `git pull` this branch or copy from cloud. Your earlier 6 local images (001–006) were from a separate session and are not auto-synced.

## Completed frames (35)

`001–012, 015, 031–038, 061–065, 091–098, 100`

## Still generating (85 remaining)

`013–014, 016–030, 039–060, 066–090, 099, 101–120`

## Check count

```bash
ls documentary/abstract-01-reality-as-code/images/*.png | wc -l
```

Windows PowerShell:

```powershell
(Get-ChildItem "documentary\abstract-01-reality-as-code\images\*.png").Count
```
