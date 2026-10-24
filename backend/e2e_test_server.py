from __future__ import annotations

import os
import tempfile
from pathlib import Path

os.environ["DEMO_MODE"] = "true"

with tempfile.TemporaryDirectory(prefix="ralypto-e2e-") as data_dir:
    database_path = Path(data_dir, "ralypto.sqlite").as_posix()
    os.environ["DATABASE_URL"] = f"sqlite:///{database_path}"

    from app.main import app, engine

    try:
        import uvicorn

        uvicorn.run(app, host="127.0.0.1", port=4000, log_level="warning")
    finally:
        engine.dispose()
