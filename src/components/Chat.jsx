import { useState, useRef, useEffect } from 'react'
import CarCard from './CarCard.jsx'

const SYSTEM_PROMPT = `Du bist ein professioneller Dienstwagen-Berater für den deutschen Markt. Deine Aufgabe ist es, Mitarbeitern dabei zu helfen, das optimale Fahrzeug aus dem Dienstwagenportfolio zu wählen.

Du stellst maximal 4-5 gezielte Fragen, um folgende Informationen zu ermitteln:
1. Jährliche Fahrleistung (km/Jahr)
2. Hauptnutzung (Stadtverkehr, Langstrecke, gemischt)
3. Wichtigste Prioritäten (z.B. Effizienz, Prestige, Komfort, Sportlichkeit, Laderaum)
4. Antriebspräferenz (Verbrenner, Hybrid, Elektro)
5. Budgetrahmen (Listenpreis)

Nach den Fragen gibst du exakt 3 Fahrzeugempfehlungen aus folgenden Marken: BMW, Mercedes-Benz, Audi, VW.

Sobald du alle nötigen Informationen gesammelt hast, antworte mit einem kurzen einleitenden Text auf Deutsch, gefolgt von diesem exakten Block:

EMPFEHLUNGEN_JSON_START
{
  "recommendations": [
    {
      "marke": "BMW",
      "modell": "3er Touring",
      "listenpreis": "ab 45.000 €",
      "begruendung": "Begründung warum dieses Auto passt...",
      "specs": ["Spec 1", "Spec 2", "Spec 3"]
    },
    {
      "marke": "Mercedes-Benz",
      "modell": "C-Klasse",
      "listenpreis": "ab 47.000 €",
      "begruendung": "Begründung...",
      "specs": ["Spec 1", "Spec 2", "Spec 3"]
    },
    {
      "marke": "Audi",
      "modell": "A4 Avant",
      "listenpreis": "ab 44.000 €",
      "begruendung": "Begründung...",
      "specs": ["Spec 1", "Spec 2", "Spec 3"]
    }
  ]
}
EMPFEHLUNGEN_JSON_END

Verwende immer echte aktuelle Preise. Stelle deine Fragen einzeln oder maximal zu zweit, damit das Gespräch natürlich wirkt. Sei professionell, freundlich und präzise. Kommuniziere ausschließlich auf Deutsch.`

const INITIAL_GREETING_DISPLAY = `Willkommen beim **Dienstwagen-Berater**! 🚗

Ich helfe Ihnen dabei, das optimale Fahrzeug aus unserem Portfolio zu finden – von BMW, Mercedes-Benz, Audi und VW.

Um Ihnen die beste Empfehlung geben zu können, stelle ich Ihnen zunächst einige gezielte Fragen zu Ihren Anforderungen.

**Wie viele Kilometer fahren Sie ungefähr pro Jahr?**`

const INITIAL_GREETING_API = `Willkommen beim Dienstwagen-Berater! 🚗

Ich helfe Ihnen dabei, das optimale Fahrzeug aus unserem Portfolio zu finden – von BMW, Mercedes-Benz, Audi und VW.

Um Ihnen die beste Empfehlung geben zu können, stelle ich Ihnen zunächst einige gezielte Fragen zu Ihren Anforderungen.

Wie viele Kilometer fahren Sie ungefähr pro Jahr?`

function parseRecommendations(text) {
  const m = text.match(/EMPFEHLUNGEN_JSON_START\s*([\s\S]*?)\s*EMPFEHLUNGEN_JSON_END/)
  if (m) {
    try {
      return JSON.parse(m[1].trim()).recommendations
    } catch {}
  }
  const cm = text.match(/```json\s*([\s\S]*?)\s*```/)
  if (cm) {
    try {
      const d = JSON.parse(cm[1].trim())
      if (d.recommendations) return d.recommendations
    } catch {}
  }
  return null
}

function cleanText(text) {
  return text
    .replace(/EMPFEHLUNGEN_JSON_START[\s\S]*?EMPFEHLUNGEN_JSON_END/g, '')
    .replace(/```json[\s\S]*?```/g, '')
    .trim()
}

function ParsedLine({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

function MessageText({ text }) {
  const lines = text.split('\n')
  return (
    <div className="text-sm leading-relaxed space-y-1">
      {lines.map((line, i) => (
        <p key={i} className={line === '' ? 'h-2' : ''}>
          {line !== '' && <ParsedLine text={line} />}
        </p>
      ))}
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <AgentAvatar />
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function AgentAvatar() {
  return (
    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm shrink-0 mb-1">
      🤖
    </div>
  )
}

export default function Chat({ onReset }) {
  const [messages, setMessages] = useState([
    {
      id: 'initial',
      role: 'assistant',
      content: INITIAL_GREETING_DISPLAY,
      recommendations: null,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText, loading])

  async function sendMessage() {
    const userText = input.trim()
    if (!userText || loading) return

    setInput('')
    setError('')

    const userMsg = { id: Date.now().toString(), role: 'user', content: userText }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)
    setStreamingText('')

    const apiMessages = [
      { role: 'user', content: 'Bitte starten Sie die Dienstwagenberatung.' },
      { role: 'assistant', content: INITIAL_GREETING_API },
      ...newMessages
        .filter((m) => m.id !== 'initial')
        .map((m) => ({ role: m.role, content: m.content })),
    ]

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system: SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData?.error?.message ?? `HTTP ${response.status}`)
      }

      const decoder = new TextDecoder()
      const reader = response.body.getReader()
      let fullText = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.trim().startsWith('data: ')) continue
          const data = line.trim().slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (
              parsed.type === 'content_block_delta' &&
              parsed.delta?.type === 'text_delta'
            ) {
              fullText += parsed.delta.text
              setStreamingText(cleanText(fullText))
            }
          } catch {}
        }
      }

      const recs = parseRecommendations(fullText)
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanText(fullText),
        recommendations: recs,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      setError(`Fehler: ${err.message}`)
    } finally {
      setLoading(false)
      setStreamingText('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-lg">
            🚗
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm leading-tight">Dienstwagen-Berater</div>
            <div className="text-xs text-gray-500">BMW · Mercedes-Benz · Audi · VW</div>
          </div>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors"
        >
          Neu starten
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-2xl w-full mx-auto">
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === 'assistant' ? (
              <div className="flex items-end gap-2 mb-4">
                <AgentAvatar />
                <div className="max-w-[85%]">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <MessageText text={msg.content} />
                  </div>
                  {msg.recommendations && (
                    <div className="mt-4">
                      {msg.recommendations.map((car, i) => (
                        <CarCard key={i} car={car} rank={i} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex justify-end mb-4">
                <div className="max-w-[75%] bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-3 shadow-sm">
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Streaming message */}
        {loading && !streamingText && <TypingIndicator />}
        {loading && streamingText && (
          <div className="flex items-end gap-2 mb-4">
            <AgentAvatar />
            <div className="max-w-[85%] bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <MessageText text={streamingText} />
              <span className="inline-block w-1.5 h-4 bg-blue-500 animate-pulse ml-0.5 align-text-bottom" />
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 shrink-0">
        <div className="max-w-2xl mx-auto flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ihre Antwort..."
            rows={1}
            disabled={loading}
            className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
            style={{ maxHeight: '120px' }}
            onInput={(e) => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl transition-colors font-medium text-sm shrink-0"
          >
            Senden
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">Enter zum Senden · Shift+Enter für neue Zeile</p>
      </div>
    </div>
  )
}
