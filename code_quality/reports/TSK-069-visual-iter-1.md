# Visual Oracle — TSK-069 (iter 1)

**Verdict: `pass`** · `visual_status: pass` · `next_action: done`
Componente: PrivacyNotice (banner primo avvio + sezione Settings → Privacy)
Render: Chromium headless · `http://localhost:5173/` (root SPA, context pulito → privacy-ack null → banner mostrato)

## Esito vs DoD TSK-069

| DoD | Esito visivo |
|---|---|
| PrivacyNotice all'avvio + in Settings | ✅ banner in alto + sezione Privacy più in basso, entrambe presenti |
| Testo esplicito privacy on-device | ✅ «Tutti i tuoi dati … restano sul dispositivo. Nessun file inviato a server esterni. … offline … nessun tracking» |
| Stile token solids | ✅ card `sd-card`/`sb-*`, coerente con il resto della UI |
| Responsive | ✅ mobile 375px (single-column, testo wrappa) e desktop 1280px ok |
| Accettazione persistita / non ripetuta | ⏝ comportamentale (non verificabile da screenshot; coperta da unit test) |

## Screenshot

| Viewport | Tema | File |
|---|---|---|
| mobile (375) | light | `TSK-069-visual-iter-1/mobile-light.png` |
| mobile (375) | dark | `TSK-069-visual-iter-1/mobile-dark.png` (≡ light) |
| desktop (1280) | light | `TSK-069-visual-iter-1/desktop-light.png` |
| desktop (1280) | dark | `TSK-069-visual-iter-1/desktop-dark.png` (≡ light) |

## Difetti rilevati (3, nessuno bloccante)

1. **[minor] Tema dark non esercitato** — light/dark byte-identici (stesso md5). L'app usa un
   theme selector esplicito persistito (TSK-044), non `prefers-color-scheme`; `emulateMedia`
   non commuta. → Blind-spot del **render harness**, non difetto del componente.
   *Fix*: pilotare il tema applicativo prima dello screenshot dark, o `themes: [light]` finché
   il toggle non è headless-driven.
2. **[minor] Contrasto testo banner** — corpo informativo in grigio tenue, denso su mobile;
   possibile rischio WCAG AA. *Fix*: abilitare `checks: [axe-a11y]` per misurare; alzare il
   token testo secondario se < 4.5:1.
3. **[trivial / by-design] Testo privacy duplicato** — banner + sezione Settings sulla stessa
   schermata iniziale (coerente con la DoD). Nessuna azione richiesta.

## Note di processo (evaluator-optimizer)

- Producer ed evaluator sono lo stesso `fe-dev` (critic = passata multimodale, legge i PNG via Read).
- Verdict `pass`: la DoD visiva di TSK-069 è soddisfatta; i 3 findings sono minor/by-design e
  non innescano il loop `conditional`. Con una policy più severa, il finding #2 (contrasto)
  diventerebbe `conditional` previa misura axe.
- **Azione di follow-up consigliata** (oltre TSK-069): migliorare il render harness del visual
  oracle per soli-boy così da esercitare davvero il tema dark (pilotaggio theme selector).
