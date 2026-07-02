// TSK-006 — Avviso legale no-copyright (US-006).
// EP-021 — Variante `card` per tab Info (parità prototipo EP-020).

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import pkg from "../../package.json";

export const NOTICE_TEXT =
  "Soli-boy non distribuisce né include ROM o BIOS protetti da copyright. " +
  "L'esecuzione avviene esclusivamente su file forniti dall'utente.";

const LICENSE_TEXT =
  "soli-boy è distribuito sotto licenza MIT. Il codice sorgente è disponibile " +
  "su GitHub. I componenti di terze parti (mGBA, WasmBoy) sono soggetti alle " +
  "rispettive licenze.";

const TRADEMARK_TEXT =
  "Game Boy, Game Boy Color, Game Boy Advance, Nintendo DS e Nintendo " +
  "Entertainment System sono marchi registrati di Nintendo Co., Ltd. " +
  "soli-boy non è affiliato, sponsorizzato né approvato da Nintendo.";

export type LegalNoticeVariant = "inline" | "card";

export interface LegalNoticeProps {
  /** Classi aggiuntive opzionali. */
  className?: string;
  /** `inline` = paragrafo compatto (default); `card` = sezione Info arricchita. */
  variant?: LegalNoticeVariant;
}

export function LegalNotice({ className, variant = "inline" }: LegalNoticeProps) {
  if (variant === "card") {
    return (
      <Card className={className} data-testid="sb-legal-card">
        <CardHeader>
          <CardTitle>Note Legali</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p role="note" aria-label="Avviso legale" className="text-xs">
            <i className="ti ti-info-circle" aria-hidden="true" /> {NOTICE_TEXT}
          </p>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Licenza</h3>
            <p className="text-xs leading-relaxed m-0">{LICENSE_TEXT}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Trademark</h3>
            <p className="text-xs leading-relaxed m-0">{TRADEMARK_TEXT}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Versione</h3>
            <p
              className="text-xs font-mono text-muted-foreground m-0"
              data-testid="sb-app-version"
            >
              soli-boy v{pkg.version}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
