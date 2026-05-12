# API & Proxy – Dienstwagen-Berater

## Architektur-Überblick

```
Browser (React SPA)
    │
    │  POST /api/chat
    │  { system, messages }
    ▼
Vercel Serverless Function
    /api/chat.js
    │
    │  POST https://api.anthropic.com/v1/messages
    │  x-api-key: process.env.ANTHROPIC_API_KEY
    │  stream: true
    ▼
Anthropic Claude API
    │
    │  SSE Stream (text/event-stream)
    ▼
Vercel Function → Browser
    (Stream wird 1:1 durchgeleitet)
```

**Warum Proxy?** Direkte Browser-Aufrufe zu `api.anthropic.com` werden von CORS geblockt. Die Serverless Function läuft serverseitig – kein CORS, kein exponierter API-Key im Client-Bundle.

## Serverless Function: `/api/chat.js`

### Vollständiger Code

```js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured on server' })
  }

  const { messages, system } = req.body

  let anthropicRes
  try {
    anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        stream: true,
        system,
        messages,
      }),
    })
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach Anthropic API' })
  }

  if (!anthropicRes.ok) {
    const errBody = await anthropicRes.json().catch(() => ({}))
    return res.status(anthropicRes.status).json(errBody)
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const reader = anthropicRes.body.getReader()
  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(decoder.decode(value, { stream: true }))
    }
  } finally {
    res.end()
  }
}
```

### Parameter

| Feld | Typ | Beschreibung |
|---|---|---|
| `messages` | Array | Conversation-History im Anthropic-Format |
| `system` | String | System-Prompt (wird vom Frontend übergeben) |

### Verwendetes Modell

`claude-sonnet-4-6` — das aktuelle Claude Sonnet 4.6 Modell.

Modell ändern: In `/api/chat.js` Zeile `model: 'claude-sonnet-4-6'` anpassen.
Optionen: `claude-opus-4-7` (leistungsstärker, teurer), `claude-haiku-4-5` (schneller, günstiger).

### max_tokens

Aktuell `2048`. Erhöhen wenn Empfehlungstexte abgeschnitten werden. Vercel Serverless Functions haben ein Timeout von 10s (Hobby-Plan) bzw. 60s (Pro-Plan) – bei langen Antworten ggf. Pro nötig.

## Frontend-Aufruf in `Chat.jsx`

```js
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    system: SYSTEM_PROMPT,
    messages: apiMessages,
  }),
})
```

Kein API-Key im Frontend. Kein CORS-Header nötig (gleiche Origin).

## Conversation History Aufbau

### Fake Initial Context

Die Anthropic API erfordert, dass die Conversation mit einer `user`-Nachricht beginnt. Da die App mit einer hartcodierten Agent-Begrüßung startet (ohne echten API-Aufruf), wird ein virtuelles Eröffnungspaar vorangestellt:

```js
const apiMessages = [
  // Virtuelles Eröffnungspaar (nie gespeichert, immer vorangestellt)
  { role: 'user', content: 'Bitte starten Sie die Dienstwagenberatung.' },
  { role: 'assistant', content: INITIAL_GREETING_API },

  // Echte Conversation ab der ersten User-Eingabe
  ...newMessages
    .filter((m) => m.id !== 'initial')   // initial-Nachricht ist nur für die UI
    .map((m) => ({ role: m.role, content: m.content })),
]
```

`INITIAL_GREETING_API` ist die Plain-Text-Version der Begrüßung (ohne `**bold**`-Markdown, da die API keinen Markdown-Parser hat).

### Nachrichtenformat

Jede Nachricht im State hat:
```js
{
  id: string,          // 'initial' | Date.now().toString()
  role: 'user' | 'assistant',
  content: string,     // Gereinigter Text (ohne JSON-Blöcke, ohne [KONFIGURATOR:*]-Tags)
  recommendations: Array | null,  // Geparste CarCard-Daten, nur bei letzter Assistant-Nachricht
}
```

## SSE Streaming

Die Antwort der Serverless Function ist ein Server-Sent Events Stream.

### Browser-seitiges Parsing in `Chat.jsx`

```js
const decoder = new TextDecoder()
const reader = response.body.getReader()
let fullText = ''
let buffer = ''

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  // Buffer akkumuliert incomplete Lines
  buffer += decoder.decode(value, { stream: true })
  const lines = buffer.split('\n')
  buffer = lines.pop() ?? ''  // Letzte (ggf. unvollständige) Zeile zurückhalten

  for (const line of lines) {
    if (!line.trim().startsWith('data: ')) continue
    const data = line.trim().slice(6)
    if (data === '[DONE]') continue

    try {
      const parsed = JSON.parse(data)
      if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
        fullText += parsed.delta.text
        setStreamingText(cleanText(fullText))  // Live-Update der UI
      }
    } catch {}
  }
}
```

**Warum Buffer?** SSE-Chunks können mitten in einer Zeile enden. `lines.pop()` hält die letzte unvollständige Zeile für den nächsten Chunk zurück.

## System Prompt

### Aktueller Prompt (in `Chat.jsx` als `SYSTEM_PROMPT`)

Der Prompt steuert das Verhalten des Beraters:
1. **Fragephase**: Maximal 4–5 Fragen zu Fahrleistung, Nutzung, Prioritäten, Antrieb, Budget
2. **Empfehlungsphase**: Exakt 3 Fahrzeuge aus BMW/Mercedes-Benz/Audi/VW
3. **Ausgabeformat**: Strukturiertes JSON zwischen Delimiter-Tags + Konfigurator-Tags

