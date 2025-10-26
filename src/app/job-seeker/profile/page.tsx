"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { GestureProfileCapture } from "@/components/gesture-profile-capture"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUser } from "@/lib/auth/hooks"
import { Camera, Loader2 } from "lucide-react"

export default function JobSeekerProfilePage() {
  const { user } = useUser()
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [showGestureCapture, setShowGestureCapture] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    location: "",
    bio: "",
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    if (user?.id) {
      fetchProfile()
    }
  }, [user?.id])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("job_seeker_profiles").select("*").eq("id", user?.id).single()

      if (error && error.code !== "PGRST116") throw error

      if (data) {
        setFormData({
          full_name: data.full_name || "",
          phone: data.phone || "",
          location: data.location || "",
          bio: data.bio || "",
        })
        if (data.profile_image_url) {
          setProfileImage(data.profile_image_url)
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageSave = async (imageData: string) => {
    try {
      setSaving(true)
      setProfileImage(imageData)
      setShowGestureCapture(false)

      // Save image to Supabase storage or as data URL
      const { error } = await supabase
        .from("job_seeker_profiles")
        .update({ profile_image_url: imageData })
        .eq("id", user?.id)

      if (error) throw error
    } catch (error) {
      console.error("Error saving profile image:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from("job_seeker_profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio,
        })
        .eq("id", user?.id)

      if (error) throw error
    } catch (error) {
      console.error("Error saving profile:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">Profile Management</h1>

        {/* Profile Picture Section */}
        <Card className="p-8 mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">Profile Picture</h2>

          <div className="flex items-center gap-8">
            {/* Current Profile Picture */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                {profileImage ? (
                  <img src={profileImage || "/placeholder.svg"} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Upload Options */}
            <div className="flex-1">
              <p className="text-muted-foreground mb-4">
                {profileImage
                  ? "Your profile picture has been set. You can update it anytime."
                  : "Add a profile picture using hand gesture recognition."}
              </p>
              <Button onClick={() => setShowGestureCapture(true)} disabled={saving} className="gap-2">
                <Camera className="w-4 h-4" />
                {profileImage ? "Update Picture" : "Capture with Gesture"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Gesture Capture Modal */}
        {showGestureCapture && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <GestureProfileCapture onSave={handleImageSave} onClose={() => setShowGestureCapture(false)} />
          </div>
        )}

        {/* Personal Information Section */}
        <Card className="p-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">Personal Information</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(123) 456-7890"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="San Francisco, CA"
              />
            </div>

            <div>
              <Label htmlFor="bio">About Me</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us a little about yourself..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2 pt-6 border-t border-border">
              <Button variant="outline" onClick={fetchProfile} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
