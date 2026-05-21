from __future__ import annotations

from typing import Any, Dict


PASSWORD_REUSE_RISK = {"never": 0, "sometimes": 2, "often": 5, "always": 8}
PASSWORD_STRENGTH_SCORE = {"weak": 25, "medium": 55, "strong": 80, "manager": 95}
TWO_FACTOR_SCORE = {"none": 0, "some": 40, "most": 75, "all": 100}
PROFILE_VISIBILITY_RISK = {"private": 10, "friends": 45, "public": 85}
SHARING_FREQUENCY_RISK = {"rarely": 10, "occasionally": 35, "often": 65, "very-often": 90}
COOKIE_RISK = {"reject": 10, "sometimes": 45, "accept": 80}
UNKNOWN_SITE_RISK = {"rare": 10, "occasional": 45, "frequent": 85}


def clamp(value: float, minimum: float = 0, maximum: float = 100) -> float:
    return max(minimum, min(maximum, value))


def build_privacy_features(form_data: Dict[str, Any], feature_order: list[str]) -> Dict[str, float]:
    password_reuse = form_data.get("passwordReuse", "sometimes")
    password_strength = form_data.get("passwordStrength", "medium")
    two_factor = form_data.get("twoFactorAuth", "some")
    profile_visibility = form_data.get("profileVisibility", "friends")
    sharing_frequency = form_data.get("sharingFrequency", "occasionally")
    cookie_consent = form_data.get("cookieConsent", "sometimes")
    unknown_site_frequency = form_data.get("unknownSiteFrequency", "occasional")
    unknown_downloads = form_data.get("unknownDownloads", "sometimes")
    ad_tracking = form_data.get("adTracking", "limited")

    online_accounts = float(form_data.get("onlineAccounts", 0) or 0)
    inactive_accounts = float(form_data.get("inactiveAccounts", 0) or 0)
    connected_apps = float(form_data.get("connectedApps", 0) or 0)
    shared_data_types = form_data.get("sharedDataTypes", []) or []
    login_methods = form_data.get("loginMethods", []) or []
    additional_notes = form_data.get("additionalNotes", "") or ""

    risky_domains_visited = UNKNOWN_SITE_RISK.get(unknown_site_frequency, 45) / 10
    risky_domains_visited += 4 if unknown_downloads == "often" else 2 if unknown_downloads == "sometimes" else 0

    protection_score = clamp(
        TWO_FACTOR_SCORE.get(two_factor, 40) * 0.45
        + PASSWORD_STRENGTH_SCORE.get(password_strength, 55) * 0.35
        + (20 if ad_tracking == "disabled" else 10 if ad_tracking == "limited" else 0)
    )

    exposure_index = clamp(
        online_accounts * 1.2
        + inactive_accounts * 2.5
        + connected_apps * 1.8
        + len(shared_data_types) * 4
        + PROFILE_VISIBILITY_RISK.get(profile_visibility, 45) * 0.35
    )

    risk_burden = clamp(
        exposure_index * 0.45
        + PASSWORD_REUSE_RISK.get(password_reuse, 2) * 6
        + SHARING_FREQUENCY_RISK.get(sharing_frequency, 35) * 0.25
        + COOKIE_RISK.get(cookie_consent, 45) * 0.15
    )

    privacy_awareness = (
        2
        if len(additional_notes) > 80 or two_factor == "all"
        else 1
        if two_factor == "most" or password_strength == "manager"
        else 0
    )

    features = {
        "privacy_awareness": privacy_awareness,
        "password_reuse_count": PASSWORD_REUSE_RISK.get(password_reuse, 2),
        "risky_domains_visited": risky_domains_visited,
        "third_party_apps": connected_apps,
        "inactive_accounts": inactive_accounts,
        "breached_accounts": 0,
        "tracker_acceptance_rate": COOKIE_RISK.get(cookie_consent, 45) / 100,
        "avg_password_strength": PASSWORD_STRENGTH_SCORE.get(password_strength, 55),
        "public_profile_score": PROFILE_VISIBILITY_RISK.get(profile_visibility, 45),
        "pii_shared_frequency": SHARING_FREQUENCY_RISK.get(sharing_frequency, 35),
        "vpn_usage": 1 if any("vpn" in str(method).lower() for method in login_methods) else 0,
        "mfa_enabled": TWO_FACTOR_SCORE.get(two_factor, 40) / 100,
        "browser_security_score": clamp(100 - UNKNOWN_SITE_RISK.get(unknown_site_frequency, 45)),
        "account_age_days": 365,
        "risk_burden": risk_burden,
        "protection_score": protection_score,
        "exposure_index": exposure_index,
        "awareness_adjusted_risk": clamp(risk_burden - privacy_awareness * 8),
    }

    return {feature: float(features.get(feature, 0)) for feature in feature_order}
