import { Activity, AlertTriangle, Eye, Globe2, ShieldAlert } from "lucide-react"
import { useExtensionState } from "../hooks/use-extension-state"

export function SidePanelApp() {
  const { state, setPaused } = useExtensionState()
  const current = state.currentRisk

  return (
    <main className="min-h-screen space-y-4 p-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Privacy Debt Intelligence</h1>
          <p className="text-xs text-muted">Live browser risk, domain signals, trackers, and debt impact.</p>
        </div>
        <button className="rounded-md border border-border px-3 py-2 text-xs" onClick={() => setPaused(!state.paused)}>
          {state.paused ? "Resume" : "Pause"}
        </button>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-white p-4">
          <Activity className="mb-2 h-4 w-4 text-slate-700" />
          <div className="text-xs text-muted">Cumulative debt</div>
          <div className="text-2xl font-bold">{state.cumulativeScore}%</div>
        </div>
        <div className="rounded-lg border border-border bg-white p-4">
          <Eye className="mb-2 h-4 w-4 text-slate-700" />
          <div className="text-xs text-muted">Trackers observed</div>
          <div className="text-2xl font-bold">{state.trackerCount}</div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Globe2 className="h-4 w-4 text-slate-700" />
          <h2 className="text-sm font-semibold">Current Site Analysis</h2>
        </div>
        <div className="truncate text-sm font-medium">{current?.domain || "No current site"}</div>
        <p className="mt-1 text-xs text-muted">
          {current ? `${current.risk_level} risk, ${current.risk_score}% risk score, ${current.privacy_debt_impact}% debt impact` : "Analysis appears here after navigation."}
        </p>
        {current?.red_flags?.length ? (
          <div className="mt-3 space-y-2">
            {current.red_flags.map((flag) => (
              <div key={flag} className="flex items-center gap-2 rounded-md bg-slate-100 px-2 py-2 text-xs text-muted">
                <ShieldAlert className="h-3.5 w-3.5 text-risk-high" />
                {flag}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-border bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-risk-medium" />
          <h2 className="text-sm font-semibold">Recent Risk Events</h2>
        </div>
        <div className="space-y-2">
          {state.recentEvents.slice(0, 8).map((event) => (
            <div key={event.id} className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium">{event.domain}</span>
                <span className="text-xs text-muted">{event.impact}% impact</span>
              </div>
              <p className="mt-1 text-xs text-muted">{event.redFlags[0] || event.type.replaceAll("_", " ")}</p>
            </div>
          ))}
          {state.recentEvents.length === 0 ? (
            <p className="text-sm text-muted">No risk events captured yet.</p>
          ) : null}
        </div>
      </section>
    </main>
  )
}
