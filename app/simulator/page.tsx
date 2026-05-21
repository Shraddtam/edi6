"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { PrivacyFormData } from "@/lib/types"
import { AccountFootprintSection } from "@/components/simulator/account-footprint"
import { AuthSecuritySection } from "@/components/simulator/auth-security"
import { DataSharingSection } from "@/components/simulator/data-sharing"
import { ThirdPartyAppsSection } from "@/components/simulator/third-party-apps"
import { PrivacySettingsSection } from "@/components/simulator/privacy-settings"
import { WebsiteInteractionSection } from "@/components/simulator/website-interaction"
import { AdditionalNotesSection } from "@/components/simulator/additional-notes"

const initialFormData: PrivacyFormData = {
  onlineAccounts: 10,
  inactiveAccounts: 3,
  platformCategories: [],
  specificApps: [],
  passwordReuse: "sometimes",
  passwordStrength: "medium",
  twoFactorAuth: "some",
  loginMethods: [],
  sharedDataTypes: [],
  sharingFrequency: "occasionally",
  connectedApps: 5,
  thirdPartyAppNames: [],
  profileVisibility: "friends",
  locationSharing: "sometimes",
  adTracking: "limited",
  cookieConsent: "sometimes",
  unknownSiteFrequency: "occasional",
  unknownDownloads: "sometimes",
  frequentSites: "",
  additionalNotes: "",
}

export default function SimulatorPage() {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState<PrivacyFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentSection, setCurrentSection] = useState(0)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  const updateFormData = (updates: Partial<PrivacyFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const result = await response.json()
        sessionStorage.setItem("privacy_analysis", JSON.stringify(result))
        if (result.id) {
          router.push(`/dashboard?id=${result.id}`)
        } else {
          router.push("/dashboard")
        }
      }
    } catch (error) {
      console.error("Analysis failed:", error)
    } finally {
      setIsSubmitting(false)
    }
  }


  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  const sections = [
    { title: "Account Footprint", component: AccountFootprintSection },
    { title: "Authentication & Security", component: AuthSecuritySection },
    { title: "Data Sharing Behavior", component: DataSharingSection },
    { title: "Third Party Apps", component: ThirdPartyAppsSection },
    { title: "Privacy Settings", component: PrivacySettingsSection },
    { title: "Website Interaction", component: WebsiteInteractionSection },
    { title: "Additional Notes", component: AdditionalNotesSection },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const CurrentSectionComponent = sections[currentSection].component

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">Privacy Debt Visualizer</span>
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
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              Section {currentSection + 1} of {sections.length}
            </h2>
            <span className="text-sm text-muted-foreground">
              {Math.round(((currentSection + 1) / sections.length) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Section Navigation Pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {sections.map((section, index) => (
            <button
              key={section.title}
              onClick={() => setCurrentSection(index)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                index === currentSection
                  ? "bg-primary text-primary-foreground"
                  : index < currentSection
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>

        {/* Current Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">{sections[currentSection].title}</CardTitle>
            <CardDescription>
              Complete the information below to help us calculate your privacy debt score.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CurrentSectionComponent formData={formData} updateFormData={updateFormData} />
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentSection((prev) => Math.max(0, prev - 1))}
            disabled={currentSection === 0}
          >
            Previous
          </Button>
          {currentSection < sections.length - 1 ? (
            <Button onClick={() => setCurrentSection((prev) => prev + 1)}>
              Next Section
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Privacy"
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
