"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { PrivacyFormData } from "@/lib/types"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const platformCategories = [
  "Social Media",
  "Email Services",
  "Financial Apps",
  "Government Services",
  "Shopping Platforms",
  "Cloud Storage",
  "Messaging Apps",
  "Gaming Platforms",
]

interface SectionProps {
  formData: PrivacyFormData
  updateFormData: (updates: Partial<PrivacyFormData>) => void
}

export function AccountFootprintSection({ formData, updateFormData }: SectionProps) {
  const [newApp, setNewApp] = useState("")

  const handleCategoryToggle = (category: string) => {
    const current = formData.platformCategories
    const updated = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category]
    updateFormData({ platformCategories: updated })
  }

  const addSpecificApp = () => {
    if (newApp.trim() && !formData.specificApps.includes(newApp.trim())) {
      updateFormData({ specificApps: [...formData.specificApps, newApp.trim()] })
      setNewApp("")
    }
  }

  const removeSpecificApp = (app: string) => {
    updateFormData({ specificApps: formData.specificApps.filter((a) => a !== app) })
  }

  return (
    <div className="space-y-8">
      {/* Number of Online Accounts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Number of Online Accounts</Label>
          <span className="text-lg font-semibold text-primary">{formData.onlineAccounts}</span>
        </div>
        <Slider
          value={[formData.onlineAccounts]}
          onValueChange={([value]) => updateFormData({ onlineAccounts: value })}
          min={0}
          max={50}
          step={1}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>50+</span>
        </div>
      </div>

      {/* Number of Inactive Accounts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Number of Inactive Accounts</Label>
          <span className="text-lg font-semibold text-primary">{formData.inactiveAccounts}</span>
        </div>
        <Slider
          value={[formData.inactiveAccounts]}
          onValueChange={([value]) => updateFormData({ inactiveAccounts: value })}
          min={0}
          max={formData.onlineAccounts}
          step={1}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>{formData.onlineAccounts}</span>
        </div>
      </div>

      {/* Platform Categories */}
      <div className="space-y-4">
        <Label>Platform Categories Used</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {platformCategories.map((category) => (
            <label
              key={category}
              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                formData.platformCategories.includes(category)
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Checkbox
                checked={formData.platformCategories.includes(category)}
                onCheckedChange={() => handleCategoryToggle(category)}
              />
              <span className="text-sm">{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Specific Apps */}
      <div className="space-y-4">
        <Label>Specific Apps You Use</Label>
        <div className="flex gap-2">
          <Input
            placeholder="e.g., Instagram, Google, Amazon"
            value={newApp}
            onChange={(e) => setNewApp(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpecificApp())}
          />
          <Button type="button" onClick={addSpecificApp} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {formData.specificApps.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.specificApps.map((app) => (
              <Badge key={app} variant="secondary" className="gap-1">
                {app}
                <button onClick={() => removeSpecificApp(app)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
