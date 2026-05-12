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

Zeige am Ende nach dem JSON-Block für jedes empfohlene Fahrzeug einen Konfigurator-Tag in dieser Form: [KONFIGURATOR:BMW], [KONFIGURATOR:MERCEDES], [KONFIGURATOR:AUDI] oder [KONFIGURATOR:VW] – das Frontend ersetzt diese Tags automatisch durch klickbare Konfigurator-Buttons.

Verwende immer echte aktuelle Preise. Stelle deine Fragen einzeln oder maximal zu zweit, damit das Gespräch natürlich wirkt. Sei professionell, freundlich und präzise. Kommuniziere ausschließlich auf Deutsch.`

const INITIAL_GREETING_DISPLAY = `Willkommen beim **Dienstwagen-Berater**

Ich helfe Ihnen dabei, das optimale Fahrzeug aus unserem Portfolio zu finden – von BMW, Mercedes-Benz, Audi und VW.

Um Ihnen die beste Empfehlung geben zu können, stelle ich Ihnen einige gezielte Fragen zu Ihren Anforderungen.

**Wie viele Kilometer fahren Sie ungefähr pro Jahr?**`

const INITIAL_GREETING_API = `Willkommen beim Dienstwagen-Berater!

Ich helfe Ihnen dabei, das optimale Fahrzeug aus unserem Portfolio zu finden – von BMW, Mercedes-Benz, Audi und VW.

Um Ihnen die beste Empfehlung geben zu können, stelle ich Ihnen einige gezielte Fragen zu Ihren Anforderungen.

Wie viele Kilometer fahren Sie ungefähr pro Jahr?`

const INITIAL_MESSAGES = [
  { id: 'initial', role: 'assistant', content: INITIAL_GREETING_DISPLAY, recommendations: null },
]

function parseRecommendations(text) {
  const m = text.match(/EMPFEHLUNGEN_JSON_START\s*([\s\S]*?)\s*EMPFEHLUNGEN_JSON_END/)
  if (m) {
    try { return JSON.parse(m[1].trim()).recommendations } catch {}
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
    .replace(/\[KONFIGURATOR:[A-Z-]+\]/g, '')
    .trim()
}

function ParsedLine({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="text-gold-light font-semibold">{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

function MessageText({ text }) {
  return (
    <div className="text-sm leading-relaxed space-y-1">
      {text.split('\n').map((line, i) => (
        <p key={i} className={line === '' ? 'h-2' : ''}>
          {line !== '' && <ParsedLine text={line} />}
        </p>
      ))}
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-5 animate-fadeIn max-w-2xl mx-auto">
      <AgentAvatar />
      <div
        className="rounded-2xl rounded-bl-sm px-5 py-4"
        style={{ background: '#16213e', border: '1px solid rgba(201,168,76,0.2)' }}
      >
        <div className="flex gap-2 items-center h-5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2.5 h-2.5 rounded-full animate-dotPulse"
              style={{ background: '#c9a84c', animationDelay: `${i * 0.22}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function AgentAvatar() {
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mb-1 font-lato tracking-wider"
      style={{
        background: 'linear-gradient(135deg, #c9a84c, #8a6f30)',
        color: '#1a1a2e',
        boxShadow: '0 2px 8px rgba(201,168,76,0.35)',
      }}
    >
      DB
    </div>
  )
}

function AgentBubble({ content }) {
  return (
    <div className="flex items-end gap-3">
      <AgentAvatar />
      <div
        className="max-w-[88%] sm:max-w-[78%] rounded-2xl rounded-bl-sm px-4 sm:px-5 py-3 sm:py-4"
        style={{
          background: '#16213e',
          border: '1px solid rgba(201,168,76,0.2)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          color: '#e8e8f0',
        }}
      >
        <MessageText text={content} />
      </div>
    </div>
  )
}

