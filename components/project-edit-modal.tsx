"use client"

import { useState, useEffect } from "react"
import { X, Lock } from "lucide-react"

interface ProjectEditModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProjectEditModal({ isOpen, onClose }: ProjectEditModalProps) {
  const [mounted, setMounted] = useState(false)
  const [passkey, setPasskey] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState("")
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handlePasskeySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsChecking(true)

    try {
      const response = await fetch("/api/verify-passkey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey }),
      })

      if (response.ok) {
        setIsAuthenticated(true)
        setPasskey("")
      } else {
        setError("Invalid passkey")
        setPasskey("")
      }
    } catch (err) {
      setError("Authentication failed")
    } finally {
      setIsChecking(false)
    }
  }

  if (!mounted || !isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border bg-background/95 backdrop-blur-xl shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-foreground">Manage Projects</h2>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg border border-transparent hover:bg-accent/50 p-2 transition-colors"
          >
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isAuthenticated ? (
            <form onSubmit={handlePasskeySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Enter Passkey
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" strokeWidth={1.5} />
                  <input
                    type="password"
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                    placeholder="Enter passkey to continue"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                    disabled={isChecking}
                  />
                </div>
                {error && <p className="text-sm text-destructive mt-2">{error}</p>}
              </div>
              <button
                type="submit"
                disabled={isChecking || !passkey}
                className="w-full px-4 py-3 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChecking ? "Verifying..." : "Authenticate"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You are now authenticated. You can manage your projects here.
              </p>
              <div className="rounded-lg border border-border/50 p-4 bg-accent/5">
                <p className="text-sm text-foreground font-medium mb-3">Features coming soon:</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Add new projects</li>
                  <li>• Edit project details</li>
                  <li>• Remove projects</li>
                  <li>• Reorder projects</li>
                </ul>
              </div>
              <button
                onClick={() => {
                  setIsAuthenticated(false)
                  onClose()
                }}
                className="w-full px-4 py-3 rounded-lg border bg-background hover:bg-accent/50 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
