import React from 'react'

interface LaptopFrameProps {
  url?: string
  alt?: string
  className?: string
}

export function LaptopFrame({ url, alt = 'Prototype', className = '' }: LaptopFrameProps) {
  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative bg-gradient-to-b from-gray-900 to-black rounded-xl shadow-2xl overflow-hidden border-8 border-gray-800">
        {/* Laptop bezel */}
        <div className="absolute inset-0 rounded-lg border border-gray-700 pointer-events-none" />
        
        {/* Screen */}
        <div className="relative bg-black aspect-video overflow-hidden">
          {url ? (
            <iframe
              src={url}
              alt={alt}
              className="w-full h-full border-0"
              allow="fullscreen"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <p className="text-gray-500 text-sm">Enter a Figma prototype URL</p>
            </div>
          )}
        </div>
      </div>

      {/* Laptop stand/base */}
      <div className="relative mt-0">
        <div className="mx-auto w-2/3 h-2 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-full" />
        <div className="mx-auto w-1/2 h-8 bg-gray-800 rounded-b-2xl shadow-xl" />
      </div>
    </div>
  )
}