### Structured Output mit Delimiter-Tags

Der Prompt instruiert Claude, Empfehlungen in einem exakten Format auszugeben:

```
EMPFEHLUNGEN_JSON_START
{
  "recommendations": [
    {
      "marke": "BMW",
      "modell": "5er Touring",
      "listenpreis": "ab 62.000 €",
      "begruendung": "Ideal für lange Strecken...",
      "specs": ["Spec 1", "Spec 2", "Spec 3"]
    },
    ...
  ]
}
EMPFEHLUNGEN_JSON_END
```

**Warum keine native Structured Outputs?** Delimiter-Tags sind robuster bei Streaming — JSON-Parsing kann erst nach Abschluss des Streams erfolgen, während Delimiter-Tags auch bei partieller Ausgabe erkannt werden.

### Parser in `Chat.jsx`

```js
function parseRecommendations(text) {
  // Primär: Delimiter-Tags
  const m = text.match(/EMPFEHLUNGEN_JSON_START\s*([\s\S]*?)\s*EMPFEHLUNGEN_JSON_END/)
  if (m) {
    try { return JSON.parse(m[1].trim()).recommendations } catch {}
  }
  // Fallback: Markdown Code-Block
  const cm = text.match(/```json\s*([\s\S]*?)\s*```/)
  if (cm) {
    try {
      const d = JSON.parse(cm[1].trim())
      if (d.recommendations) return d.recommendations
    } catch {}
  }
  return null
}
```

### Text-Bereinigung

```js
function cleanText(text) {
  return text
    .replace(/EMPFEHLUNGEN_JSON_START[\s\S]*?EMPFEHLUNGEN_JSON_END/g, '')
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/\[KONFIGURATOR:[A-Z-]+\]/g, '')  // Konfigurator-Tags entfernen
    .trim()
}
```

Der gereinigte Text wird in der Chat-Blase angezeigt. Die strukturierten Daten werden separat als CarCards gerendert.

## System Prompt anpassen

### Fragen ändern oder ergänzen

Im `SYSTEM_PROMPT` in `Chat.jsx` die nummerierten Punkte bearbeiten:

```js
const SYSTEM_PROMPT = `...
Du stellst maximal 4-5 gezielte Fragen, um folgende Informationen zu ermitteln:
1. Jährliche Fahrleistung (km/Jahr)
2. Hauptnutzung (Stadtverkehr, Langstrecke, gemischt)
3. ...neue Frage hier...
...`
```

### Weitere Marken erlauben

1. System Prompt anpassen: `"...aus folgenden Marken: BMW, Mercedes-Benz, Audi, VW, Porsche"`
2. `BRAND_CONFIG` in `CarCard.jsx` um die neue Marke erweitern (siehe `design.md`)

### Mehr oder weniger Empfehlungen

System Prompt: `"...gibst du exakt 3 Fahrzeugempfehlungen..."` auf gewünschte Zahl ändern.

### JSON-Schema erweitern

Dem Prompt-Beispiel neue Felder hinzufügen:
```json
{
  "marke": "BMW",
  "modell": "...",
  "listenpreis": "...",
  "begruendung": "...",
  "specs": [...],
  "co2": "142 g/km",          // Neues Feld
  "reichweite_km": 650         // Neues Feld
}
```
Dann in `CarCard.jsx` die neuen Felder rendern: `car.co2`, `car.reichweite_km`.

### Sprache ändern

Letzter Satz im Prompt: `"Kommuniziere ausschließlich auf Deutsch."` anpassen.

### Ton/Stil anpassen

Erste Zeile des Prompts beschreibt die Persona:
```
Du bist ein professioneller Dienstwagen-Berater...
```
Kann in jede Rolle geändert werden.

## Konfigurator-Links

Die `[KONFIGURATOR:MARKE]`-Tags werden vom System Prompt ausgegeben, aber im Frontend von `cleanText()` aus dem angezeigten Text entfernt. Die Buttons werden stattdessen direkt in `CarCard.jsx` anhand der `marke`-Eigenschaft aus dem JSON generiert.

Aktuelle URLs in `CarCard.jsx` unter `BRAND_CONFIG[marke].configuratorUrl`:

| Marke | URL |
|---|---|
| BMW | https://www.bmw.de/de/neufahrzeuge/konfigurator.html |
| Mercedes-Benz | https://www.mercedes-benz.de/passengercars/configurator.html |
| Audi | https://www.audi.de/de/brand/de/neuwagen/konfigurator.html |
| VW | https://www.volkswagen.de/de/models/konfigurator.html |

URL ändern: In `BRAND_CONFIG` in `CarCard.jsx` den `configuratorUrl`-Wert anpassen.

## Fehlerbehandlung

| Fehlerfall | Verhalten |
|---|---|
| `ANTHROPIC_API_KEY` fehlt auf Server | 500 + JSON-Fehlermeldung |
| Anthropic nicht erreichbar | 502 + "Failed to reach Anthropic API" |
| Anthropic gibt Fehler zurück (z.B. 401, 529) | HTTP-Status + Anthropic-Fehlerbody weitergeleitet |
| JSON-Parse-Fehler im Parser | `try/catch` silently, `null` zurückgegeben → keine CarCards |
| SSE-Parsing-Fehler | `try/catch` silently, fehlerhafte Chunks werden übersprungen |

Fehler werden in `Chat.jsx` als rote Fehlerbox angezeigt:
```js
} catch (err) {
  setError(`Fehler: ${err.message}`)
}
```
