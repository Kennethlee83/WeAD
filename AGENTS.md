# AGENTS.md

## Cursor Cloud specific instructions

### Overview

WeAD is a Web3 micro-advertising platform with two main components:
1. **Flask backend** (root level) — `python3 bot_simple.py` on port 5000, uses in-memory sample data
2. **Hardhat blockchain project** (`blockchain/`) — Solidity smart contracts for BNB Chain

### Running the Flask backend

```bash
python3 bot_simple.py
```

The app uses **in-memory data** (no PostgreSQL/Redis needed for dev). It starts on `0.0.0.0:5000`.

### Running blockchain tools

```bash
cd blockchain
npm run compile   # Compile contracts
npm test          # Run tests (no test files exist currently)
npm run lint      # Requires a .solhint.json config (not present in repo)
```

### Key gotchas

- `requirements.txt` pins `numpy==1.25.2` and `opencv-python==4.8.1.78` which are incompatible with Python 3.12. Install `numpy` and `opencv-python-headless` without version pins instead.
- `psycopg2-binary==2.9.7` requires `libpq-dev` system package on Ubuntu for Python 3.12 (or install without version pin to get a prebuilt wheel).
- Blockchain `npm install` requires `--legacy-peer-deps` due to peer dependency conflicts in LayerZero packages.
- The `solhint` lint command fails because no `.solhint.json` config exists in `blockchain/`. This is a known repo gap.
- No automated Python tests exist; no blockchain test files exist.
- The Flask app accepts any username/password for login (dev mode) and returns a JWT token.

### API authentication for testing

```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpass"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")
```

Then use `Authorization: Bearer $TOKEN` header for protected endpoints.
