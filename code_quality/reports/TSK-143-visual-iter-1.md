# Visual Oracle — TSK-143 iter-1

**verdict:** `conditional`  
**defects_count:** 3 (2 minor · 1 trivial)  
**screenshots:** mobile × {light,dark}, desktop × {light,dark}, +libreria

---

## Findings

### #1 — TabsList: dead class `sb-tab-bar`, mancano le Tailwind spec *(minor)*

**Viewport/tema:** tutti  
**Osservato:** Il tab bar renderizza come compact inline pill-group (`inline-flex rounded-lg bg-muted p-1`, default di `tabs.tsx`) anziché come full-width navigation bar con separatore. Su mobile 375 il label "Info & Privacy" è leggermente cropped orizzontalmente.  
**Spec:** `<TabsList className="w-full rounded-none border-b border-border">`  
**Attuale:** `<TabsList aria-label="Sezioni app" className="sb-tab-bar">` — la classe `sb-tab-bar` non ha più effetto (CSS rimosso da `app-extra.css` come documentato nel commento TSK-143).  
**Fix:** sostituire `className="sb-tab-bar"` con `className="w-full rounded-none border-b border-border"` in `App.tsx:602`.

---

### #2 — `<Tabs>` manca `className="flex flex-col flex-1"` *(minor)*

**Viewport/tema:** tutti  
**Osservato:** Il tab container non espande a fill height nella colonna flex `.sb-app`. Il tab panel occupa solo l'altezza del suo contenuto, non il restante viewport.  
**Spec:** `<Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">`  
**Attuale:** `<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Tab)}>` — nessun className.  
**Fix:** aggiungere `className="flex flex-col flex-1"` sul componente `<Tabs>` in `App.tsx:598`.

---

### #3 — Dead class `sb-tab-btn` su `TabsTrigger` *(trivial)*

**Viewport/tema:** tutti  
**Osservato:** `className="sb-tab-btn"` ancora presente sui `<TabsTrigger>`. Nessun effetto visivo (CSS rimosso), ma dead code.  
**Fix:** rimuovere `className="sb-tab-btn"` da `<TabsTrigger>` in `App.tsx:607`. Il default di `tabs.tsx` è già corretto.

---

## Loop status

`iter 1 / max 3` — 2 finding minor azionabili → ri-dispatch fe-dev con questa lista.  
Funzionalità core TSK-143 corretta (Radix ARIA, keyboard nav, forceMount Play, panel-* id, temi light/dark entrambi OK).

---

## Screenshot matrix

| Viewport | Theme | File |
|---|---|---|
| mobile 375  | light | `mobile-light.png` |
| mobile 375  | dark  | `mobile-dark.png` |
| desktop 1280 | light | `desktop-light.png` |
| desktop 1280 | dark  | `desktop-dark.png` |
| desktop 1280 | light | `desktop-light-library.png` |
| mobile 375  | light | `mobile-light-library.png` |
