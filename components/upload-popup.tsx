"use client"

import React from "react"

import { useState, useRef } from "react"
import { X, Upload, Lock, ImageIcon } from "lucide-react"
import { Toast } from "./toast"

interface UploadPopupProps {
  isOpen: boolean
  onClose: () => void
}

const PASSKEY = "wHY0"

export function UploadPopup({ isOpen, onClose }: UploadPopupProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passkey, setPasskey] = useState("")
  const [passkeyError, setPasskeyError] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePasskeySubmit = () => {
    if (passkey === PASSKEY) {
      setIsAuthenticated(true)
      setPasskeyError(false)
    } else {
      setPasskeyError(true)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !title) return

    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("title", title)
      formData.append("description", description)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        setToast({ message: "File uploaded successfully!", type: "success" })
        handleReset()
        setTimeout(() => {
          onClose()
          window.location.reload()
        }, 1500)
      } else {
        throw new Error("Upload failed")
      }
    } catch {
      setToast({ message: "Failed to upload file. Please try again.", type: "error" })
    } finally {
      setIsUploading(false)
    }
  }

  const handleReset = () => {
    setIsAuthenticated(false)
    setPasskey("")
    setPasskeyError(false)
    setTitle("")
    setDescription("")
    setSelectedFile(null)
    setPreview(null)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  if (!isOpen) return toast ? <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /> : null

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-md transition-opacity"
        onClick={handleClose}
      />

      {/* Popup */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <div 
          className="relative w-full max-w-md rounded-2xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/50">
            <h2 className="text-lg font-semibold text-foreground">
              {isAuthenticated ? "Upload Project" : "Authentication Required"}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-accent transition-colors"
            >
              <X className="size-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {!isAuthenticated ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-accent/50">
                  <Lock className="size-8 text-muted-foreground" />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Enter the passkey to upload projects
                </p>
                <input
                  type="password"
                  value={passkey}
                  onChange={(e) => {
                    setPasskey(e.target.value)
                    setPasskeyError(false)
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handlePasskeySubmit()}
                  placeholder="Enter passkey"
                  className={`
                    w-full px-4 py-3 rounded-lg
                    border bg-background text-foreground text-center
                    placeholder:text-muted-foreground
                    focus:outline-none focus:ring-2 focus:ring-ring
                    transition-colors
                    ${passkeyError ? "border-red-500" : "border-border"}
                  `}
                />
                {passkeyError && (
                  <p className="text-center text-sm text-red-500">Incorrect passkey</p>
                )}
                <button
                  onClick={handlePasskeySubmit}
                  className="w-full py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
                >
                  Authenticate
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* File Picker */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative aspect-video rounded-lg border-2 border-dashed border-border hover:border-foreground/50 cursor-pointer transition-colors overflow-hidden"
                >
                  {preview ? (
                    <img src={preview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <ImageIcon className="size-10 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to select image</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Title */}
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Project title"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                />

                {/* Description */}
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Project description (optional)"
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors resize-none"
                />

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-3 rounded-lg border border-border bg-transparent text-foreground font-medium hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || !title || isUploading}
                    className="flex-1 py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <span>Uploading...</span>
                    ) : (
                      <>
                        <Upload className="size-4" />
                        <span>Upload</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
