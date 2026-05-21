import "server-only"

import type { DomainRiskResult, MlRiskLevel } from "@/lib/ml/types"

const suspiciousTlds = new Set(["xyz", "top", "click", "zip", "mov", "work", "rest", "country", "gq", "tk"])
const protectedBrands = ["paypal", "google", "facebook", "instagram", "microsoft", "apple", "amazon", "netflix"]
const trustedExactDomains = new Set([
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
])

function entropy(value: string) {
  const counts = new Map<string, number>()
  for (const char of value) {
    counts.set(char, (counts.get(char) || 0) + 1)
  }

  return Array.from(counts.values()).reduce((total, count) => {
    const probability = count / value.length
    return total - probability * Math.log2(probability)
  }, 0)
}

function normalizeDomain(input: string) {
  return input.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0]
}

function riskLevel(score: number): MlRiskLevel {
  if (score >= 85) return "Critical"
  if (score >= 65) return "High"
  if (score >= 35) return "Medium"
  return "Low"
}

function looksLikeTyposquat(secondLevelDomain: string) {
  const normalized = secondLevelDomain.replace(/[0-9-]/g, "")
  return protectedBrands.some((brand) => {
    if (secondLevelDomain === brand) return false
    if (secondLevelDomain.includes(brand)) return true
    return normalized.replace("1", "l").replace("0", "o").includes(brand)
  })
}

export function analyzeDomainRisk(input: string): DomainRiskResult {
  const domain = normalizeDomain(input)
  const labels = domain.split(".").filter(Boolean)
  const tld = labels.at(-1) || ""
  const secondLevelDomain = labels.length > 1 ? labels[labels.length - 2] : labels[0] || domain
  const digitCount = (domain.match(/\d/g) || []).length
  const hyphenCount = (domain.match(/-/g) || []).length
  const specialChars = (domain.match(/[^a-z0-9.-]/g) || []).length
  const subdomainDepth = Math.max(0, labels.length - 2)
  const sldEntropy = entropy(secondLevelDomain || domain)
  const isLikelyTyposquat = looksLikeTyposquat(secondLevelDomain)
  const isHighRiskTld = suspiciousTlds.has(tld)

  if (trustedExactDomains.has(domain)) {
    return {
      domain,
      risk_score: 15,
      risk_level: "Low",
      red_flags: ["Trusted service; still review account permissions"],
      privacy_debt_impact: 3,
      features: {
        trusted_exact_domain: true,
      },
    }
  }

  const redFlags: string[] = []
  if (isLikelyTyposquat) redFlags.push("Possible typosquatting")
  if (isHighRiskTld) redFlags.push("High-risk TLD")
  if (hyphenCount > 1) redFlags.push("Multiple hyphens")
  if (digitCount / Math.max(domain.length, 1) > 0.15) redFlags.push("High digit ratio")
  if (sldEntropy > 3.5) redFlags.push("High domain entropy")
  if (subdomainDepth > 2) redFlags.push("Excessive subdomains")
  if (specialChars > 0) redFlags.push("Unexpected special characters")

  const riskScore = Math.min(
    100,
    Math.round(
      (isLikelyTyposquat ? 35 : 0) +
        (isHighRiskTld ? 25 : 0) +
        hyphenCount * 5 +
        digitCount * 4 +
        subdomainDepth * 6 +
        specialChars * 10 +
        Math.max(0, sldEntropy - 2.4) * 12
    )
  )

  return {
    domain,
    risk_score: riskScore,
    risk_level: riskLevel(riskScore),
    red_flags: redFlags,
    privacy_debt_impact: Math.round(riskScore * 0.2),
    features: {
      url_length: domain.length,
      hyphen_count: hyphenCount,
      digit_ratio: Number((digitCount / Math.max(domain.length, 1)).toFixed(3)),
      sld_entropy: Number(sldEntropy.toFixed(3)),
      tld_risk: isHighRiskTld ? 1 : 0,
      is_likely_typosquat: isLikelyTyposquat,
      subdomain_depth: subdomainDepth,
      special_chars: specialChars,
      ssl_ok: input.startsWith("https://"),
    },
  }
}
