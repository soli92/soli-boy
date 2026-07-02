import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Alert } from '../ui/index';

export function InfoTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sd-space-4)', padding: 'var(--sd-space-4) 0' }}>

      {/* Privacy Notice */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Notice</CardTitle>
        </CardHeader>
        <CardContent>
          <p style={{ margin: 0, fontSize: 'var(--sd-font-size-sm)', color: 'var(--sd-color-text-secondary)', lineHeight: 'var(--sd-font-leading-relaxed)' }}>
            soli-boy elabora i tuoi dati esclusivamente in locale sul dispositivo. Non invia,
            non raccoglie e non trasmette a terze parti dati relativi alle ROM caricate,
            ai save state, alle configurazioni o alle sessioni di gioco.
          </p>
          <p style={{ margin: 'var(--sd-space-3) 0 0', fontSize: 'var(--sd-font-size-sm)', color: 'var(--sd-color-text-secondary)', lineHeight: 'var(--sd-font-leading-relaxed)' }}>
            L'archiviazione locale (IndexedDB, LocalStorage) è usata per salvare
            preferenze e save state. Puoi cancellare questi dati in qualsiasi momento
            dalle Impostazioni → Dati.
          </p>
        </CardContent>
      </Card>

      {/* Store Compliance Notice */}
      <Alert variant="warning" title="Store Compliance Notice">
        soli-boy non include, distribuisce né promuove ROM protette da copyright.
        L'utente è responsabile della legalità delle ROM utilizzate secondo la normativa
        vigente nel proprio paese. Per uso personale (backup) verificare le leggi locali
        sul diritto d'autore.
      </Alert>

      {/* Legal Notice */}
      <Card>
        <CardHeader>
          <CardTitle>Note Legali</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sd-space-3)' }}>
            <div>
              <div style={{ fontSize: 'var(--sd-font-size-sm)', fontWeight: 600, color: 'var(--sd-color-text-primary)', marginBottom: 'var(--sd-space-1)' }}>
                Licenza
              </div>
              <p style={{ margin: 0, fontSize: 'var(--sd-font-size-xs)', color: 'var(--sd-color-text-secondary)', lineHeight: 'var(--sd-font-leading-relaxed)' }}>
                soli-boy è distribuito sotto licenza MIT. Il codice sorgente è disponibile
                su GitHub. I componenti di terze parti (mgba-wasm, WasmBoy) sono soggetti
                alle rispettive licenze.
              </p>
            </div>
            <div>
              <div style={{ fontSize: 'var(--sd-font-size-sm)', fontWeight: 600, color: 'var(--sd-color-text-primary)', marginBottom: 'var(--sd-space-1)' }}>
                Trademark
              </div>
              <p style={{ margin: 0, fontSize: 'var(--sd-font-size-xs)', color: 'var(--sd-color-text-secondary)', lineHeight: 'var(--sd-font-leading-relaxed)' }}>
                Game Boy, Game Boy Color, Game Boy Advance, Nintendo DS e Nintendo
                Entertainment System sono marchi registrati di Nintendo Co., Ltd.
                soli-boy non è affiliato, sponsorizzato né approvato da Nintendo.
              </p>
            </div>
            <div>
              <div style={{ fontSize: 'var(--sd-font-size-sm)', fontWeight: 600, color: 'var(--sd-color-text-primary)', marginBottom: 'var(--sd-space-1)' }}>
                Versione
              </div>
              <p style={{ margin: 0, fontSize: 'var(--sd-font-size-xs)', fontFamily: 'var(--sd-font-mono)', color: 'var(--sd-color-text-tertiary)' }}>
                soli-boy v0.4.0 · EP-020 prototype · TSK-141
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
