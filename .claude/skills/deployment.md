# Deployment – Dienstwagen-Berater

## Projekt-Übersicht

- **Framework**: React 18 + Vite 5
- **Styling**: Tailwind CSS v3
- **Backend**: Vercel Serverless Function (`/api/chat.js`)
- **Hosting**: Vercel (Static SPA + Serverless)
- **Repository**: https://github.com/MeddlCeddl/dienstwagen-berater
- **Branch**: `master`

## Lokale Entwicklung

### Voraussetzungen

Node.js und npm müssen installiert sein. Pfad auf diesem System:
- Node.js: `C:\Program Files\nodejs\` (im System-PATH, aber nicht im Claude-Session-PATH)
- Beim direkten Ausführen vollständigen Pfad verwenden oder ein normales Terminal öffnen

### Setup

```powershell
cd "D:\KI_LLM\Claude\DWN_KONFIG\dienstwagen-berater"
npm install
npm run dev
# → http://localhost:5173
```

### .env für lokale Entwicklung

Die Datei `.env` liegt lokal im Projektroot und ist in `.gitignore` — sie wird **nie** committed:

```env
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

> `VITE_`-Prefix: Wird von Vite in den Browser-Bundle eingebettet (nur für lokale Dev-Nutzung ohne Serverless-Proxy nötig).
> Auf Vercel wird **`ANTHROPIC_API_KEY`** (ohne `VITE_`-Prefix) als Server-only-Variable gesetzt.

Lokal läuft die Serverless Function nicht automatisch. Entweder:
- `vercel dev` verwenden (braucht Vercel CLI), oder
- Temporär den direkten Browser-Fetch wiederherstellen (mit CORS-Header `anthropic-dangerous-direct-browser-access: true`)

## Git-Workflow

### Tools auf diesem System

`gh` CLI liegt unter `C:\Program Files\GitHub CLI\gh.exe` — ist nicht im Claude-Session-PATH.
`git` liegt unter `C:\Program Files\Git\cmd\git.exe` — ist nicht im Claude-Session-PATH.

In Claude-Code-Sessions immer vollständige Pfade verwenden:

```powershell
& "C:\Program Files\Git\cmd\git.exe" add .
& "C:\Program Files\Git\cmd\git.exe" commit -m "..."
& "C:\Program Files\Git\cmd\git.exe" push
& "C:\Program Files\GitHub CLI\gh.exe" ...
```

Alternativ im normalen Windows-Terminal: `git` und `gh` sind dort direkt verfügbar.

### Typischer Commit-Flow

```powershell
cd "D:\KI_LLM\Claude\DWN_KONFIG\dienstwagen-berater"

# Spezifische Dateien stagen (nie git add -A wegen .env-Risiko)
& "C:\Program Files\Git\cmd\git.exe" add src/components/Chat.jsx src/components/CarCard.jsx

# Status prüfen – sicherstellen dass .env nicht dabei ist
& "C:\Program Files\Git\cmd\git.exe" status

# Commit
& "C:\Program Files\Git\cmd\git.exe" commit -m "Beschreibung der Änderung"

# Push
& "C:\Program Files\Git\cmd\git.exe" push
```

### Dateien die NIEMALS committed werden dürfen

| Datei | Grund |
|---|---|
| `.env` | Enthält den Anthropic API-Key |
| `node_modules/` | NPM-Abhängigkeiten, zu groß |
| `dist/` | Build-Artefakte, von Vercel selbst gebaut |

Alle drei sind in `.gitignore` eingetragen.

## Vercel Deployment

### Automatisches Deployment via GitHub

Sobald ein Push auf `master` landet, deployed Vercel automatisch — kein manueller Schritt nötig.

Ablauf:
1. `git push` → GitHub
2. Vercel-Webhook erkennt neuen Commit
3. Vercel führt `npm run build` aus (`vite build` → `dist/`)
4. Serverless Functions in `/api/` werden automatisch deployed
5. Deployment live in ~30–60 Sekunden

### Manuelle Erst-Einrichtung (bereits erledigt)

Das Repo ist bereits mit Vercel verbunden. Falls ein neues Projekt aufgesetzt werden muss:

```powershell
# Vercel CLI installieren
npm install -g vercel

# Login
vercel login

# Aus dem Projektordner deployen (erkennt vercel.json automatisch)
cd "D:\KI_LLM\Claude\DWN_KONFIG\dienstwagen-berater"
vercel --prod
```

### vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

Keine Routing-Konfiguration nötig: Vercel erkennt `/api/`-Ordner automatisch als Serverless Functions.

### Umgebungsvariable auf Vercel setzen

**Wichtig**: Auf Vercel muss `ANTHROPIC_API_KEY` (ohne `VITE_`-Prefix) gesetzt sein — dieser Key ist nur serverseitig sichtbar.

**Über das Vercel Dashboard:**
1. vercel.com → Projekt `dienstwagen-berater` öffnen
2. Settings → Environment Variables
3. `ANTHROPIC_API_KEY` = `sk-ant-...` hinzufügen
4. Gilt für: Production, Preview, Development
5. Nach dem Setzen: neues Deployment triggern (oder `git push`)

**Über Vercel CLI:**
```bash
vercel env add ANTHROPIC_API_KEY production
# Dann den Key eingeben
```

### Build-Prozess

```
npm run build
  └── vite build
        ├── Bundelt src/ → dist/ (React SPA)
        ├── Tailwind CSS wird durch PostCSS verarbeitet
        └── Serverless Functions (/api/) werden separat behandelt
```

Die `dist/`-Ausgabe enthält:
- `index.html` (Entry Point für alle Routen)
- `assets/` (gebundelte JS/CSS mit Hash-Namen)

## Dateistruktur des Projekts

```
dienstwagen-berater/
├── .claude/
│   └── skills/              ← Diese Skill-Dateien
├── .env                     ← Lokal, nie committen
├── .gitignore
├── api/
│   └── chat.js              ← Vercel Serverless Function (Proxy)
├── index.html               ← Vite Entry Point
├── package.json
├── package-lock.json
├── postcss.config.js
├── src/
│   ├── App.jsx              ← Root-Komponente
│   ├── components/
│   │   ├── CarCard.jsx      ← Fahrzeug-Empfehlungs-Card
│   │   └── Chat.jsx         ← Chat-Interface (Hauptkomponente)
│   ├── index.css            ← Tailwind + Base-Styles
│   └── main.jsx             ← React-Root-Mount
├── tailwind.config.js
├── vercel.json
└── vite.config.js
```

## Fehlersuche

### Build schlägt fehl
```powershell
npm run build 2>&1
```
Häufige Ursache: Tailwind-Klasse falsch geschrieben oder Import-Fehler in JSX.

### Serverless Function gibt 500 zurück
→ `ANTHROPIC_API_KEY` auf Vercel nicht gesetzt oder abgelaufen.
→ In den Vercel Deployment Logs nachsehen: Vercel Dashboard → Deployment → Functions.

### CORS-Fehler lokal
→ Die Serverless Function läuft lokal ohne `vercel dev` nicht.
→ Entweder `vercel dev` nutzen oder temporär direkten API-Aufruf mit CORS-Header reaktivieren.

### gh CLI nicht gefunden in Claude-Session
→ `& "C:\Program Files\GitHub CLI\gh.exe"` mit vollem Pfad aufrufen.
→ GitHub-Account: `MeddlCeddl`, eingeloggt via Keyring (HTTPS-Protokoll).
