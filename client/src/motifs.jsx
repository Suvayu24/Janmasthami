/**
 * Decorative line-art motifs inspired by Krishna's iconography — a butter pot,
 * a peacock feather, and a bansuri (flute). Rendered in a single muted tone
 * (via `currentColor`) so they read as a quiet watermark rather than
 * competing with the festival photography.
 */

export function ButterPotMotif({ className = "", style }) {
  return (
    <span className={`motif motif-butterpot ${className}`} style={style} aria-hidden="true">
      <svg viewBox="0 0 120 150" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M52 12c-3-7 5-11 8-11s11 4 8 11" />
        <ellipse cx="60" cy="20" rx="17" ry="5.5" />
        <path d="M45 21c-7 12-7 12-12 22" />
        <path d="M75 21c7 12 7 12 12 22" />
        <path d="M33 43c-15 21-15 52 8 75 9 9 29 9 38 0 23-23 23-54 8-75" />
        <ellipse cx="60" cy="129" rx="21" ry="6" />
        <path d="M22 74c14 9 62 9 76 0" opacity="0.55" strokeWidth="1.6" />
        <path d="M20 96c15 11 65 11 80 0" opacity="0.55" strokeWidth="1.6" />
      </svg>
    </span>
  );
}

export function PeacockFeatherMotif({ className = "", style }) {
  const barbCount = 9;
  const barbs = Array.from({ length: barbCount }, (_, i) => {
    const t = i / (barbCount - 1);
    const y = 250 - t * 195;
    const len = 34 - t * 20;
    const droop = 10 + t * 4;
    return { y, len, droop };
  });

  return (
    <span className={`motif motif-feather ${className}`} style={style} aria-hidden="true">
      <svg viewBox="0 0 100 270" fill="none" stroke="currentColor" strokeLinecap="round">
        <path d="M50 268C46 210 52 130 50 50" strokeWidth="2.2" />
        {barbs.map((b, i) => (
          <g key={i}>
            <path
              d={`M50 ${b.y}C ${50 - b.len * 0.6} ${b.y - b.droop} ${50 - b.len} ${b.y - b.droop * 2} ${50 - b.len} ${b.y - b.droop * 2}`}
              strokeWidth="1.3"
              opacity="0.85"
            />
            <path
              d={`M50 ${b.y}C ${50 + b.len * 0.6} ${b.y - b.droop} ${50 + b.len} ${b.y - b.droop * 2} ${50 + b.len} ${b.y - b.droop * 2}`}
              strokeWidth="1.3"
              opacity="0.85"
            />
          </g>
        ))}
        <ellipse cx="50" cy="34" rx="21" ry="28" strokeWidth="1.6" />
        <ellipse cx="50" cy="34" rx="12.5" ry="18" strokeWidth="1.2" opacity="0.8" />
        <circle cx="50" cy="34" r="4.5" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}

export function FluteMotif({ className = "", style }) {
  const holes = [88, 110, 132, 154, 176, 198];

  return (
    <span className={`motif motif-flute ${className}`} style={style} aria-hidden="true">
      <svg viewBox="0 0 260 46" fill="none" stroke="currentColor" strokeLinecap="round">
        <rect x="14" y="14" width="232" height="18" rx="9" strokeWidth="2" />
        <line x1="32" y1="14" x2="32" y2="32" strokeWidth="1.4" opacity="0.55" />
        <line x1="228" y1="14" x2="228" y2="32" strokeWidth="1.4" opacity="0.55" />
        <circle cx="46" cy="23" r="3" fill="currentColor" stroke="none" />
        {holes.map((x) => (
          <circle key={x} cx={x} cy="23" r="2.6" fill="currentColor" stroke="none" />
        ))}
        <path d="M246 21c9 0 9 12 0 14" strokeWidth="1.6" opacity="0.6" />
      </svg>
    </span>
  );
}
