import type { ContentSignals, DomainRiskResult } from "../types"

const defaultBackendOrigin = "http://localhost:3000"

async function getBackendOrigin() {
  const stored = await chrome.storage.sync.get("backendOrigin")
  return (stored.backendOrigin as string | undefined) || defaultBackendOrigin
}

export async function analyzeDomainWithBackend(signals: ContentSignals): Promise<DomainRiskResult> {
  const backendOrigin = await getBackendOrigin()
  const response = await fetch(`${backendOrigin}/api/extension/domain-risk`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      domain: signals.domain,
      signals: {
        trackerCount: signals.trackerCount,
        thirdPartyRequestCount: signals.thirdPartyRequestCount,
        loginFormDetected: signals.loginFormDetected,
        piiFieldCount: signals.piiFieldCount,
        consentBannerDetected: signals.consentBannerDetected,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Domain risk request failed with ${response.status}`)
  }

  const body = (await response.json()) as { domains: DomainRiskResult[] }
  return body.domains[0]
}
