const BRAND_CONFIG = {
  'BMW': {
    accent: '#4a90d9',
    accentDim: 'rgba(74,144,217,0.15)',
    accentBorder: 'rgba(74,144,217,0.35)',
    configuratorKey: 'BMW',
    configuratorUrl: 'https://www.bmw.de/de/neufahrzeuge/konfigurator.html',
  },
  'Mercedes-Benz': {
    accent: '#b8b8b8',
    accentDim: 'rgba(184,184,184,0.12)',
    accentBorder: 'rgba(184,184,184,0.3)',
    configuratorKey: 'MERCEDES',
    configuratorUrl: 'https://www.mercedes-benz.de/passengercars/configurator.html',
  },
  'Audi': {
    accent: '#e0303a',
    accentDim: 'rgba(224,48,58,0.15)',
    accentBorder: 'rgba(224,48,58,0.35)',
    configuratorKey: 'AUDI',
    configuratorUrl: 'https://www.audi.de/de/brand/de/neuwagen/konfigurator.html',
  },
  'VW': {
    accent: '#1e9bd7',
    accentDim: 'rgba(30,155,215,0.15)',
    accentBorder: 'rgba(30,155,215,0.35)',
    configuratorKey: 'VW',
    configuratorUrl: 'https://www.volkswagen.de/de/models/konfigurator.html',
  },
}

const RANK_LABELS = ['1. Empfehlung', '2. Empfehlung', '3. Empfehlung']

const DEFAULT_CONFIG = {
  accent: '#c9a84c',
  accentDim: 'rgba(201,168,76,0.12)',
  accentBorder: 'rgba(201,168,76,0.3)',
  configuratorUrl: null,
}

export default function CarCard({ car, rank }) {
  const cfg = BRAND_CONFIG[car.marke] ?? DEFAULT_CONFIG

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #16213e 0%, #0f1a30 100%)',
        border: `1px solid ${cfg.accentBorder}`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 ${cfg.accentBorder}`,
      }}
    >
      {/* Top accent bar */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(to right, ${cfg.accent}, transparent)` }} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Brand badge */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 font-lato tracking-wider"
              style={{
                background: cfg.accentDim,
                border: `1px solid ${cfg.accentBorder}`,
                color: cfg.accent,
              }}
            >
              {car.marke === 'Mercedes-Benz' ? 'MB' : car.marke.slice(0, 3).toUpperCase()}
            </div>
            <div>
              <div
                className="text-xs font-light tracking-widest mb-0.5"
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

          {/* Price */}
          <div className="text-right ml-3 shrink-0">
            <div
              className="text-xs font-light tracking-wider mb-0.5"
              style={{ color: 'rgba(201,168,76,0.5)', letterSpacing: '0.1em' }}
            >
              LISTENPREIS
            </div>
            <div className="font-playfair font-semibold text-base" style={{ color: '#c9a84c' }}>
              {car.listenpreis}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-4 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* Justification */}
        <p className="text-sm leading-relaxed mb-4 font-light" style={{ color: '#b8b8cc' }}>
          {car.begruendung}
        </p>

        {/* Specs */}
        {car.specs && car.specs.length > 0 && (
          <ul className="space-y-2 mb-5">
            {car.specs.map((spec, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: '#c8c8dc' }}>
                <span
                  className="shrink-0 mt-0.5 text-xs"
                  style={{ color: cfg.accent }}
                >
                  ◆
                </span>
                <span className="font-light">{spec}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Configurator button */}
        {cfg.configuratorUrl && (
          <a
            href={cfg.configuratorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 no-underline"
            style={{
              background: cfg.accentDim,
              border: `1px solid ${cfg.accentBorder}`,
              color: cfg.accent,
              letterSpacing: '0.04em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = cfg.accentBorder
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = cfg.accentDim
            }}
          >
            Jetzt konfigurieren
            <span style={{ fontSize: '0.85em' }}>→</span>
          </a>
        )}
      </div>
    </div>
  )
}
