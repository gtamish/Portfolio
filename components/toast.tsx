"use client"

import { useEffect, useState } from "react"
import { CheckCircle, XCircle, X } from "lucide-react"

interface ToastProps {
  message: string
  type: "success" | "error"
  onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300)
    }, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`
        fixed top-6 right-6 z-50
        flex items-center gap-3
        px-4 py-3 rounded-lg
        border bg-background/95 backdrop-blur-xl shadow-lg
        transition-all duration-300 ease-out
        ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}
      `}
    >
      {type === "success" ? (
        <CheckCircle className="size-5 text-green-500" />
      ) : (
        <XCircle className="size-5 text-red-500" />
      )}
      <span className="text-sm font-medium text-foreground">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(onClose, 300)
        }}
        className="ml-2 p-1 rounded-full hover:bg-accent transition-colors"
      >
        <X className="size-4 text-muted-foreground" />
      </button>
    </div>
  )
}
