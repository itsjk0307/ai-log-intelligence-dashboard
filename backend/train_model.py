from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline


@dataclass(frozen=True)
class LogSample:
    text: str
    log_level: str
    issue_category: str


DATASET: list[LogSample] = [
    LogSample("[ERROR] Sensor connection failed", "error", "hardware"),
    LogSample("[WARN] Temperature exceeded threshold", "warning", "hardware"),
    LogSample("[INFO] System started successfully", "info", "system"),
    LogSample("Connection lost between device and server", "error", "network"),
    LogSample("Disk usage is critically high", "warning", "system"),
    LogSample("Network latency increased", "warning", "performance"),
    LogSample("CPU usage spikes detected on node", "warning", "performance"),
    LogSample("Kernel panic on boot sequence", "error", "system"),
    LogSample("Packet drops observed in edge router", "warning", "network"),
    LogSample("Database connection timeout occurred", "error", "network"),
    LogSample("Firmware update completed without issues", "info", "hardware"),
    LogSample("Service health check passed", "info", "system"),
    LogSample("Memory leak suspected in worker process", "error", "performance"),
    LogSample("Sensor calibration finished successfully", "info", "hardware"),
    LogSample("Unknown event received from subsystem", "info", "unknown"),
    LogSample("Unable to resolve DNS for backend API", "error", "network"),
    LogSample("Disk IO wait time keeps increasing", "warning", "performance"),
    LogSample("Cooling fan speed dropped unexpectedly", "warning", "hardware"),
    LogSample("Unexpected shutdown triggered by watchdog", "error", "system"),
    LogSample("Periodic maintenance task completed", "info", "system"),
]


def build_pipeline() -> Pipeline:
    return Pipeline(
        steps=[
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True)),
            ("clf", LogisticRegression(max_iter=1000, class_weight="balanced")),
        ]
    )


def train_and_save() -> None:
    texts = [sample.text for sample in DATASET]
    log_levels = [sample.log_level for sample in DATASET]
    issue_categories = [sample.issue_category for sample in DATASET]

    log_level_model = build_pipeline()
    issue_model = build_pipeline()

    log_level_model.fit(texts, log_levels)
    issue_model.fit(texts, issue_categories)

    model_dir = Path(__file__).resolve().parent / "models"
    model_dir.mkdir(parents=True, exist_ok=True)

    joblib.dump(log_level_model, model_dir / "log_level_model.joblib")
    joblib.dump(issue_model, model_dir / "issue_category_model.joblib")

    print("Models trained and saved successfully.")
    print(f"Saved to: {model_dir}")


if __name__ == "__main__":
    train_and_save()
