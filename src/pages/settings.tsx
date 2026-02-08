import { useEffect, useState } from "react"
import { api } from "@/api/client"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { useAuth } from "@/providers/auth-provider"
import { CURRENCIES } from "@/lib/constants"

interface ProfileData {
  id: string
  displayName: string | null
  baseCurrency: string
}

export default function SettingsPage() {
  const { user } = useAuth()

  const [displayName, setDisplayName] = useState("")
  const [baseCurrency, setBaseCurrency] = useState("KWD")

  const [loadingProfile, setLoadingProfile] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    api
      .get<ProfileData>("/api/auth/profile")
      .then((profile) => {
        setDisplayName(profile.displayName || "")
        setBaseCurrency(profile.baseCurrency || "KWD")
      })
      .catch((err) => {
        setErrorMessage(err instanceof Error ? err.message : "Failed to load profile")
      })
      .finally(() => setLoadingProfile(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSuccessMessage("")
    setErrorMessage("")
    setSaving(true)
    try {
      await api.patch("/api/auth/profile", {
        displayName: displayName || null,
        baseCurrency,
      })
      setSuccessMessage("Settings saved successfully.")
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Settings" description="Manage your account preferences" />
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProfile ? (
              <div className="py-4 text-sm text-muted-foreground">Loading profile...</div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                {successMessage && (
                  <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
                    {successMessage}
                  </div>
                )}
                {errorMessage && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                    {errorMessage}
                  </div>
                )}

                {user?.email && (
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={user.email} disabled />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baseCurrency">Base Currency</Label>
                  <Select value={baseCurrency} onValueChange={setBaseCurrency}>
                    <SelectTrigger id="baseCurrency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
