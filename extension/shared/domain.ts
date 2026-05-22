import type { LocalDomainFeatures } from "../types"

const suspiciousKeywords = ["login", "verify", "auth", "secure", "account", "wallet", "update", "support"]
const suspiciousTlds = new Set(["xyz", "top", "click", "zip", "mov", "work", "rest", "country", "gq", "tk"])
const protectedBrands = ["paypal", "google", "facebook", "instagram", "microsoft", "apple", "amazon", "netflix"]

export function normalizeDomain(input: string) {
  try {
    const url = input.startsWith("http") ? new URL(input) : new URL(`https://${input}`)
    return url.hostname.toLowerCase().replace(/^www\./, "")
  } catch {
    return input.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "")
  }
}

export function levenshtein(a: string, b: string) {
  const matrix = Array.from({ length: a.length + 1 }, (_, row) => [row])
  for (let column = 1; column <= b.length; column += 1) matrix[0][column] = column

  for (let row = 1; row <= a.length; row += 1) {
    for (let column = 1; column <= b.length; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost
      )
    }
  }

  return matrix[a.length][b.length]
}

function entropy(value: string) {
  const counts = new Map<string, number>()
  for (const char of value) counts.set(char, (counts.get(char) || 0) + 1)
  return Array.from(counts.values()).reduce((total, count) => {
    const probability = count / Math.max(value.length, 1)
    return total - probability * Math.log2(probability)
  }, 0)
}

export function extractLocalDomainFeatures(input: string): LocalDomainFeatures {
  const domain = normalizeDomain(input)
  const labels = domain.split(".").filter(Boolean)
  const tld = labels.at(-1) || ""
  const secondLevelDomain = labels.length > 1 ? labels[labels.length - 2] : labels[0] || domain
  const deobfuscated = secondLevelDomain.replace(/0/g, "o").replace(/1/g, "l").replace(/-/g, "")
  const brandDistances = protectedBrands.map((brand) => ({
    brand,
    distance: Math.min(levenshtein(secondLevelDomain, brand), levenshtein(deobfuscated, brand)),
  }))
  const closest = brandDistances.sort((a, b) => a.distance - b.distance)[0]
  const suspiciousKeyword = suspiciousKeywords.some((keyword) => secondLevelDomain.includes(keyword))
  const typosquatCandidate =
    secondLevelDomain !== closest.brand &&
    (closest.distance <= 2 || protectedBrands.some((brand) => deobfuscated.includes(brand)))

  return {
    domain,
    tld,
    urlLength: domain.length,
    hyphenCount: (domain.match(/-/g) || []).length,
    digitRatio: (domain.match(/\d/g) || []).length / Math.max(domain.length, 1),
    entropy: entropy(secondLevelDomain),
    subdomainDepth: Math.max(0, labels.length - 2),
    suspiciousKeyword: suspiciousKeyword || suspiciousTlds.has(tld),
    typosquatCandidate,
    closestBrand: closest.brand,
    levenshteinDistance: closest.distance,
  }
}