export default function Chat() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [error, setError] = useState('')
  const [sendHovered, setSendHovered] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText, loading])

  function resetChat() {
    setMessages(INITIAL_MESSAGES)
    setInput('')
    setError('')
    setStreamingText('')
    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system: SYSTEM_PROMPT, messages: apiMessages }),
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
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              fullText += parsed.delta.text
              setStreamingText(cleanText(fullText))
            }
          } catch {}
        }
      }

      const recs = parseRecommendations(fullText)
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: cleanText(fullText), recommendations: recs },
      ])
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

  const sendDisabled = loading || !input.trim()

  return (
    <div className="flex flex-col h-screen font-lato" style={{ background: '#1a1a2e' }}>

      {/* Header */}
      <header
        className="shrink-0 px-4 sm:px-6 py-3 flex items-center justify-between"
        style={{
          background: '#16213e',
          borderBottom: '1px solid rgba(201,168,76,0.25)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full" style={{ background: 'linear-gradient(to bottom, #c9a84c, #8a6f30)' }} />
          <div>
            <span className="font-playfair font-semibold text-sm sm:text-base tracking-wide" style={{ color: '#f0f0f0' }}>
              Dienstwagen-Berater
            </span>
            <div className="text-xs mt-0.5 font-light hidden sm:block" style={{ color: '#c9a84c', letterSpacing: '0.15em' }}>
              BMW · MERCEDES-BENZ · AUDI · VW
            </div>
          </div>
        </div>
        <button
          onClick={resetChat}
          className="text-xs font-light px-3 sm:px-4 py-1.5 rounded transition-all duration-200 hover:scale-105"
          style={{ color: '#c9a84c', border: '1px solid rgba(201,168,76,0.4)', letterSpacing: '0.05em' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(201,168,76,0.12)'
            e.currentTarget.style.borderColor = 'rgba(201,168,76,0.8)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'
          }}
        >
          Neu starten
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-5 sm:py-6 px-3 sm:px-4">
        {messages.map((msg, idx) => (
          <div
            key={msg.id}
            className="mb-5 animate-fadeInUp"
            style={{ animationDelay: `${idx * 0.06}s`, opacity: 0 }}
          >
            {msg.role === 'assistant' ? (
              <>
                {/* Text bubble – narrow container */}
                <div className="max-w-2xl mx-auto">
                  <AgentBubble content={msg.content} />
                </div>

                {/* Cards grid – wide container for multi-column layout */}
                {msg.recommendations && (
                  <div className="max-w-4xl mx-auto mt-4 px-0 sm:px-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {msg.recommendations.map((car, i) => (
                        <CarCard key={i} car={car} rank={i} />
                      ))}
                    </div>
                    <p
                      className="text-xs text-center mt-3 font-light"
                      style={{ color: 'rgba(201,168,76,0.5)', letterSpacing: '0.05em' }}
                    >
                      Wählen Sie im Konfigurator Ihr gewünschtes Modell und Ihre Wunschfarbe
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* User bubble */
              <div className="max-w-2xl mx-auto flex justify-end">
                <div
                  className="max-w-[88%] sm:max-w-[72%] rounded-2xl rounded-br-sm px-4 sm:px-5 py-3 sm:py-4"
                  style={{
                    background: 'linear-gradient(135deg, #c9a84c, #a8843a)',
                    color: '#1a1a2e',
                    boxShadow: '0 2px 14px rgba(201,168,76,0.28)',
                  }}
                >
                  <p className="text-sm leading-relaxed font-medium">{msg.content}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && !streamingText && <TypingIndicator />}

        {/* Streaming bubble */}
        {loading && streamingText && (
          <div className="mb-5 animate-fadeIn max-w-2xl mx-auto">
            <div className="flex items-end gap-3">
              <AgentAvatar />
              <div
                className="max-w-[88%] sm:max-w-[78%] rounded-2xl rounded-bl-sm px-4 sm:px-5 py-3 sm:py-4"
                style={{
                  background: '#16213e',
                  border: '1px solid rgba(201,168,76,0.2)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                  color: '#e8e8f0',
                }}
              >
                <MessageText text={streamingText} />
                <span
                  className="inline-block w-0.5 h-4 ml-0.5 align-text-bottom animate-blink"
                  style={{ background: '#c9a84c' }}
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div
            className="text-sm rounded-xl px-5 py-3 mb-5 animate-fadeIn max-w-2xl mx-auto"
            style={{
              background: 'rgba(180,40,40,0.15)',
              border: '1px solid rgba(180,40,40,0.4)',
              color: '#ff8080',
            }}
          >
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        className="shrink-0 px-3 sm:px-4 py-3 sm:py-4"
        style={{
          background: '#16213e',
          borderTop: '1px solid rgba(201,168,76,0.2)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <div className="max-w-2xl mx-auto flex gap-2 sm:gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ihre Antwort …"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none outline-none transition-all duration-200 rounded-xl px-4 py-3 sm:py-3 text-base sm:text-sm font-lato"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(201,168,76,0.25)',
              color: '#f0f0f0',
              maxHeight: '120px',
              caretColor: '#c9a84c',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(201,168,76,0.7)' }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(201,168,76,0.25)' }}
            onInput={(e) => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={sendDisabled}
            onMouseEnter={() => setSendHovered(true)}
            onMouseLeave={() => setSendHovered(false)}
            className="shrink-0 px-4 sm:px-5 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200"
            style={{
              background: sendDisabled
                ? 'rgba(201,168,76,0.18)'
                : 'linear-gradient(135deg, #c9a84c, #a8843a)',
              color: sendDisabled ? 'rgba(201,168,76,0.35)' : '#1a1a2e',
              cursor: sendDisabled ? 'not-allowed' : 'pointer',
              boxShadow: !sendDisabled && sendHovered
                ? '0 4px 16px rgba(201,168,76,0.45)'
                : !sendDisabled
                ? '0 2px 10px rgba(201,168,76,0.3)'
                : 'none',
              transform: !sendDisabled && sendHovered ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            Senden
          </button>
        </div>
        <p
          className="text-center text-xs mt-2 font-light hidden sm:block"
          style={{ color: 'rgba(201,168,76,0.3)', letterSpacing: '0.05em' }}
        >
          Enter zum Senden · Shift+Enter für neue Zeile
        </p>
      </div>
    </div>
  )
}
