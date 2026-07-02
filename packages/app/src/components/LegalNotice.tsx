// TSK-006 — Avviso legale no-copyright (US-006).
// TSK-152 (US-098, EP-020) — Migrazione da classe solids `.sb-note` a utility
// Tailwind (`text-xs text-muted-foreground text-center`). Il contratto pubblico
// (role="note" + aria-label "Avviso legale") resta invariato: e2e e unit test
// lo interrogano via `getByRole("note", { name: /avviso legale/i })`.

import { cn } from "@/lib/utils";

const NOTICE_TEXT =
  "Soli-boy non distribuisce né include ROM o BIOS protetti da copyright. " +
  "L'esecuzione avviene esclusivamente su file forniti dall'utente.";

export interface LegalNoticeProps {
  /** Classi aggiuntive opzionali. */
  className?: string;
}

export function LegalNotice({ className }: LegalNoticeProps) {
  return (
    <p
      className={cn("text-xs text-muted-foreground text-center", className)}
      role="note"
      aria-label="Avviso legale"
    >
      <i className="ti ti-info-circle" aria-hidden="true" /> {NOTICE_TEXT}
    </p>
  );
}

export { NOTICE_TEXT };
