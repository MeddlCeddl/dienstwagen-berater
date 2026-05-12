import { useState } from 'react'
import Chat from './components/Chat.jsx'

export default function App() {
  const [started, setStarted] = useState(false)

  if (started) {
    return <Chat onReset={() => setStarted(false)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🚗</div>
          <h1 className="text-2xl font-bold text-gray-900">Dienstwagen-Berater</h1>
          <p className="text-gray-500 mt-1 text-sm">Ihr persönlicher KI-Berater für Premiumfahrzeuge</p>
        </div>

        <div className="flex justify-center gap-6 mb-8">
          {['BMW', 'Mercedes', 'Audi', 'VW'].map((brand) => (
            <div key={brand} className="text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 border border-gray-200">
                {brand}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-xs text-blue-800">
          Basierend auf Ihren Anforderungen empfehle ich Ihnen exakt 3 Fahrzeuge aus unserem Portfolio – mit Preisen, Spezifikationen und persönlicher Begründung.
        </div>

        <button
          onClick={() => setStarted(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
        >
          Beratung starten →
        </button>
      </div>
    </div>
  )
}
