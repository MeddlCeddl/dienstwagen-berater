import { useState } from 'react'

const BRAND_CONFIG = {
  'BMW': {
    accent: '#4a90d9',
    accentDim: 'rgba(74,144,217,0.12)',
    accentBorder: 'rgba(74,144,217,0.32)',
    accentHover: 'rgba(74,144,217,0.28)',
    glowHover: 'rgba(74,144,217,0.18)',
    configuratorUrl: 'https://www.bmw.de/de/neufahrzeuge/konfigurator.html',
  },
  'Mercedes-Benz': {
    accent: '#b8b8b8',
    accentDim: 'rgba(184,184,184,0.1)',
    accentBorder: 'rgba(184,184,184,0.28)',
    accentHover: 'rgba(184,184,184,0.24)',
    glowHover: 'rgba(184,184,184,0.12)',
    configuratorUrl: 'https://www.mercedes-benz.de/passengercars/configurator.html',
  },
  'Audi': {
    accent: '#e0303a',
    accentDim: 'rgba(224,48,58,0.12)',
    accentBorder: 'rgba(224,48,58,0.32)',
    accentHover: 'rgba(224,48,58,0.28)',
    glowHover: 'rgba(224,48,58,0.15)',
    configuratorUrl: 'https://www.audi.de/de/brand/de/neuwagen/konfigurator.html',
  },
  'VW': {
    accent: '#1e9bd7',
    accentDim: 'rgba(30,155,215,0.12)',
    accentBorder: 'rgba(30,155,215,0.32)',
    accentHover: 'rgba(30,155,215,0.28)',
    glowHover: 'rgba(30,155,215,0.15)',
    configuratorUrl: 'https://www.volkswagen.de/de/models/konfigurator.html',
  },
}

const DEFAULT_CONFIG = {
  accent: '#c9a84c',
  accentDim: 'rgba(201,168,76,0.12)',
  accentBorder: 'rgba(201,168,76,0.3)',
  accentHover: 'rgba(201,168,76,0.28)',
  glowHover: 'rgba(201,168,76,0.15)',
  configuratorUrl: null,
}

const RANK_LABELS = ['1. Empfehlung', '2. Empfehlung', '3. Empfehlung']

export default function CarCard({ car, rank }) {
  const cfg = BRAND_CONFIG[car.marke] ?? DEFAULT_CONFIG
  const [cardHovered, setCardHovered] = useState(false)
  const [btnHovered, setBtnHovered] = useState(false)

  const brandAbbr = car.marke === 'Mercedes-Benz' ? 'MB' : car.marke.slice(0, 3).toUpperCase()

  return (
    <div
      className="rounded-2xl overflow-hidden animate-fadeInUp"
      style={{
        background: 'linear-gradient(160deg, #16213e 0%, #0f1a30 100%)',
        border: `1px solid ${cardHovered ? cfg.accent : cfg.accentBorder}`,
        boxShadow: cardHovered
          ? `0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px ${cfg.accentBorder}, 0 4px 20px ${cfg.glowHover}`
          : `0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 ${cfg.accentBorder}`,
        transform: cardHovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease',
        animationDelay: `${0.08 + rank * 0.13}s`,
        opacity: 0,
      }}
      onMouseEnter={() => setCardHovered(true)}
      onMouseLeave={() => setCardHovered(false)}
    >
      {/* Top accent bar */}
      <div
        className="h-0.5 w-full transition-all duration-300"
        style={{
          background: cardHovered
            ? `linear-gradient(to right, ${cfg.accent}, rgba(201,168,76,0.4), transparent)`
            : `linear-gradient(to right, ${cfg.accent}, transparent)`,
        }}
      />

      <div className="p-4 sm:p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 font-lato tracking-wider transition-all duration-300"
              style={{
                background: cardHovered ? cfg.accentDim : cfg.accentDim,
                border: `1px solid ${cardHovered ? cfg.accent : cfg.accentBorder}`,
                color: cfg.accent,
                boxShadow: cardHovered ? `0 0 10px ${cfg.glowHover}` : 'none',
              }}
            >
              {brandAbbr}
            </div>
            <div>
              <div
                className="text-xs font-light mb-0.5"
                style={{ color: 'rgba(201,168,76,0.6)', letterSpacing: '0.12em' }}
              >
                {RANK_LABELS[rank] ?? `#${rank + 1}`}
              </div>
              <div className="font-playfair font-semibold text-base leading-tight" style={{ color: '#f0f0f0' }}>
                {car.marke}
              </div>
              <div className="font-lato text-sm font-light" style={{ color: '#b0b0c0' }}>
                {car.modell}
              </div>
            </div>
          </div>

          <div className="text-right ml-3 shrink-0">
            <div className="text-xs font-light mb-0.5" style={{ color: 'rgba(201,168,76,0.5)', letterSpacing: '0.1em' }}>
              LISTENPREIS
            </div>
            <div className="font-playfair font-semibold text-base" style={{ color: '#c9a84c' }}>
              {car.listenpreis}
            </div>
          </div>
        </div>

        <div className="mb-4 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

        <p className="text-sm leading-relaxed mb-4 font-light" style={{ color: '#b8b8cc' }}>
          {car.begruendung}
        </p>

        {car.specs && car.specs.length > 0 && (
          <ul className="space-y-2 mb-5">
            {car.specs.map((spec, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: '#c8c8dc' }}>
                <span className="shrink-0 mt-0.5 text-xs" style={{ color: cfg.accent }}>◆</span>
                <span className="font-light">{spec}</span>
              </li>
            ))}
          </ul>
        )}

        {cfg.configuratorUrl && (
          <a
            href={cfg.configuratorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold tracking-wide no-underline"
            style={{
              background: btnHovered ? cfg.accentHover : cfg.accentDim,
              border: `1px solid ${btnHovered ? cfg.accent : cfg.accentBorder}`,
              color: cfg.accent,
              letterSpacing: '0.04em',
              transform: btnHovered ? 'scale(1.03)' : 'scale(1)',
              boxShadow: btnHovered ? `0 4px 14px ${cfg.glowHover}` : 'none',
              transition: 'transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
            }}
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
          >
            Jetzt konfigurieren
            <span
              style={{
                display: 'inline-block',
                fontSize: '0.85em',
                transform: btnHovered ? 'translateX(3px)' : 'translateX(0)',
                transition: 'transform 0.2s ease',
              }}
            >
              →
            </span>
          </a>
        )}
      </div>
    </div>
  )
}
