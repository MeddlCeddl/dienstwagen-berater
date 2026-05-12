# Design System – Dienstwagen-Berater

## Farb-Palette

| Variable | Hex | Tailwind-Klasse | Verwendung |
|---|---|---|---|
| Basis-Hintergrund | `#1a1a2e` | `bg-primary` | App-Hintergrund, Body |
| Surface | `#16213e` | `bg-surface` | Cards, Header, Input-Bar, Agent-Bubbles |
| Surface Tief | `#0f1a30` | `bg-surface-2` | Card-Gradient-Ende |
| Gold | `#c9a84c` | `text-gold`, `bg-gold` | Akzente, User-Bubble-Gradient, Preise, Borders |
| Gold Hell | `#e8c97e` | `text-gold-light` | Bold-Text in Agent-Bubbles |
| Gold Gedimmt | `#8a6f30` | `text-gold-dim` | Gradient-Ende für Avatar, Akzent-Linie |
| Text Primär | `#f0f0f0` | — | Überschriften, wichtiger Text |
| Text Sekundär | `#e8e8f0` | — | Agent-Bubble-Fließtext |
| Text Gedimmt | `#b0b0c0` | — | Modellname unter Markenname |
| Text Muted | `#b8b8cc` | — | Begründungstext in Cards |
| Text Specs | `#c8c8dc` | — | Spec-Liste in Cards |

### Marken-Akzentfarben (nur in CarCard)

| Marke | Akzent | Dim-Hintergrund | Border |
|---|---|---|---|
| BMW | `#4a90d9` | `rgba(74,144,217,0.12)` | `rgba(74,144,217,0.32)` |
| Mercedes-Benz | `#b8b8b8` | `rgba(184,184,184,0.10)` | `rgba(184,184,184,0.28)` |
| Audi | `#e0303a` | `rgba(224,48,58,0.12)` | `rgba(224,48,58,0.32)` |
| VW | `#1e9bd7` | `rgba(30,155,215,0.12)` | `rgba(30,155,215,0.32)` |

## Typografie

Google Fonts werden in `index.html` per Preconnect + Link geladen:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@300;400;700&display=swap" rel="stylesheet" />
```

| Font | Klasse | Verwendung |
|---|---|---|
| Playfair Display | `font-playfair` | Headlines (App-Titel, Markenname in Card, Preis) |
| Lato | `font-lato` | Alles andere (Body, Buttons, Labels, Input) |

Tailwind-Konfiguration in `tailwind.config.js`:
```js
fontFamily: {
  playfair: ['"Playfair Display"', 'serif'],
  lato: ['Lato', 'sans-serif'],
}
```

Body-Default ist Lato (gesetzt in `src/index.css` via `@layer base`).

## Tailwind Custom Tokens

Alle Custom-Tokens sind in `tailwind.config.js` unter `theme.extend` definiert:

```js
colors: {
  primary: '#1a1a2e',
  surface: '#16213e',
  'surface-2': '#0f3460',
  gold: '#c9a84c',
  'gold-light': '#e8c97e',
  'gold-dim': '#8a6f30',
}
```

## Animationen

Definiert in `tailwind.config.js` unter `theme.extend.keyframes` und `theme.extend.animation`:

| Klasse | Effekt | Einsatz |
|---|---|---|
| `animate-fadeInUp` | opacity 0→1, translateY 14px→0, 0.45s ease forwards | Jede neue Chat-Nachricht, CarCards |
| `animate-fadeIn` | opacity 0→1, 0.35s ease forwards | Streaming-Bubble, Typing-Indicator, Fehler |
| `animate-blink` | opacity 1↔0, step-end, 1s | Streaming-Cursor (goldener Strich) |
| `animate-dotPulse` | scale 0.6→1.2, opacity 0.3→1, 1.3s ease-in-out infinite | Typing-Indicator-Punkte |

### Staggered Delays

**Chat-Blasen** (`Chat.jsx`): `animationDelay: idx * 0.06 + 's'`
— jede Nachricht erscheint 60ms nach der vorherigen.

**CarCards** (`CarCard.jsx`): `animationDelay: 0.08 + rank * 0.13 + 's'`
— Cards erscheinen gestaffelt: 80ms, 210ms, 340ms.

**Typing-Dots**: `animationDelay: i * 0.22 + 's'`
— drei Punkte pulsen mit 220ms Versatz.

## Hover-Effekte

Alle Hover-Effekte werden via React-State + Inline-Style-Transitions umgesetzt (kein CSS-in-JS, keine Extra-Libraries).

### Fahrzeug-Card (CarCard.jsx)
```jsx
const [cardHovered, setCardHovered] = useState(false)

