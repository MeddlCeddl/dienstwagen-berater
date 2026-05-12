import { useState } from 'react'
import Chat from './components/Chat.jsx'

const ENV_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY ?? ''

export default function App() {
  const [apiKey, setApiKey] = useState('')
  const [submittedKey, setSubmittedKey] = useState(ENV_API_KEY)
  const [error, setError] = useState('')

  if (submittedKey) {
    return <Chat apiKey={submittedKey} onReset={() => setSubmittedKey(ENV_API_KEY)} />
  }

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = apiKey.trim()
    if (!trimmed.startsWith('sk-ant-')) {
      setError('Bitte gib einen gültigen Anthropic API-Schlüssel ein (beginnt mit sk-ant-).')
      return
    }
    setError('')
    setSubmittedKey(trimmed)
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

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-xs text-amber-800">
          <strong>Hinweis:</strong> Dein API-Schlüssel wird nur lokal in dieser Sitzung verwendet und nicht gespeichert.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anthropic API-Schlüssel
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setError('') }}
              placeholder="sk-ant-..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoComplete="off"
            />
            {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
          >
            Beratung starten →
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          API-Schlüssel erhältlich auf{' '}
          <span className="text-blue-500">console.anthropic.com</span>
        </p>
      </div>
    </div>
  )
}
