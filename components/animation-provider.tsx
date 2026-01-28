"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

const AnimationContext = createContext<boolean>(false)

export function useInitialAnimation() {
  return useContext(AnimationContext)
}

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if this is a fresh page load (not client-side navigation)
    const hasAnimated = sessionStorage.getItem("hasAnimated")
    
    if (!hasAnimated) {
      setShouldAnimate(true)
      sessionStorage.setItem("hasAnimated", "true")
    }
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <AnimationContext.Provider value={shouldAnimate}>
      {children}
    </AnimationContext.Provider>
  )
}
