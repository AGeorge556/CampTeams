import React from 'react'

// Lightweight Spline background fallback.
// Some builds import this component as a default export. The original implementation
// may embed @splinetool/react-spline; keep a small, safe default here so the app
// doesn't crash if the Spline file/runtime is not available or during edits.
export default function SplineBackground() {
	return (
		<div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
			<div className="w-full h-full">
				{/* Gradient background that respects theme CSS variables */}
				<div
					style={{
						width: '100%',
						height: '100%',
						background: 'linear-gradient(180deg, var(--color-bg) 0%, rgba(245,158,11,0.06) 100%)'
					}}
				/>
			</div>
		</div>
	)
}
