"use client"

// ─── geometry helpers ──────────────────────────────────────────────────────────

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) }
}

/**
 * SVG arc path along a circle from startDeg → endDeg.
 * Going from 180° (left) → 0° (right) with sweep=1 traces the UPPER semicircle.
 */
function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = polar(cx, cy, r, startDeg)
  const e = polar(cx, cy, r, endDeg)
  // sweep=1 (CW in screen coords) from a higher angle to a lower one goes through the top
  const sweep = startDeg > endDeg ? 1 : 0
  return `M ${s.x} ${s.y} A ${r} ${r} 0 0 ${sweep} ${e.x} ${e.y}`
}

// ─── constants ─────────────────────────────────────────────────────────────────

const CX = 130
const CY = 130
const R  = 96   // shared midline radius for both arcs

const BG_W    = 15  // thin background ring
const SCORE_W = 30  // thick score arc

// viewBox: top = CY − R − SCORE_W/2 − 2px padding, bottom = CY
// → "0 12 260 118"
const VIEW_BOX = "0 12 260 118"

// ─── component ────────────────────────────────────────────────────────────────

export function ScoreGauge({ score, isProcessing }: { score: number; isProcessing?: boolean }) {
  const full  = arcPath(CX, CY, R, 180, 0)

  if (isProcessing) {
    return (
      <div className="mx-auto w-full max-w-[260px]">
        <svg viewBox={VIEW_BOX} className="w-full overflow-visible">
          <path d={full} fill="none" strokeWidth={BG_W}    className="stroke-muted" strokeLinecap="square" />
          <path d={full} fill="none" strokeWidth={SCORE_W} className="stroke-muted animate-pulse" strokeLinecap="square" />
        </svg>
      </div>
    )
  }

  // 0 → 100 maps to 180° → 0°
  const endDeg   = 180 - Math.min(Math.max(score, 0), 100) * 1.8
  const scorePth = score > 0 ? arcPath(CX, CY, R, 180, endDeg) : ""

  return (
    <div className="mx-auto w-full max-w-[260px]">
      <svg viewBox={VIEW_BOX} className="w-full overflow-visible">
        {/* thin muted ring — full 180° */}
        <path
          d={full}
          fill="none"
          strokeWidth={BG_W}
          className="stroke-muted"
          strokeLinecap="square"
        />

        {/* thick primary arc — proportional to score */}
        {scorePth && (
          <path
            d={scorePth}
            fill="none"
            strokeWidth={SCORE_W}
            className="stroke-primary"
            strokeLinecap="square"
          />
        )}

        {/* score label — sits inside the arc opening */}
        <text x={CX} y={CY - 30} textAnchor="middle" className="fill-foreground font-bold" style={{ fontSize: 42, fontWeight: 700 }}>
          {score}
        </text>
        <text x={CX} y={CY - 10} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 13 }}>
          von 100
        </text>
      </svg>
    </div>
  )
}
