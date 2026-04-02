import { useEffect, useRef } from 'react'
import { createChart, ColorType } from 'lightweight-charts'

export default function PriceChart() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, { height: 300, layout: { background: { type: ColorType.Solid, color: 'white' } } })
    const series = chart.addCandlestickSeries()
    // Sample placeholder data
    series.setData([
      { time: '2024-10-01', open: 110, high: 115, low: 108, close: 112 },
      { time: '2024-10-02', open: 112, high: 118, low: 111, close: 116 },
      { time: '2024-10-03', open: 116, high: 120, low: 115, close: 119 },
    ])
    const handle = () => chart.timeScale().fitContent()
    window.addEventListener('resize', handle)
    handle()
    return () => window.removeEventListener('resize', handle)
  }, [])

  return <div ref={containerRef} className="w-full border rounded-md" />
}
