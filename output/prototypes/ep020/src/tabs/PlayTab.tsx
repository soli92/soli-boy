import * as React from 'react';
import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from '../ui/index';

interface PlayTabProps {
  onConfirmGameChange: () => void;
}

export function PlayTab({ onConfirmGameChange }: PlayTabProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [hasRom, setHasRom] = React.useState(false);

  const handleLoadRom = () => {
    // Simulate ROM load
    setHasRom(true);
    setIsPlaying(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sd-space-4)', flex: 1, overflow: 'auto', padding: 'var(--sd-space-4) 0' }}>

      {/* Game screen */}
      <div style={{ display: 'flex', gap: 'var(--sd-space-4)', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Screen */}
          <div className="sb-screen">
            {!hasRom ? (
              <div className="sb-screen-inner">
                <span style={{ fontSize: '3rem', opacity: 0.3 }}>🎮</span>
                <span style={{ fontSize: 'var(--sd-font-size-sm)', color: 'var(--sd-color-text-tertiary)', fontFamily: 'var(--sd-font-mono)' }}>
                  AWAITING ROM
                </span>
              </div>
            ) : (
              <div className="sb-screen-inner">
                <span style={{ fontSize: '2rem', color: 'var(--sd-color-accent-1)', fontFamily: 'var(--sd-font-mono)' }}>
                  {isPaused ? '⏸ PAUSED' : isPlaying ? '▶ RUNNING' : '■ READY'}
                </span>
              </div>
            )}

            {/* TouchOverlay — mobile only (CSS display: none on desktop) */}
            <div className="touch-overlay" style={{ position: 'absolute', inset: 0 }}>
              {/* Shoulder buttons L / R */}
              <button className="btn-shoulder btn-l" aria-label="L">L</button>
              <button className="btn-shoulder btn-r" aria-label="R">R</button>

              {/* D-pad left */}
              <div className="dpad">
                <button className="dpad-btn dpad-up" aria-label="Su">▲</button>
                <button className="dpad-btn dpad-left" aria-label="Sinistra">◀</button>
                <div className="dpad-center dpad-btn" style={{ background: 'none', border: 'none' }} />
                <button className="dpad-btn dpad-right" aria-label="Destra">▶</button>
                <button className="dpad-btn dpad-down" aria-label="Giu">▼</button>
              </div>

              {/* Select / Start center */}
              <div className="start-select">
                <button className="ss-btn" aria-label="Select">SELECT</button>
                <button className="ss-btn" aria-label="Start">START</button>
              </div>

              {/* A/B right */}
              <div className="ab-buttons">
                <button className="btn-a" aria-label="A">A</button>
                <button className="btn-b" aria-label="B">B</button>
              </div>
            </div>
          </div>

          {/* HUD */}
          <div style={{
            display: 'flex',
            gap: 'var(--sd-space-2)',
            alignItems: 'center',
            marginTop: 'var(--sd-space-2)',
            flexWrap: 'wrap',
          }}>
            <Badge variant="secondary">
              <span className="hud-mono">60 FPS</span>
            </Badge>
            <Badge variant="secondary">
              <span className="hud-mono">GBC</span>
            </Badge>
            <Badge variant="secondary">
              <span className="hud-mono">SLOT 1</span>
            </Badge>
            {isPlaying && !isPaused && (
              <Badge variant="success">
                <span className="hud-mono">RUNNING</span>
              </Badge>
            )}
            {isPaused && (
              <Badge variant="warning">
                <span className="hud-mono">PAUSED</span>
              </Badge>
            )}
          </div>

          {/* Player controls */}
          <div style={{ display: 'flex', gap: 'var(--sd-space-2)', marginTop: 'var(--sd-space-3)', flexWrap: 'wrap' }}>
            <Button
              variant="default"
              size="md"
              disabled={!hasRom}
              onClick={() => {
                if (isPaused) {
                  setIsPaused(false);
                } else {
                  setIsPlaying(true);
                }
              }}
            >
              {isPaused ? '▶ Riprendi' : '▶ Avvia'}
            </Button>
            <Button
              variant="outline"
              size="md"
              disabled={!isPlaying}
              onClick={() => setIsPaused(p => !p)}
            >
              ⏸ Pausa
            </Button>
            <Button
              variant="outline"
              size="md"
              disabled={!hasRom}
              title="Fast-forward"
            >
              ⏩ ×2
            </Button>
            <Button
              variant="outline"
              size="icon"
              title="Fullscreen"
              aria-label="Fullscreen"
            >
              ⛶
            </Button>
          </div>

          {/* Idle CTA when no ROM */}
          {!hasRom && (
            <div style={{ marginTop: 'var(--sd-space-4)' }}>
              <div className="drop-zone" onClick={handleLoadRom} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && handleLoadRom()}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--sd-space-2)' }}>📁</div>
                <div style={{ fontSize: 'var(--sd-font-size-sm)', fontWeight: 500, color: 'var(--sd-color-text-primary)', marginBottom: 'var(--sd-space-1)' }}>
                  Carica una ROM per iniziare
                </div>
                <div style={{ fontSize: 'var(--sd-font-size-xs)', color: 'var(--sd-color-text-tertiary)' }}>
                  Trascina un file .gb · .gbc · .gba · .nds · .nes
                </div>
                <Button variant="outline" size="sm" style={{ marginTop: 'var(--sd-space-3)' }}>
                  Sfoglia file
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Save State Panel — desktop sidebar */}
        <Card style={{ width: '14rem', flexShrink: 0, display: 'none' as React.CSSProperties['display'] }} className="save-panel-desktop">
          <style>{`@media (min-width: 768px) { .save-panel-desktop { display: block !important; } }`}</style>
          <CardHeader>
            <CardTitle>Save States</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sd-space-2)' }}>
              {[1, 2, 3].map(slot => (
                <div key={slot} className="save-slot">
                  <span className="save-slot-num">#{slot}</span>
                  <span style={{ flex: 1, fontSize: 'var(--sd-font-size-xs)', color: 'var(--sd-color-text-tertiary)' }}>
                    {slot === 1 ? '01 Jul 22:14' : 'Vuoto'}
                  </span>
                  <div style={{ display: 'flex', gap: 'var(--sd-space-1)' }}>
                    <Button variant="ghost" size="sm" style={{ padding: '0 var(--sd-space-2)', height: '1.75rem', fontSize: '0.625rem' }}>
                      Load
                    </Button>
                    <Button variant="ghost" size="sm" style={{ padding: '0 var(--sd-space-2)', height: '1.75rem', fontSize: '0.625rem' }}>
                      Save
                    </Button>
                    {slot === 1 && (
                      <Button variant="ghost" size="sm" style={{ padding: '0 var(--sd-space-2)', height: '1.75rem', fontSize: '0.625rem', color: 'var(--sd-color-destructive-default)' }}>
                        ✕
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
