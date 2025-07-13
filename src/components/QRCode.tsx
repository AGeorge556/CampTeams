import React, { useEffect, useRef } from 'react'

interface QRCodeProps {
  value: string
  size?: number
  className?: string
}

export default function QRCode({ value, size = 200, className = '' }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const generateQR = async () => {
      if (!canvasRef.current || !value) return

      try {
        // Dynamic import of qrcode library
        const QRCode = (await import('qrcode')).default
        
        await QRCode.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
      } catch (error) {
        console.error('Error generating QR code:', error)
      }
    }

    generateQR()
  }, [value, size])

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <canvas
        ref={canvasRef}
        className="border border-gray-200 rounded-lg shadow-sm"
      />
      <p className="text-sm text-gray-600 mt-2 text-center">
        Scan to check in
      </p>
    </div>
  )
} 