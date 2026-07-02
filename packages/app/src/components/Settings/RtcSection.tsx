// TSK-126 — Settings: sezione data/ora RTC (US-065, ADR-009).
// TSK-150 (EP-020) — Campi RTC migrati a Input + Label + Button (solids/shadcn).
//
// Sezione del pannello Settings dedicata all'orologio interno (Real Time Clock)
// della cartuccia in esecuzione. Visibile solo quando `hasRtc(platform)` e
// `bridge !== null`.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  hasRtc,
  RtcService,
  type RtcBridge,
  type RtcState,
} from "../../domain/rtc-service";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface RtcSectionProps {
  platform: string;
  bridge: RtcBridge | null;
}

const DEFAULT_STATE: RtcState = {
  year: 2026,
  month: 1,
  day: 1,
  hour: 0,
  minute: 0,
  second: 0,
};

const FIELD_RANGES: Record<keyof RtcState, { min: number; max: number }> = {
  year: { min: 2000, max: 9999 },
  month: { min: 1, max: 12 },
  day: { min: 1, max: 31 },
  hour: { min: 0, max: 23 },
  minute: { min: 0, max: 59 },
  second: { min: 0, max: 59 },
};

function isFieldValid(field: keyof RtcState, value: number): boolean {
  if (!Number.isFinite(value) || !Number.isInteger(value)) return false;
  const { min, max } = FIELD_RANGES[field];
  return value >= min && value <= max;
}

const FIELD_LABELS: Record<keyof RtcState, string> = {
  year: "Anno",
  month: "Mese",
  day: "Giorno",
  hour: "Ora",
  minute: "Minuto",
  second: "Secondo",
};

const FIELD_ORDER: (keyof RtcState)[] = [
  "year",
  "month",
  "day",
  "hour",
  "minute",
  "second",
];

export function RtcSection({ platform, bridge }: RtcSectionProps) {
  const [state, setState] = useState<RtcState>(DEFAULT_STATE);
  const [confirmed, setConfirmed] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!hasRtc(platform)) return;
    if (bridge) {
      const current = RtcService.getRtcState(bridge);
      if (current) {
        setState(current);
      }
    }
  }, [bridge, platform]);

  const validity = useMemo(
    () => ({
      year: isFieldValid("year", state.year),
      month: isFieldValid("month", state.month),
      day: isFieldValid("day", state.day),
      hour: isFieldValid("hour", state.hour),
      minute: isFieldValid("minute", state.minute),
      second: isFieldValid("second", state.second),
    }),
    [state],
  );

  const allValid = useMemo(
    () => RtcService.validateRtcState(state),
    [state],
  );

  const handleFieldChange = useCallback(
    (field: keyof RtcState, raw: string) => {
      const parsed = raw === "" ? Number.NaN : Number(raw);
      setState((prev) => ({ ...prev, [field]: parsed }));
      setConfirmed(false);
      setSyncNotice(null);
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    if (!bridge) return;
    if (!RtcService.validateRtcState(state)) return;
    RtcService.setRtcState(bridge, state);
    setConfirmed(true);
    setSyncNotice(null);
  }, [bridge, state]);

  const handleSyncToDevice = useCallback(() => {
    if (!bridge) return;
    RtcService.syncToDevice(bridge);
    const current = RtcService.getRtcState(bridge);
    if (current) {
      setState(current);
      setSyncNotice(null);
    } else {
      setSyncNotice("Sincronizzazione non disponibile");
    }
    setConfirmed(false);
  }, [bridge]);

  if (!hasRtc(platform) || bridge === null) {
    return null;
  }

  return (
    <AccordionItem value="rtc" data-testid="sb-rtc-section">
      <AccordionTrigger>Orologio interno (RTC) — data e ora</AccordionTrigger>
      <AccordionContent>
        <p className="text-xs text-muted-foreground">
          Imposta l'orologio interno della cartuccia. Valori espressi nel fuso
          orario locale del dispositivo.
        </p>
        <div
          className="grid grid-cols-2 gap-3"
          aria-label="Impostazioni orologio interno RTC"
        >
          {FIELD_ORDER.map((field) => {
            const { min, max } = FIELD_RANGES[field];
            const value = state[field];
            const valid = validity[field];
            const displayValue = Number.isFinite(value) ? String(value) : "";
            return (
              <Field key={field} data-invalid={!valid || undefined}>
                <Label htmlFor={`sb-rtc-${field}`}>{FIELD_LABELS[field]}</Label>
                <Input
                  id={`sb-rtc-${field}`}
                  type="number"
                  inputMode="numeric"
                  min={min}
                  max={max}
                  step={1}
                  value={displayValue}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  aria-invalid={!valid || undefined}
                  aria-describedby={
                    !valid ? `sb-rtc-${field}-error` : undefined
                  }
                  data-testid={`sb-rtc-${field}`}
                />
                {!valid && (
                  <FieldError
                    id={`sb-rtc-${field}-error`}
                    data-testid={`sb-rtc-${field}-error`}
                  >
                    Valore fuori intervallo ({min}–{max}).
                  </FieldError>
                )}
              </Field>
            );
          })}
        </div>
        <Button
          type="button"
          className="w-full mt-3"
          onClick={handleSubmit}
          disabled={!allValid}
          aria-label="Imposta data e ora dell'orologio interno"
          data-testid="sb-rtc-submit"
        >
          Imposta
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full mt-2"
          onClick={handleSyncToDevice}
          aria-label="Usa ora del dispositivo"
          data-testid="sb-rtc-sync-device"
        >
          Usa ora del dispositivo
        </Button>
        {confirmed && (
          <p className="text-xs text-muted-foreground" role="status" data-testid="sb-rtc-confirmed">
            Orologio interno impostato.
          </p>
        )}
        {syncNotice && (
          <p className="text-xs text-muted-foreground" role="status" data-testid="sb-rtc-sync-notice">
            {syncNotice}
          </p>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
