import { analyzeDomainWithBackend } from "../services/api-client"
import { extractLocalDomainFeatures, normalizeDomain } from "../shared/domain"
import { addEvent, getState, setState } from "../shared/storage"
import type { ContentSignals, DomainRiskResult, ExtensionMessage, PrivacyDebtEvent, RiskLevel } from "../types"

function levelFromScore(score: number): RiskLevel {
  if (score >= 85) return "Critical"
  if (score >= 65) return "High"
  if (score >= 35) return "Medium"
  return "Low"
}

function localRiskFromUrl(url: string): DomainRiskResult {
  const features = extractLocalDomainFeatures(url)
  const score = Math.min(
    100,
    Math.round(
      (features.typosquatCandidate ? 35 : 0) +
        (features.suspiciousKeyword ? 18 : 0) +
        features.hyphenCount * 5 +
        features.digitRatio * 30 +
        Math.max(0, features.entropy - 2.4) * 12
    )
  )

  const redFlags = [
    features.typosquatCandidate ? `Similar to ${features.closestBrand}` : "",
    features.suspiciousKeyword ? "Suspicious login/security keyword or TLD" : "",
    features.hyphenCount > 1 ? "Multiple hyphens" : "",
    features.digitRatio > 0.15 ? "High digit ratio" : "",
  ].filter(Boolean)

  return {
    domain: features.domain,
    risk_score: score,
    risk_level: levelFromScore(score),
    red_flags: redFlags,
    privacy_debt_impact: Math.round(score * 0.2),
    features,
  }
}

async function notifyHighRisk(result: DomainRiskResult) {
  if (result.risk_level !== "High" && result.risk_level !== "Critical") return

  await chrome.notifications.create(`privacy-debt-${Date.now()}`, {
    type: "basic",
    iconUrl: "assets/icon-128.png",
    title: `${result.risk_level} privacy risk`,
    message: `${result.domain}: ${result.red_flags.slice(0, 2).join(", ") || "High privacy debt impact"}`,
  })
}

async function updateBadge(result: DomainRiskResult) {
  const color = result.risk_level === "Critical" || result.risk_level === "High" ? "#c2410c" : result.risk_level === "Medium" ? "#b7791f" : "#168a55"
  await chrome.action.setBadgeBackgroundColor({ color })
  await chrome.action.setBadgeText({ text: String(result.risk_score) })
}

async function processSignals(signals: ContentSignals) {
  const state = await getState()
  if (state.paused) return state

  let result: DomainRiskResult
  try {
    result = await analyzeDomainWithBackend(signals)
  } catch {
    result = localRiskFromUrl(signals.url)
  }

  const event: PrivacyDebtEvent = {
    id: crypto.randomUUID(),
    type: result.risk_score >= 65 ? "domain_visit" : signals.trackerCount > 8 ? "tracker_detected" : "domain_visit",
    domain: result.domain,
    url: signals.url,
    riskScore: result.risk_score,
    riskLevel: result.risk_level,
    impact: Math.max(1, result.privacy_debt_impact),
    redFlags: result.red_flags,
    createdAt: Date.now(),
  }

  const nextState = await addEvent(event)
  await setState({ ...nextState, currentRisk: result, trackerCount: signals.trackerCount })
  await updateBadge(result)
  await notifyHighRisk(result)
  chrome.runtime.sendMessage({ type: "STATE_UPDATED", payload: await getState() }).catch(() => undefined)
  return getState()
}

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
})

chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url || !tab.url.startsWith("http")) return
  const domain = normalizeDomain(tab.url)
  await processSignals({
    url: tab.url,
    domain,
    loginFormDetected: false,
    piiFieldCount: 0,
    consentBannerDetected: false,
    trackerCount: 0,
    thirdPartyRequestCount: 0,
  })
})

chrome.downloads.onCreated.addListener(async (download) => {
  if (!download.finalUrl && !download.url) return
  const url = download.finalUrl || download.url
  const result = localRiskFromUrl(url)
  const riskyExtension = /\.(exe|msi|bat|cmd|scr|ps1|js|jar)$/i.test(download.filename || url)
  if (riskyExtension || result.risk_score >= 45) {
    await notifyHighRisk({
      ...result,
      risk_score: Math.max(result.risk_score, 70),
      risk_level: "High",
      red_flags: [...result.red_flags, "Risky or executable download"],
    })
  }
})

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === "CONTENT_SIGNALS") {
    processSignals(message.payload).then(sendResponse)
    return true
  }

  if (message.type === "GET_STATE") {
    getState().then(sendResponse)
    return true
  }

  if (message.type === "SET_PAUSED") {
    getState().then((state) => setState({ ...state, paused: message.payload }).then(sendResponse))
    return true
  }

  return false
})
