"use client"

import { PrivacyFormData } from "@/lib/types"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface SectionProps {
  formData: PrivacyFormData
  updateFormData: (updates: Partial<PrivacyFormData>) => void
}

export function AdditionalNotesSection({ formData, updateFormData }: SectionProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>Additional Privacy Concerns or Notes</Label>
        <Textarea
          placeholder="Share any additional privacy concerns, habits, or notes that might help us provide better recommendations.

Examples:
- I reuse passwords across multiple services
- I've been a victim of data breaches before
- I use public WiFi frequently
- I share accounts with family members"
          value={formData.additionalNotes}
          onChange={(e) => updateFormData({ additionalNotes: e.target.value })}
          className="min-h-[200px]"
        />
        <p className="text-xs text-muted-foreground">
          This information will be used to provide personalized AI recommendations for improving your privacy.
        </p>
      </div>

      {/* Summary Preview */}
      <div className="p-4 rounded-lg bg-secondary/50 border border-border">
        <h4 className="text-sm font-semibold mb-3 text-foreground">Quick Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Online Accounts:</span>
            <span className="ml-2 text-foreground">{formData.onlineAccounts}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Connected Apps:</span>
            <span className="ml-2 text-foreground">{formData.connectedApps}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Password Security:</span>
            <span className="ml-2 text-foreground capitalize">{formData.passwordStrength}</span>
          </div>
          <div>
            <span className="text-muted-foreground">2FA Status:</span>
            <span className="ml-2 text-foreground capitalize">{formData.twoFactorAuth}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Profile Visibility:</span>
            <span className="ml-2 text-foreground capitalize">{formData.profileVisibility}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Data Types Shared:</span>
            <span className="ml-2 text-foreground">{formData.sharedDataTypes.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
