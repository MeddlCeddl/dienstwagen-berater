const BRAND_COLORS = {
  'BMW': {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-600',
    text: 'text-blue-700',
  },
  'Mercedes-Benz': {
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    badge: 'bg-gray-800',
    text: 'text-gray-700',
  },
  'Audi': {
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-600',
    text: 'text-red-700',
  },
  'VW': {
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    badge: 'bg-teal-700',
    text: 'text-teal-700',
  },
}

const RANK_LABELS = ['🥇 1. Empfehlung', '🥈 2. Empfehlung', '🥉 3. Empfehlung']

export default function CarCard({ car, rank }) {
  const colors = BRAND_COLORS[car.marke] ?? {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    badge: 'bg-indigo-600',
    text: 'text-indigo-700',
  }

  return (
    <div className={`rounded-xl border-2 ${colors.bg} ${colors.border} p-5 mb-4 shadow-sm`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className={`inline-block text-xs font-bold text-white ${colors.badge} px-2.5 py-1 rounded-full mb-2`}>
            {RANK_LABELS[rank] ?? `#${rank + 1}`}
          </span>
          <h3 className="text-lg font-bold text-gray-900">
            {car.marke} {car.modell}
          </h3>
        </div>
        <div className="text-right ml-4 shrink-0">
          <div className="text-xs text-gray-500 mb-0.5">Listenpreis</div>
          <div className={`text-base font-bold ${colors.text}`}>{car.listenpreis}</div>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-4 leading-relaxed">{car.begruendung}</p>

      {car.specs && car.specs.length > 0 && (
        <ul className="space-y-1.5">
          {car.specs.map((spec, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <span className={`mt-0.5 shrink-0 font-bold ${colors.text}`}>✓</span>
              <span>{spec}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
