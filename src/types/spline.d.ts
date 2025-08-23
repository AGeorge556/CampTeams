declare module '@splinetool/react-spline' {
  import * as React from 'react'

  export interface SplineProps extends React.ComponentProps<'div'> {
    scene: string
    onLoad?: () => void
    style?: React.CSSProperties
    className?: string
  }

  const Spline: React.ComponentType<SplineProps>
  export default Spline
}
