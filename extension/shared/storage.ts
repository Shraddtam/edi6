import type { ExtensionState, PrivacyDebtEvent } from "../types"

const stateKey = "privacyDebtState"
const defaultState: ExtensionState = {
  paused: false,
  cumulativeScore: 0,
  trackerCount: 0,
  recentEvents: [],
}

export async function getState(): Promise<ExtensionState> {
  const result = await chrome.storage.local.get(stateKey)
  return { ...defaultState, ...(result[stateKey] as Partial<ExtensionState> | undefined) }
}

export async function setState(nextState: ExtensionState) {
  await chrome.storage.local.set({ [stateKey]: nextState })
  return nextState
}

export async function addEvent(event: PrivacyDebtEvent) {
  const state = await getState()
  const recentEvents = [event, ...state.recentEvents].slice(0, 50)
  const cumulativeScore = Math.min(100, Math.round(recentEvents.reduce((total, item) => total + item.impact, 0)))
  return setState({
    ...state,
    currentDomain: event.domain,
    cumulativeScore,
    recentEvents,
    lastUpdated: Date.now(),
  })
}
