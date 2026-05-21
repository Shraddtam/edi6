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

const loginMethods = [
  "Email + Password",
  "Google Login",
  "Facebook Login",
  "Apple Login",
  "SSO (Single Sign-On)",
]

interface SectionProps {
  formData: PrivacyFormData
  updateFormData: (updates: Partial<PrivacyFormData>) => void
}

export function AuthSecuritySection({ formData, updateFormData }: SectionProps) {
  const handleLoginMethodToggle = (method: string) => {
    const current = formData.loginMethods
    const updated = current.includes(method)
      ? current.filter((m) => m !== method)
      : [...current, method]
    updateFormData({ loginMethods: updated })
  }

  return (
    <div className="space-y-8">
      {/* Password Reuse Level */}
      <div className="space-y-4">
        <Label>Password Reuse Level</Label>
        <Select
          value={formData.passwordReuse}
          onValueChange={(value: PrivacyFormData["passwordReuse"]) =>
            updateFormData({ passwordReuse: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select password reuse level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="never">Never reuse passwords</SelectItem>
            <SelectItem value="sometimes">Sometimes reuse passwords</SelectItem>
            <SelectItem value="often">Often reuse passwords</SelectItem>
            <SelectItem value="always">Same password everywhere</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Password Strength */}
      <div className="space-y-4">
        <Label>Password Strength</Label>
        <Select
          value={formData.passwordStrength}
          onValueChange={(value: PrivacyFormData["passwordStrength"]) =>
            updateFormData({ passwordStrength: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select password strength" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weak">Weak (simple, short passwords)</SelectItem>
            <SelectItem value="medium">Medium (mix of letters and numbers)</SelectItem>
            <SelectItem value="strong">Strong (complex, unique passwords)</SelectItem>
            <SelectItem value="manager">Password Manager Used</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Two-Factor Authentication */}
      <div className="space-y-4">
        <Label>Two-Factor Authentication Usage</Label>
        <Select
          value={formData.twoFactorAuth}
          onValueChange={(value: PrivacyFormData["twoFactorAuth"]) =>
            updateFormData({ twoFactorAuth: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select 2FA usage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None - No 2FA enabled</SelectItem>
            <SelectItem value="some">Some accounts have 2FA</SelectItem>
            <SelectItem value="most">Most accounts have 2FA</SelectItem>
            <SelectItem value="all">All accounts have 2FA</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Login Methods */}
      <div className="space-y-4">
        <Label>Login Methods Used</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {loginMethods.map((method) => (
            <label
              key={method}
              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                formData.loginMethods.includes(method)
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Checkbox
                checked={formData.loginMethods.includes(method)}
                onCheckedChange={() => handleLoginMethodToggle(method)}
              />
              <span className="text-sm">{method}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
