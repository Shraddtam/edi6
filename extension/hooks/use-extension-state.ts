import { useEffect, useState } from "react"
import type { ExtensionMessage, ExtensionState } from "../types"

const emptyState: ExtensionState = {
  paused: false,
  cumulativeScore: 0,
  trackerCount: 0,
  recentEvents: [],
}

export function useExtensionState() {
  const [state, setState] = useState<ExtensionState>(emptyState)

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_STATE" } satisfies ExtensionMessage).then((nextState) => {
      if (nextState) setState(nextState)
    })

    const listener = (message: ExtensionMessage) => {
      if (message.type === "STATE_UPDATED") setState(message.payload)
    }

    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [])

  async function setPaused(paused: boolean) {
    const nextState = await chrome.runtime.sendMessage({ type: "SET_PAUSED", payload: paused } satisfies ExtensionMessage)
    if (nextState) setState(nextState)
  }

  return { state, setPaused }
}
