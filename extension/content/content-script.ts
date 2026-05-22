import { normalizeDomain } from "../shared/domain"
import type { ContentSignals, ExtensionMessage } from "../types"

const trackerPatterns = [
  "google-analytics.com",
  "googletagmanager.com",
  "doubleclick.net",
  "facebook.net",
  "hotjar.com",
  "segment.io",
  "mixpanel.com",
  "clarity.ms",
  "adsystem.com",
]

function isThirdParty(resourceUrl: string) {
  try {
    return new URL(resourceUrl).hostname !== window.location.hostname
  } catch {
    return false
  }
}

function detectLoginForm() {
  return Boolean(document.querySelector('input[type="password"], form[action*="login" i], form[id*="login" i]'))
}

function detectPiiFields() {
  const selectors = [
    'input[type="email"]',
    'input[name*="phone" i]',
    'input[name*="address" i]',
    'input[name*="dob" i]',
    'input[name*="aadhaar" i]',
    'input[name*="pan" i]',
    'input[name*="card" i]',
  ]
  return selectors.reduce((total, selector) => total + document.querySelectorAll(selector).length, 0)
}

function detectConsentBanner() {
  const text = document.body.innerText.slice(0, 6000).toLowerCase()
  return text.includes("accept cookies") || text.includes("cookie consent") || text.includes("privacy preferences")
}

function inspectResources() {
  const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[]
  const thirdParty = resources.filter((resource) => isThirdParty(resource.name))
  const trackers = thirdParty.filter((resource) => trackerPatterns.some((pattern) => resource.name.includes(pattern)))
  return {
    trackerCount: trackers.length,
    thirdPartyRequestCount: thirdParty.length,
  }
}

function collectSignals(): ContentSignals {
  const resourceSignals = inspectResources()
  return {
    url: window.location.href,
    domain: normalizeDomain(window.location.href),
    loginFormDetected: detectLoginForm(),
    piiFieldCount: detectPiiFields(),
    consentBannerDetected: detectConsentBanner(),
    trackerCount: resourceSignals.trackerCount,
    thirdPartyRequestCount: resourceSignals.thirdPartyRequestCount,
  }
}

function sendSignals() {
  const message: ExtensionMessage = {
    type: "CONTENT_SIGNALS",
    payload: collectSignals(),
  }
  chrome.runtime.sendMessage(message).catch(() => undefined)
}

sendSignals()
setTimeout(sendSignals, 2500)
