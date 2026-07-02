import * as React from 'react';
import logoUrl from './assets/soliboy-logo-horizontal.svg';
import {
  Tabs, TabsList, TabsTrigger, TabsContent, ActiveTabStyle,
  AlertDialog, AlertDialogTrigger, AlertDialogContent,
  AlertDialogTitle, AlertDialogDescription,
  AlertDialogAction, AlertDialogCancel,
  Button,
} from './ui/index';
import { PlayTab } from './tabs/PlayTab';
import { LibraryTab } from './tabs/LibraryTab';
import { SettingsTab } from './tabs/SettingsTab';
import { InfoTab } from './tabs/InfoTab';

// ── Theme helpers ──────────────────────────────────────────────────────────────
type AppTheme = 'cyberpunk' | '90s-party';

const THEME_LABELS: Record<AppTheme, string> = {
  'cyberpunk': 'CYBERPUNK',
  '90s-party': '90S PARTY',
};
const THEME_NEXT: Record<AppTheme, AppTheme> = {
  'cyberpunk': '90s-party',
  '90s-party': 'cyberpunk',
};

function applyTheme(theme: AppTheme) {
  document.documentElement.dataset.theme = theme;
}

// ── App ────────────────────────────────────────────────────────────────────────
export function App() {
  // Theme state — reads initial value from html[data-theme] set in index.html
  const [theme, setTheme] = React.useState<AppTheme>(
    () => (document.documentElement.dataset.theme as AppTheme) || 'cyberpunk'
  );

  // Dialogs state
  const [gameChangeDialogOpen, setGameChangeDialogOpen] = React.useState(false);
  const [removeRomDialogOpen, setRemoveRomDialogOpen] = React.useState(false);

  // Active tab
  const [activeTab, setActiveTab] = React.useState('play');

  const handleThemeToggle = () => {
    const next = THEME_NEXT[theme];
    setTheme(next);
    applyTheme(next);
  };

  const handleThemeSelect = (newTheme: string) => {
    const t = newTheme as AppTheme;
    setTheme(t);
    applyTheme(t);
  };

  return (
    <>
      <ActiveTabStyle />

      {/* ConfirmGameChangeDialog */}
      <AlertDialog open={gameChangeDialogOpen} onOpenChange={setGameChangeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Cambia gioco?</AlertDialogTitle>
          <AlertDialogDescription>
            Il progresso non salvato dell'attuale sessione andrà perso.
            Vuoi continuare e caricare il nuovo gioco?
          </AlertDialogDescription>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sd-space-2)' }}>
            <AlertDialogCancel asChild>
              <Button variant="outline" size="md">Annulla</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="default" size="md">Cambia gioco</Button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* RemoveRomConfirmDialog */}
      <AlertDialog open={removeRomDialogOpen} onOpenChange={setRemoveRomDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Rimuovi ROM?</AlertDialogTitle>
          <AlertDialogDescription>
            La ROM verrà rimossa dalla libreria. I save state associati saranno
            conservati ma non saranno più accessibili finché la ROM non viene
            ricaricata. Questa azione non può essere annullata.
          </AlertDialogDescription>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sd-space-2)' }}>
            <AlertDialogCancel asChild>
              <Button variant="outline" size="md">Annulla</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" size="md">Rimuovi</Button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <div className="proto-root">
        {/* Header */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--sd-space-3)',
          padding: 'var(--sd-space-3) var(--sd-space-4)',
          borderBottom: '1px solid var(--sd-color-border-muted)',
          background: 'var(--sd-color-bg-surface)',
          flexShrink: 0,
          flexWrap: 'wrap',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sd-space-2)' }}>
            <img src={logoUrl} alt="soli-boy" style={{ height: '2.5rem' }} />
            <span style={{
              fontFamily: 'var(--sd-font-mono)',
              fontSize: '0.625rem',
              color: 'var(--sd-color-text-tertiary)',
              alignSelf: 'flex-end',
              paddingBottom: '2px',
            }}>
              EP-020 proto
            </span>
          </div>

          {/* Nav tabs (desktop inline) */}
          <nav style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0 }}>
            <Tabs value={activeTab} onValueChange={setActiveTab} style={{ width: '100%', maxWidth: '28rem' }}>
              <TabsList style={{ width: '100%' }}>
                <TabsTrigger value="play">▶ Play</TabsTrigger>
                <TabsTrigger value="library">📚 Library</TabsTrigger>
                <TabsTrigger value="settings">⚙ Settings</TabsTrigger>
                <TabsTrigger value="info">ℹ Info</TabsTrigger>
              </TabsList>
            </Tabs>
          </nav>

          {/* Theme switcher */}
          <button
            className="theme-switcher"
            onClick={handleThemeToggle}
            aria-label={`Tema corrente: ${THEME_LABELS[theme]}. Clicca per cambiare`}
          >
            <span className="theme-dot" />
            <span>{THEME_LABELS[theme]}</span>
            <span style={{ color: 'var(--sd-color-text-tertiary)', fontSize: '0.625rem' }}>↔</span>
            <span>{THEME_LABELS[THEME_NEXT[theme]]}</span>
          </button>
        </header>

        {/* Main content */}
        <main style={{
          flex: 1,
          overflow: 'auto',
          padding: '0 var(--sd-space-4)',
        }}>
          {/* Dialogs trigger area — always-visible demo buttons */}
          <div style={{
            display: 'flex',
            gap: 'var(--sd-space-2)',
            padding: 'var(--sd-space-3) 0 0',
            flexWrap: 'wrap',
          }}>
            <Button
              variant="ghost"
              size="sm"
              style={{ fontSize: 'var(--sd-font-size-xs)', color: 'var(--sd-color-text-tertiary)', border: '1px dashed var(--sd-color-border-muted)' }}
              onClick={() => setGameChangeDialogOpen(true)}
            >
              Demo: Cambia gioco dialog
            </Button>
            <Button
              variant="ghost"
              size="sm"
              style={{ fontSize: 'var(--sd-font-size-xs)', color: 'var(--sd-color-text-tertiary)', border: '1px dashed var(--sd-color-border-muted)' }}
              onClick={() => setRemoveRomDialogOpen(true)}
            >
              Demo: Rimuovi ROM dialog
            </Button>
          </div>

          {/* Tab content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="play" style={{ outline: 'none' }}>
              <PlayTab onConfirmGameChange={() => setGameChangeDialogOpen(true)} />
            </TabsContent>
            <TabsContent value="library" style={{ outline: 'none' }}>
              <LibraryTab onRemoveRom={() => setRemoveRomDialogOpen(true)} />
            </TabsContent>
            <TabsContent value="settings" style={{ outline: 'none' }}>
              <SettingsTab currentTheme={theme} onThemeChange={handleThemeSelect} />
            </TabsContent>
            <TabsContent value="info" style={{ outline: 'none' }}>
              <InfoTab />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
}
