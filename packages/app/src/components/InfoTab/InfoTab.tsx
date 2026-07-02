// EP-021 — Tab Info & Privacy arricchita (parità prototipo EP-020 / InfoTab.tsx).
// Compone PrivacyNotice, StoreComplianceNotice e LegalNotice preservando i
// contratti e2e (role="note", data-testid="sb-privacy-section").

import { LegalNotice } from "../LegalNotice";
import { PrivacyNotice } from "../PrivacyNotice/PrivacyNotice";
import { StoreComplianceNotice } from "../StoreComplianceNotice/StoreComplianceNotice";

export function InfoTab() {
  return (
    <div className="flex flex-col gap-5 py-2" data-testid="info-tab">
      <PrivacyNotice variant="section" />
      <StoreComplianceNotice tone="warning" />
      <LegalNotice variant="card" />
    </div>
  );
}
