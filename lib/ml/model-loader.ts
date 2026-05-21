import "server-only"

import { readFile } from "fs/promises"
import path from "path"
import type { MlModelMetadata } from "@/lib/ml/types"

const defaultModelDir = path.resolve(process.cwd(), "..", "privacy_debt_models-20260520T150333Z-3-001", "privacy_debt_models")

let metadataPromise: Promise<MlModelMetadata> | null = null

export function getModelDirectory() {
  return process.env.ML_MODELS_DIR || defaultModelDir
}

export function getMlServiceUrl() {
  return process.env.ML_SERVICE_URL || "http://localhost:8001"
}

export async function loadModelMetadata() {
  if (!metadataPromise) {
    metadataPromise = readFile(path.join(getModelDirectory(), "metadata.json"), "utf8").then((contents) =>
      JSON.parse(contents)
    )
  }

  return metadataPromise
}

export async function getMlServiceHealth() {
  const response = await fetch(`${getMlServiceUrl()}/health`, {
    cache: "no-store",
    signal: AbortSignal.timeout(1500),
  })

  if (!response.ok) {
    throw new Error(`ML service health check failed with ${response.status}`)
  }

  return response.json()
}
