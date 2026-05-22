import { AlertTriangle, Pause, Play, ShieldCheck } from "lucide-react"
import { useExtensionState } from "../hooks/use-extension-state"

function riskColor(score: number) {
  if (score >= 65) return "text-risk-high"
  if (score >= 35) return "text-risk-medium"
  return "text-risk-low"
}

export function PopupApp() {
  const { state, setPaused } = useExtensionState()
  const risk = state.currentRisk

  return (
    <main className="w-[380px] space-y-4 p-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold">Privacy Debt</h1>
          <p className="text-xs text-muted">Browser-assisted risk intelligence</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs"
          onClick={() => setPaused(!state.paused)}
        >
          {state.paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          {state.paused ? "Resume" : "Pause"}
        </button>
      </header>

      <section className="rounded-lg border border-border bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Cumulative score</span>
          <span className={`text-2xl font-bold ${riskColor(state.cumulativeScore)}`}>{state.cumulativeScore}%</span>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          {risk && risk.risk_score >= 65 ? (
            <AlertTriangle className="h-4 w-4 text-risk-high" />
          ) : (
            <ShieldCheck className="h-4 w-4 text-risk-low" />
          )}
          <h2 className="text-sm font-semibold">Current site</h2>
        </div>
        <div className="truncate text-sm font-medium">{risk?.domain || state.currentDomain || "No active analysis"}</div>
        <p className="mt-1 text-xs text-muted">
          {risk ? `${risk.risk_level} risk, ${risk.privacy_debt_impact}% debt impact` : "Open a website to start monitoring."}
        </p>
        {risk?.red_flags?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {risk.red_flags.slice(0, 3).map((flag) => (
              <span key={flag} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-muted">
                {flag}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <button
        className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        onClick={() => chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT })}
      >
        Open side panel
      </button>
    </main>
  )
}
