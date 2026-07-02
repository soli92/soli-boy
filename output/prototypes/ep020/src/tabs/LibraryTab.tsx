import * as React from 'react';
import { Button, Badge, Card, CardContent, Input, Label, ToggleGroup, ToggleGroupItem } from '../ui/index';

const PLATFORMS = ['Tutti', 'GB', 'GBC', 'GBA', 'NDS', 'NES'] as const;
type Platform = typeof PLATFORMS[number];

interface GameEntry {
  id: string;
  title: string;
  platform: Exclude<Platform, 'Tutti'>;
  emoji: string;
  active?: boolean;
}

const GAMES: GameEntry[] = [
  { id: '1', title: 'Pokémon Crystal', platform: 'GBC', emoji: '🐲', active: true },
  { id: '2', title: 'Metroid Fusion', platform: 'GBA', emoji: '🚀' },
  { id: '3', title: 'Super Mario Bros.', platform: 'NES', emoji: '🍄' },
];

interface LibraryTabProps {
  onRemoveRom: () => void;
}

export function LibraryTab({ onRemoveRom }: LibraryTabProps) {
  const [search, setSearch] = React.useState('');
  const [platform, setPlatform] = React.useState<string>('Tutti');
  const [showEmpty, setShowEmpty] = React.useState(false);

  const filtered = showEmpty
    ? []
    : GAMES.filter(g => {
        const matchPlatform = platform === 'Tutti' || g.platform === platform;
        const matchSearch = !search || g.title.toLowerCase().includes(search.toLowerCase());
        return matchPlatform && matchSearch;
      });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sd-space-4)', padding: 'var(--sd-space-4) 0' }}>
      {/* Search */}
      <div>
        <Label htmlFor="lib-search">Cerca gioco</Label>
        <Input
          id="lib-search"
          placeholder="Cerca per titolo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Platform filter */}
      <div>
        <Label>Piattaforma</Label>
        <ToggleGroup
          type="single"
          value={platform}
          onValueChange={v => v && setPlatform(v)}
        >
          {PLATFORMS.map(p => (
            <ToggleGroupItem key={p} value={p}>
              {p}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Demo toggle */}
      <div style={{ display: 'flex', gap: 'var(--sd-space-2)', alignItems: 'center' }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowEmpty(e => !e)}
          style={{ fontSize: 'var(--sd-font-size-xs)', color: 'var(--sd-color-text-tertiary)' }}
        >
          {showEmpty ? 'Mostra giochi' : 'Simula libreria vuota'}
        </Button>
      </div>

      {/* Game grid */}
      {filtered.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(9rem, 1fr))',
          gap: 'var(--sd-space-3)',
        }}>
          {filtered.map(game => (
            <div key={game.id} className={`game-tile${game.active ? ' active' : ''}`}>
              <div className="game-tile-art">
                {game.emoji}
              </div>
              <div className="game-tile-info">
                <div style={{
                  fontSize: 'var(--sd-font-size-xs)',
                  fontWeight: 600,
                  color: 'var(--sd-color-text-primary)',
                  marginBottom: 'var(--sd-space-1)',
                  lineHeight: 1.3,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {game.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sd-space-1)' }}>
                  <Badge variant={game.active ? 'default' : 'secondary'} style={{ fontSize: '0.6rem' }}>
                    {game.active ? 'In gioco' : game.platform}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    style={{ padding: '0 var(--sd-space-1)', height: '1.5rem', fontSize: '0.65rem', color: 'var(--sd-color-destructive-default)' }}
                    onClick={onRemoveRom}
                    aria-label={`Rimuovi ${game.title}`}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty state */
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--sd-space-3)',
          padding: 'var(--sd-space-12) var(--sd-space-6)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', opacity: 0.4 }}>📭</div>
          <div>
            <div style={{ fontSize: 'var(--sd-font-size-sm)', fontWeight: 600, color: 'var(--sd-color-text-primary)', marginBottom: 'var(--sd-space-1)' }}>
              {search || platform !== 'Tutti' ? 'Nessun risultato' : 'Libreria vuota'}
            </div>
            <div style={{ fontSize: 'var(--sd-font-size-xs)', color: 'var(--sd-color-text-tertiary)' }}>
              {search || platform !== 'Tutti'
                ? 'Modifica i filtri di ricerca'
                : 'Carica una ROM per iniziare la tua collezione'}
            </div>
          </div>
          {!search && platform === 'Tutti' && (
            <Button variant="default" size="md">
              📁 Carica ROM
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
