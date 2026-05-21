"use client"

import { PrivacyFormData } from "@/lib/types"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const dataTypes = [
  "Email",
  "Phone Number",
  "Home Address",
  "Payment Information",
  "Government ID",
  "Location Data",
  "Photos/Videos",
  "Contacts",
  "Browsing History",
]

interface SectionProps {
  formData: PrivacyFormData
  updateFormData: (updates: Partial<PrivacyFormData>) => void
}

export function DataSharingSection({ formData, updateFormData }: SectionProps) {
  const handleDataTypeToggle = (dataType: string) => {
    const current = formData.sharedDataTypes
    const updated = current.includes(dataType)
      ? current.filter((d) => d !== dataType)
      : [...current, dataType]
    updateFormData({ sharedDataTypes: updated })
  }

  return (
    <div className="space-y-8">
      {/* Shared Data Types */}
      <div className="space-y-4">
        <Label>Types of Personal Data You Share Online</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {dataTypes.map((dataType) => (
            <label
              key={dataType}
              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                formData.sharedDataTypes.includes(dataType)
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Checkbox
                checked={formData.sharedDataTypes.includes(dataType)}
                onCheckedChange={() => handleDataTypeToggle(dataType)}
              />
              <span className="text-sm">{dataType}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sharing Frequency */}
      <div className="space-y-4">
        <Label>How Often Do You Share Personal Information?</Label>
        <Select
          value={formData.sharingFrequency}
          onValueChange={(value: PrivacyFormData["sharingFrequency"]) =>
            updateFormData({ sharingFrequency: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select sharing frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rarely">Rarely - Only when absolutely necessary</SelectItem>
            <SelectItem value="occasionally">Occasionally - For important services</SelectItem>
            <SelectItem value="often">Often - For convenience</SelectItem>
            <SelectItem value="very-often">Very Often - Freely share data</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
