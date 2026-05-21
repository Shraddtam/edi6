"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { PrivacyFormData } from "@/lib/types"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const suggestedApps = ["Zapier", "Notion", "Canva", "Spotify", "IFTTT", "Slack", "Trello", "Dropbox"]

interface SectionProps {
  formData: PrivacyFormData
  updateFormData: (updates: Partial<PrivacyFormData>) => void
}

export function ThirdPartyAppsSection({ formData, updateFormData }: SectionProps) {
  const [newApp, setNewApp] = useState("")

  const addApp = (app: string) => {
    if (app.trim() && !formData.thirdPartyAppNames.includes(app.trim())) {
      updateFormData({ thirdPartyAppNames: [...formData.thirdPartyAppNames, app.trim()] })
      setNewApp("")
    }
  }

  const removeApp = (app: string) => {
    updateFormData({ thirdPartyAppNames: formData.thirdPartyAppNames.filter((a) => a !== app) })
  }

  return (
    <div className="space-y-8">
      {/* Connected Apps Slider */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Number of Connected Third-Party Apps</Label>
          <span className="text-lg font-semibold text-primary">{formData.connectedApps}</span>
        </div>
        <Slider
          value={[formData.connectedApps]}
          onValueChange={([value]) => updateFormData({ connectedApps: value })}
          min={0}
          max={50}
          step={1}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>50+</span>
        </div>
        <p className="text-sm text-muted-foreground">
          These are apps that have access to your accounts (e.g., apps connected to Google, Facebook, etc.)
        </p>
      </div>

      {/* App Names Input */}
      <div className="space-y-4">
        <Label>Add Specific Third-Party Apps</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Enter app name"
            value={newApp}
            onChange={(e) => setNewApp(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addApp(newApp))}
          />
          <Button type="button" onClick={() => addApp(newApp)} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Add Suggestions */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">Quick add:</span>
          <div className="flex flex-wrap gap-2">
            {suggestedApps
              .filter((app) => !formData.thirdPartyAppNames.includes(app))
              .map((app) => (
                <Button
                  key={app}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addApp(app)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {app}
                </Button>
              ))}
          </div>
        </div>

        {/* Added Apps */}
        {formData.thirdPartyAppNames.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">Added apps:</span>
            <div className="flex flex-wrap gap-2">
              {formData.thirdPartyAppNames.map((app) => (
                <Badge key={app} variant="secondary" className="gap-1">
                  {app}
                  <button onClick={() => removeApp(app)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
