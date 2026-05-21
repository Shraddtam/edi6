"use client"

import { PrivacyFormData } from "@/lib/types"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SectionProps {
  formData: PrivacyFormData
  updateFormData: (updates: Partial<PrivacyFormData>) => void
}

export function WebsiteInteractionSection({ formData, updateFormData }: SectionProps) {
  return (
    <div className="space-y-8">
      {/* Unknown Site Frequency */}
      <div className="space-y-4">
        <Label>How Often Do You Visit Unknown/Untrusted Websites?</Label>
        <Select
          value={formData.unknownSiteFrequency}
          onValueChange={(value: PrivacyFormData["unknownSiteFrequency"]) =>
            updateFormData({ unknownSiteFrequency: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rare">Rare - Stick to known websites</SelectItem>
            <SelectItem value="occasional">Occasional - Sometimes explore</SelectItem>
            <SelectItem value="frequent">Frequent - Regularly visit new sites</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Unknown Downloads */}
      <div className="space-y-4">
        <Label>Downloading Files from Unknown Sources</Label>
        <Select
          value={formData.unknownDownloads}
          onValueChange={(value: PrivacyFormData["unknownDownloads"]) =>
            updateFormData({ unknownDownloads: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select download behavior" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="never">Never - Only from trusted sources</SelectItem>
            <SelectItem value="sometimes">Sometimes - When needed</SelectItem>
            <SelectItem value="often">Often - Frequently download</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Frequently Visited Sites */}
      <div className="space-y-4">
        <Label>Frequently Visited Websites</Label>
        <Textarea
          placeholder="List your frequently visited websites (e.g., google.com, reddit.com, amazon.com)"
          value={formData.frequentSites}
          onChange={(e) => updateFormData({ frequentSites: e.target.value })}
          className="min-h-[100px]"
        />
        <p className="text-xs text-muted-foreground">
          Optional: This helps us understand your browsing patterns.
        </p>
      </div>
    </div>
  )
}
