import * as React from 'react';
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Switch, Slider, RadioGroup, RadioGroupItem,
  Button, Label, Separator,
} from '../ui/index';

const THEMES = [
  { value: '90s-party', label: '90s Party', desc: 'Neon rave, saturated purple & magenta' },
  { value: 'dark', label: 'Dark', desc: 'Clean dark mode, blue primary' },
  { value: 'cyberpunk', label: 'Cyberpunk', desc: 'Neon cyan, sharp corners' },
] as const;

const KEYMAP = [
  { action: 'A', key: 'X' },
  { action: 'B', key: 'Z' },
  { action: 'Start', key: 'Enter' },
  { action: 'Select', key: 'Backspace' },
  { action: 'Up', key: '↑' },
  { action: 'Down', key: '↓' },
  { action: 'Left', key: '←' },
  { action: 'Right', key: '→' },
  { action: 'L', key: 'A' },
  { action: 'R', key: 'S' },
];

interface SettingsTabProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

export function SettingsTab({ currentTheme, onThemeChange }: SettingsTabProps) {
  const [volume, setVolume] = React.useState([75]);
  const [muted, setMuted] = React.useState(false);
  const [scanlines, setScanlines] = React.useState(false);

  const kbdStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '1.75rem',
    padding: '0 var(--sd-space-2)',
    height: '1.5rem',
    background: 'var(--sd-color-bg-surface)',
    border: '1px solid var(--sd-color-border-strong)',
    borderRadius: 'var(--sd-radius-sm)',
    fontFamily: 'var(--sd-font-mono)',
    fontSize: 'var(--sd-font-size-xs)',
    color: 'var(--sd-color-text-primary)',
    boxShadow: '0 2px 0 var(--sd-color-border-strong)',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--sd-space-3)',
    padding: 'var(--sd-space-2) 0',
  };

  return (
    <div style={{ padding: 'var(--sd-space-4) 0' }}>
      <Accordion type="multiple" defaultValue={['video', 'audio']}>

        {/* Video */}
        <AccordionItem value="video">
          <AccordionTrigger>Video</AccordionTrigger>
          <AccordionContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sd-space-3)' }}>
              <div>
                <Label htmlFor="scale-select">Scala schermo</Label>
                <Select defaultValue="2x">
                  <SelectTrigger id="scale-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1x">1× — Originale</SelectItem>
                    <SelectItem value="2x">2× — Doppia</SelectItem>
                    <SelectItem value="3x">3× — Tripla</SelectItem>
                    <SelectItem value="fit">Adatta alla finestra</SelectItem>
                    <SelectItem value="fill">Riempi schermo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filter-select">Filtro rendering</Label>
                <Select defaultValue="nearest">
                  <SelectTrigger id="filter-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nearest">Nearest Neighbor</SelectItem>
                    <SelectItem value="bilinear">Bilineare</SelectItem>
                    <SelectItem value="lcd">LCD Grid</SelectItem>
                    <SelectItem value="crt">CRT Scanline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div style={rowStyle}>
                <div>
                  <Label style={{ marginBottom: 0 }}>Scanline</Label>
                  <div style={{ fontSize: 'var(--sd-font-size-xs)', color: 'var(--sd-color-text-tertiary)' }}>
                    Effetto CRT vintage
                  </div>
                </div>
                <Switch
                  checked={scanlines}
                  onCheckedChange={setScanlines}
                  aria-label="Scanline"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Audio */}
        <AccordionItem value="audio">
          <AccordionTrigger>Audio</AccordionTrigger>
          <AccordionContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sd-space-4)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sd-space-2)' }}>
                  <Label style={{ marginBottom: 0 }}>Volume</Label>
                  <span className="hud-mono" style={{ fontSize: 'var(--sd-font-size-xs)', color: 'var(--sd-color-text-secondary)' }}>
                    {muted ? 'MUTE' : `${volume[0]}%`}
                  </span>
                </div>
                <Slider
                  min={0} max={100} step={1}
                  value={volume}
                  onValueChange={setVolume}
                  disabled={muted}
                  aria-label="Volume"
                />
              </div>
              <div style={rowStyle}>
                <div>
                  <Label style={{ marginBottom: 0 }}>Muto</Label>
                  <div style={{ fontSize: 'var(--sd-font-size-xs)', color: 'var(--sd-color-text-tertiary)' }}>
                    Silenzia tutto l'audio
                  </div>
                </div>
                <Switch
                  checked={muted}
                  onCheckedChange={setMuted}
                  aria-label="Muto"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* BIOS */}
        <AccordionItem value="bios">
          <AccordionTrigger>BIOS</AccordionTrigger>
          <AccordionContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sd-space-3)' }}>
              {['Game Boy (DMG)', 'Game Boy Color', 'Game Boy Advance'].map(platform => (
                <div key={platform} style={rowStyle}>
                  <div>
                    <div style={{ fontSize: 'var(--sd-font-size-sm)', color: 'var(--sd-color-text-primary)' }}>{platform}</div>
                    <div style={{ fontSize: 'var(--sd-font-size-xs)', color: 'var(--sd-color-text-tertiary)' }}>
                      Nessun BIOS caricato
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Carica</Button>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Controlli */}
        <AccordionItem value="controls">
          <AccordionTrigger>Controlli</AccordionTrigger>
          <AccordionContent>
            <table className="keymap-table">
              <thead>
                <tr>
                  <th>Azione</th>
                  <th>Tasto</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {KEYMAP.map(({ action, key }) => (
                  <tr key={action}>
                    <td style={{ color: 'var(--sd-color-text-primary)' }}>{action}</td>
                    <td>
                      <span style={kbdStyle}>{key}</span>
                    </td>
                    <td>
                      <Button variant="ghost" size="sm" style={{ fontSize: '0.65rem', height: '1.5rem', padding: '0 var(--sd-space-2)', color: 'var(--sd-color-text-tertiary)' }}>
                        Remap
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AccordionContent>
        </AccordionItem>

        {/* Aspetto */}
        <AccordionItem value="appearance">
          <AccordionTrigger>Aspetto</AccordionTrigger>
          <AccordionContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sd-space-2)' }}>
              <Label>Tema interfaccia</Label>
              <RadioGroup
                value={currentTheme}
                onValueChange={onThemeChange}
                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sd-space-2)' }}
              >
                {THEMES.map(({ value, label, desc }) => (
                  <label
                    key={value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--sd-space-3)',
                      padding: 'var(--sd-space-3)',
                      borderRadius: 'var(--sd-radius-md)',
                      border: `1px solid ${currentTheme === value ? 'var(--sd-color-primary-default)' : 'var(--sd-color-border-muted)'}`,
                      background: currentTheme === value ? 'var(--sd-color-primary-subtle)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                  >
                    <RadioGroupItem value={value} id={`theme-${value}`} />
                    <div>
                      <div style={{ fontSize: 'var(--sd-font-size-sm)', fontWeight: 600, color: 'var(--sd-color-text-primary)' }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 'var(--sd-font-size-xs)', color: 'var(--sd-color-text-tertiary)' }}>
                        {desc}
                      </div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Dati */}
        <AccordionItem value="data">
          <AccordionTrigger>Dati</AccordionTrigger>
          <AccordionContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sd-space-2)' }}>
              <div style={rowStyle}>
                <div>
                  <div style={{ fontSize: 'var(--sd-font-size-sm)', color: 'var(--sd-color-text-primary)' }}>Esporta dati</div>
                  <div style={{ fontSize: 'var(--sd-font-size-xs)', color: 'var(--sd-color-text-tertiary)' }}>Save state, configurazione, libreria</div>
                </div>
                <Button variant="outline" size="sm">Esporta</Button>
              </div>
              <Separator />
              <div style={rowStyle}>
                <div>
                  <div style={{ fontSize: 'var(--sd-font-size-sm)', color: 'var(--sd-color-text-primary)' }}>Importa dati</div>
                  <div style={{ fontSize: 'var(--sd-font-size-xs)', color: 'var(--sd-color-text-tertiary)' }}>Ripristina da backup</div>
                </div>
                <Button variant="outline" size="sm">Importa</Button>
              </div>
              <Separator />
              <div style={rowStyle}>
                <div>
                  <div style={{ fontSize: 'var(--sd-font-size-sm)', color: 'var(--sd-color-destructive-default)' }}>Cancella tutti i dati</div>
                  <div style={{ fontSize: 'var(--sd-font-size-xs)', color: 'var(--sd-color-text-tertiary)' }}>Azione irreversibile</div>
                </div>
                <Button variant="destructive" size="sm">Cancella</Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  );
}