style={{
  transform: cardHovered ? 'translateY(-4px)' : 'translateY(0)',
  boxShadow: cardHovered
    ? `0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px ${cfg.accentBorder}, 0 4px 20px ${cfg.glowHover}`
    : `0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 ${cfg.accentBorder}`,
  border: `1px solid ${cardHovered ? cfg.accent : cfg.accentBorder}`,
  transition: 'transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease',
}}
```

### Konfigurator-Button (CarCard.jsx)
```jsx
const [btnHovered, setBtnHovered] = useState(false)

style={{
  transform: btnHovered ? 'scale(1.03)' : 'scale(1)',
  background: btnHovered ? cfg.accentHover : cfg.accentDim,
  boxShadow: btnHovered ? `0 4px 14px ${cfg.glowHover}` : 'none',
  transition: 'transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
}}
// Pfeil-Icon bewegt sich zusätzlich: translateX(3px) bei Hover
```

### Senden-Button (Chat.jsx)
```jsx
const [sendHovered, setSendHovered] = useState(false)

style={{
  transform: !sendDisabled && sendHovered ? 'scale(1.05)' : 'scale(1)',
  boxShadow: !sendDisabled && sendHovered
    ? '0 4px 16px rgba(201,168,76,0.45)'
    : '0 2px 10px rgba(201,168,76,0.3)',
  transition: 'all 0.2s ease',
}}
```

### Neu-starten-Button (Chat.jsx)
Tailwind `hover:scale-105` + `transition-all duration-200` in `className`.
Background/Border via `onMouseEnter`/`onMouseLeave`.

## Responsive-Breakpoints

Das Projekt verwendet Standard-Tailwind-Breakpoints:

| Breakpoint | Breite | Verhalten |
|---|---|---|
| default (mobile) | < 640px | 1-spaltige Cards, volle Bubble-Breite (88%), `text-base` im Input, Header-Subtitle ausgeblendet |
| `sm` | ≥ 640px | Subtitle im Header sichtbar, Padding/Gap-Abstände normalisiert |
| `md` | ≥ 768px | 2-spaltige CarCard-Grid |
| `xl` | ≥ 1280px | 3-spaltige CarCard-Grid |

### Container-Breiten

| Bereich | Container | Begründung |
|---|---|---|
| Chat-Nachrichten (Text-Bubbles) | `max-w-2xl` (672px) | Optimale Lesbarkeit für Chat |
| CarCards-Grid | `max-w-4xl` (896px) | Platz für 3-spaltiges Layout |
| Agent-Bubble | `max-w-[88%] sm:max-w-[78%]` | Prozentual, passt zu Avatar-Offset |
| User-Bubble | `max-w-[88%] sm:max-w-[72%]` | Etwas schmaler als Agent |

## Scrollbar

Benutzerdefinierter goldener Scrollbar in `src/index.css`:
```css
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: #1a1a2e; }
::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.3); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(201,168,76,0.6); }
```

## Komponenten-Übersicht

### AgentAvatar
Goldener Gradient-Kreis mit „DB"-Initialen. Kein Emoji (premium).
```jsx
background: 'linear-gradient(135deg, #c9a84c, #8a6f30)'
color: '#1a1a2e'
boxShadow: '0 2px 8px rgba(201,168,76,0.35)'
```

### Agent-Bubble
`background: '#16213e'`, Border `rgba(201,168,76,0.2)`, abgerundete Ecken `rounded-2xl rounded-bl-sm`.

### User-Bubble
`background: 'linear-gradient(135deg, #c9a84c, #a8843a)'`, Text `#1a1a2e`, `rounded-2xl rounded-br-sm`.

### CarCard Aufbau (von oben nach unten)
1. Farbiger Akzent-Strich (h-0.5, Gradient)
2. Brand-Badge + Rang-Label + Marken/Modell-Name + Preis
3. Trennlinie
4. Begründungstext
5. Spec-Liste mit `◆`-Bullets in Markenfarbe
6. Konfigurator-Button

## Neue Elemente hinzufügen

**Neue Marke hinzufügen** → `BRAND_CONFIG` in `CarCard.jsx` erweitern:
```js
'Porsche': {
  accent: '#c00',
  accentDim: 'rgba(200,0,0,0.12)',
  accentBorder: 'rgba(200,0,0,0.32)',
  accentHover: 'rgba(200,0,0,0.28)',
  glowHover: 'rgba(200,0,0,0.15)',
  configuratorUrl: 'https://...',
}
```
Auch im `SYSTEM_PROMPT` in `Chat.jsx` ergänzen.

**Neue Animation** → In `tailwind.config.js` unter `keyframes` + `animation` eintragen, dann als `animate-*`-Klasse verwenden.

**Neue Custom-Farbe** → In `tailwind.config.js` unter `theme.extend.colors` eintragen.
