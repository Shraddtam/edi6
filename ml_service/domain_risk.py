from __future__ import annotations

from collections import Counter
from math import log2
import csv
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict

SUSPICIOUS_TLDS = {"xyz", "top", "click", "zip", "mov", "work", "rest", "country", "gq", "tk"}
PROTECTED_BRANDS = ["paypal", "google", "facebook", "instagram", "microsoft", "apple", "amazon", "netflix"]
DATASET_PATH = Path(__file__).resolve().parents[2] / "privacy_domain_risk_dataset.csv"
TRUSTED_EXACT_DOMAINS = {
    "facebook.com",
    "instagram.com",
    "google.com",
    "gmail.com",
    "amazon.com",
    "microsoft.com",
    "apple.com",
    "linkedin.com",
    "x.com",
    "whatsapp.com",
    "spotify.com",
    "canva.com",
    "paypal.com",
}


@lru_cache(maxsize=1)
def load_domain_dataset() -> dict[str, dict[str, str]]:
    if not DATASET_PATH.exists():
        return {}

    with open(DATASET_PATH, "r", encoding="utf-8", newline="") as file:
        return {row["domain"].lower(): row for row in csv.DictReader(file)}


def entropy(value: str) -> float:
    if not value:
        return 0

    counts = Counter(value)
    return -sum((count / len(value)) * log2(count / len(value)) for count in counts.values())


def normalize_domain(value: str) -> str:
    return value.strip().lower().removeprefix("https://").removeprefix("http://").split("/")[0]


def risk_level(score: int) -> str:
    if score >= 85:
        return "Critical"
    if score >= 65:
        return "High"
    if score >= 35:
        return "Medium"
    return "Low"


def looks_like_typosquat(second_level_domain: str) -> bool:
    normalized = second_level_domain.replace("-", "").replace("1", "l").replace("0", "o")
    return any(second_level_domain != brand and brand in normalized for brand in PROTECTED_BRANDS)


def analyze_domain(domain_input: str) -> Dict[str, Any]:
    domain = normalize_domain(domain_input)
    if domain in TRUSTED_EXACT_DOMAINS:
        return {
            "domain": domain,
            "risk_score": 15,
            "risk_level": "Low",
            "red_flags": ["Trusted service; still review account permissions"],
            "privacy_debt_impact": 3,
            "features": {
                "source": "trusted_exact_domain",
                "trusted_exact_domain": True,
            },
        }

    dataset_match = load_domain_dataset().get(domain)
    if dataset_match:
        score = int(float(dataset_match.get("risk_score", 0) or 0))
        red_flags = []
        if dataset_match.get("suspicious_patterns") and dataset_match["suspicious_patterns"] != "none":
            red_flags.append(dataset_match["suspicious_patterns"])
        if dataset_match.get("breach_history") and dataset_match["breach_history"] not in {"no", "none"}:
            red_flags.append(f"Breach history: {dataset_match['breach_history']}")
        if int(float(dataset_match.get("phishing_reports", 0) or 0)) > 50:
            red_flags.append("Elevated phishing reports")
        if dataset_match.get("ssl_status") not in {"valid", ""}:
            red_flags.append(f"SSL status: {dataset_match['ssl_status']}")

        return {
            "domain": domain,
            "risk_score": score,
            "risk_level": risk_level(score),
            "red_flags": red_flags,
            "privacy_debt_impact": round(score * 0.2),
            "features": {
                "dataset_match": True,
                "category": dataset_match.get("category", ""),
                "phishing_reports": int(float(dataset_match.get("phishing_reports", 0) or 0)),
                "malware_reports": int(float(dataset_match.get("malware_reports", 0) or 0)),
                "registrar_reputation": dataset_match.get("registrar_reputation", ""),
                "ssl_status": dataset_match.get("ssl_status", ""),
            },
        }

    labels = [part for part in domain.split(".") if part]
    tld = labels[-1] if labels else ""
    second_level_domain = labels[-2] if len(labels) > 1 else labels[0] if labels else domain

    digit_count = sum(char.isdigit() for char in domain)
    hyphen_count = domain.count("-")
    special_chars = sum(not (char.isalnum() or char in ".-") for char in domain)
    subdomain_depth = max(0, len(labels) - 2)
    sld_entropy = entropy(second_level_domain)
    is_typosquat = looks_like_typosquat(second_level_domain)
    is_high_risk_tld = tld in SUSPICIOUS_TLDS

    red_flags = []
    if is_typosquat:
        red_flags.append("Possible typosquatting")
    if is_high_risk_tld:
        red_flags.append("High-risk TLD")
    if hyphen_count > 1:
        red_flags.append("Multiple hyphens")
    if digit_count / max(len(domain), 1) > 0.15:
        red_flags.append("High digit ratio")
    if sld_entropy > 3.5:
        red_flags.append("High domain entropy")
    if subdomain_depth > 2:
        red_flags.append("Excessive subdomains")
    if special_chars > 0:
        red_flags.append("Unexpected special characters")

    risk_score = min(
        100,
        round(
            (35 if is_typosquat else 0)
            + (25 if is_high_risk_tld else 0)
            + hyphen_count * 5
            + digit_count * 4
            + subdomain_depth * 6
            + special_chars * 10
            + max(0, sld_entropy - 2.4) * 12
        ),
    )

    return {
        "domain": domain,
        "risk_score": risk_score,
        "risk_level": risk_level(risk_score),
        "red_flags": red_flags,
        "privacy_debt_impact": round(risk_score * 0.2),
        "features": {
            "url_length": len(domain),
            "hyphen_count": hyphen_count,
            "digit_ratio": round(digit_count / max(len(domain), 1), 3),
            "sld_entropy": round(sld_entropy, 3),
            "tld_risk": 1 if is_high_risk_tld else 0,
            "is_likely_typosquat": is_typosquat,
            "subdomain_depth": subdomain_depth,
            "special_chars": special_chars,
            "ssl_ok": domain_input.startswith("https://"),
        },
    }
