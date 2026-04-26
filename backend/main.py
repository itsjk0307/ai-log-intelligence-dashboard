from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline


MODEL_DIR = Path(__file__).resolve().parent / "models"
LOG_LEVEL_MODEL_PATH = MODEL_DIR / "log_level_model.joblib"
ISSUE_CATEGORY_MODEL_PATH = MODEL_DIR / "issue_category_model.joblib"


class AnalyzeLogRequest(BaseModel):
    text: str = Field(..., min_length=3, description="Raw log message to analyze")


class AnalyzeLogResponse(BaseModel):
    log_level: str
    log_level_confidence: float
    issue_category: str
    issue_confidence: float
    keywords: list[str]


def load_pipeline(path: Path) -> Pipeline:
    if not path.exists():
        raise FileNotFoundError(
            f"Model file not found: {path}. Run `python train_model.py` first."
        )
    return joblib.load(path)


def extract_keywords(text: str, model: Pipeline, top_k: int = 5) -> list[str]:
    vectorizer = model.named_steps.get("tfidf")
    if not isinstance(vectorizer, TfidfVectorizer):
        return []

    tfidf_vector = vectorizer.transform([text])
    scores = tfidf_vector.toarray()[0]
    if scores.size == 0:
        return []

    feature_names = vectorizer.get_feature_names_out()
    top_indices = scores.argsort()[::-1]

    keywords: list[str] = []
    for idx in top_indices:
        if scores[idx] <= 0:
            continue
        token = feature_names[idx]
        if " " in token:
            # Prefer concise unigrams for cleaner badges in the UI.
            continue
        keywords.append(token)
        if len(keywords) == top_k:
            break

    return keywords


def predict_with_confidence(text: str, model: Pipeline) -> tuple[str, float]:
    label = model.predict([text])[0]
    probabilities = model.predict_proba([text])[0]
    label_index = list(model.classes_).index(label)
    confidence = float(probabilities[label_index])
    return str(label), round(confidence, 4)


app = FastAPI(
    title="AI System Monitoring Dashboard API",
    description="Classifies log level and issue category for system logs.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LOG_LEVEL_MODEL: Pipeline = load_pipeline(LOG_LEVEL_MODEL_PATH)
ISSUE_CATEGORY_MODEL: Pipeline = load_pipeline(ISSUE_CATEGORY_MODEL_PATH)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze-log", response_model=AnalyzeLogResponse)
def analyze_log(payload: AnalyzeLogRequest) -> dict[str, Any]:
    log_level, log_confidence = predict_with_confidence(payload.text, LOG_LEVEL_MODEL)
    issue_category, issue_confidence = predict_with_confidence(
        payload.text, ISSUE_CATEGORY_MODEL
    )
    keywords = extract_keywords(payload.text, LOG_LEVEL_MODEL)

    return {
        "log_level": log_level,
        "log_level_confidence": log_confidence,
        "issue_category": issue_category,
        "issue_confidence": issue_confidence,
        "keywords": keywords,
    }
