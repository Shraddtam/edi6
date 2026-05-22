"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Shield, LogOut, RefreshCw, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { AnalysisResult } from "@/lib/types"
import { ScoreGauge } from "@/components/dashboard/score-gauge"
import { RiskBreakdownChart } from "@/components/dashboard/risk-breakdown-chart"
import { PlatformExposureChart } from "@/components/dashboard/platform-exposure-chart"
import { DataExposureChart } from "@/components/dashboard/data-exposure-chart"
import { RecommendationPanel } from "@/components/dashboard/recommendation-panel"
import { MlExplanationPanel } from "@/components/dashboard/ml-explanation-panel"
import { DomainRiskPanel } from "@/components/dashboard/domain-risk-panel"
import { PrivacyActionSummary } from "@/components/dashboard/privacy-action-summary"
import { AnalysisProvenancePanel } from "@/components/dashboard/analysis-provenance-panel"
import { PrivacyRoadmapPanel } from "@/components/dashboard/privacy-roadmap-panel"

function DashboardContent() {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
      return
    }

    const loadAnalysis = async () => {
      setLoadingAnalysis(true)
      try {
        if (id) {
          const response = await fetch(`/api/analyses/${id}`)
          if (response.ok) {
            const data = await response.json()
            setAnalysis(data)
            setLoadingAnalysis(false)
            return
          }
        }
      } catch (error) {
        console.error("Failed to load analysis from database:", error)
      }

      // Load analysis from session storage as a fallback
      const stored = sessionStorage.getItem("privacy_analysis")
      if (stored) {
        setAnalysis(JSON.parse(stored))
      }
      setLoadingAnalysis(false)
    }

    if (!isLoading && user) {
      loadAnalysis()
    }
  }, [user, isLoading, router, id])


  const handleLogout = async () => {
    await logout()
    sessionStorage.removeItem("privacy_analysis")
    router.push("/")
  }

  if (isLoading || loadingAnalysis) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">Privacy Debt Visualizer</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">No Analysis Available</h1>
          <p className="text-muted-foreground mb-8">
            Complete the privacy behavior simulator to see your results.
          </p>
          <Link href="/simulator">
            <Button>
              <RefreshCw className="h-4 w-4 mr-2" />
              Start Analysis
            </Button>
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">Privacy Debt Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Welcome, {user.name}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/simulator" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Simulator
        </Link>

        <div className="mb-8">
          <PrivacyActionSummary analysis={analysis} />
        </div>

        <div className="mb-8">
          <AnalysisProvenancePanel analysis={analysis} />
        </div>

        {/* Score Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Privacy Debt Score */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Privacy Debt Score</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ScoreGauge score={analysis.score.totalScore} riskLevel={analysis.score.riskLevel} />
            </CardContent>
          </Card>

          {/* Risk Breakdown */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Risk Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <RiskBreakdownChart breakdown={analysis.score.breakdown} />
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Platform Distribution */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Platform Exposure</CardTitle>
            </CardHeader>
            <CardContent>
              <PlatformExposureChart distribution={analysis.score.platformDistribution} />
            </CardContent>
          </Card>

          {/* Data Exposure */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Data Exposure Status</CardTitle>
            </CardHeader>
            <CardContent>
              <DataExposureChart exposure={analysis.score.dataExposure} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 mb-8">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">ML Score Explanation</CardTitle>
            </CardHeader>
            <CardContent>
              <MlExplanationPanel ml={analysis.score.ml} />
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Domain Risk Review</CardTitle>
            </CardHeader>
            <CardContent>
              <DomainRiskPanel domains={analysis.score.ml?.domainAnalysis} />
            </CardContent>
          </Card>
        </div>

        {/* AI Recommendations */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              AI-Powered Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RecommendationPanel recommendations={analysis.recommendations} />
          </CardContent>
        </Card>

        <Card className="bg-card border-border mt-8">
          <CardHeader>
            <CardTitle className="text-foreground">Privacy Improvement Roadmap</CardTitle>
          </CardHeader>
          <CardContent>
            <PrivacyRoadmapPanel analysis={analysis} />
          </CardContent>
        </Card>

        {/* Action Footer */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/simulator">
            <Button variant="outline" className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Run New Analysis
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
