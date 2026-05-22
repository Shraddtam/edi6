import { NextRequest, NextResponse } from "next/server"
import { requireCurrentUser } from "@/lib/authorization"
import { analyzeDomainRisk } from "@/lib/ml/domain-risk"
import { logger } from "@/lib/logger"

type ExtensionDomainRiskRequest = {
  domain?: string
  domains?: string[]
  signals?: {
    trackerCount?: number
    thirdPartyRequestCount?: number
    loginFormDetected?: boolean
    piiFieldCount?: number
    consentBannerDetected?: boolean
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCurrentUser()
  if (!auth.ok) {
    return auth.response
  }

  const body = (await request.json()) as ExtensionDomainRiskRequest
  const requestedDomains = [
    ...(body.domain ? [body.domain] : []),
    ...(Array.isArray(body.domains) ? body.domains : []),
  ]
    .map((domain) => domain.trim())
    .filter(Boolean)
    .slice(0, 25)

  if (requestedDomains.length === 0) {
    return NextResponse.json({ error: "At least one domain is required" }, { status: 400 })
  }

  const trackerImpact = Math.min(15, Math.round((body.signals?.trackerCount || 0) * 0.8))
  const formImpact = body.signals?.loginFormDetected ? 5 : 0
  const piiImpact = Math.min(10, (body.signals?.piiFieldCount || 0) * 2)

  const domains = requestedDomains.map((domain) => {
    const result = analyzeDomainRisk(domain)
    const signalImpact = trackerImpact + formImpact + piiImpact
    const adjustedRiskScore = Math.min(100, result.risk_score + signalImpact)

    return {
      ...result,
      risk_score: adjustedRiskScore,
      privacy_debt_impact: Math.min(25, result.privacy_debt_impact + Math.round(signalImpact * 0.4)),
      extension_signals: {
        tracker_impact: trackerImpact,
        login_form_impact: formImpact,
        pii_field_impact: piiImpact,
        third_party_request_count: body.signals?.thirdPartyRequestCount || 0,
        consent_banner_detected: Boolean(body.signals?.consentBannerDetected),
      },
    }
  })

  logger.info("extension.domain_risk.completed", {
    userId: auth.user.id,
    domains: domains.map((domain) => `${domain.domain}:${domain.risk_score}`).join(","),
  })

  return NextResponse.json({
    source: "privacy_debt_backend",
    domains,
  })
}
