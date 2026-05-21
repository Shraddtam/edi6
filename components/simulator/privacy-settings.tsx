"use client"

import { PrivacyFormData } from "@/lib/types"
import { Label } from "@/components/ui/label"
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

export function PrivacySettingsSection({ formData, updateFormData }: SectionProps) {
  return (
    <div className="space-y-8">
      {/* Profile Visibility */}
      <div className="space-y-4">
        <Label>Default Profile Visibility</Label>
        <Select
          value={formData.profileVisibility}
          onValueChange={(value: PrivacyFormData["profileVisibility"]) =>
            updateFormData({ profileVisibility: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">Private - Only you can see</SelectItem>
            <SelectItem value="friends">Friends Only</SelectItem>
            <SelectItem value="public">Public - Anyone can see</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Location Sharing */}
      <div className="space-y-4">
        <Label>Location Sharing</Label>
        <Select
          value={formData.locationSharing}
          onValueChange={(value: PrivacyFormData["locationSharing"]) =>
            updateFormData({ locationSharing: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select location sharing" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="never">Never share location</SelectItem>
            <SelectItem value="sometimes">Sometimes share location</SelectItem>
            <SelectItem value="always">Always share location</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ad Tracking */}
      <div className="space-y-4">
        <Label>Ad Tracking Permissions</Label>
        <Select
          value={formData.adTracking}
          onValueChange={(value: PrivacyFormData["adTracking"]) =>
            updateFormData({ adTracking: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select ad tracking" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="disabled">Disabled - Block all tracking</SelectItem>
            <SelectItem value="limited">Limited - Some tracking allowed</SelectItem>
            <SelectItem value="enabled">Enabled - Full tracking allowed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cookie Consent */}
      <div className="space-y-4">
        <Label>Cookie Consent Behavior</Label>
        <Select
          value={formData.cookieConsent}
          onValueChange={(value: PrivacyFormData["cookieConsent"]) =>
            updateFormData({ cookieConsent: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select cookie behavior" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="reject">Always reject non-essential cookies</SelectItem>
            <SelectItem value="sometimes">Sometimes accept cookies</SelectItem>
            <SelectItem value="accept">Always accept all cookies</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
