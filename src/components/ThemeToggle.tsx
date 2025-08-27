import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    console.log('Changing theme to:', newTheme);
    setTheme(newTheme);
  };

  const getCurrentThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun size={18} />;
      case 'dark':
        return <Moon size={18} />;
      case 'system':
        return <Monitor size={18} />;
      default:
        return <Monitor size={18} />;
    }
  };

  const cycleTheme = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    handleThemeChange(themes[nextIndex]);
  };

  return (
    <>
      {/* Mobile: Compact single button */}
      <div className="md:hidden">
        <button
          onClick={cycleTheme}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all duration-300"
          aria-label={`Current theme: ${theme}. Click to cycle themes.`}
        >
          {getCurrentThemeIcon()}
        </button>
      </div>

      {/* Desktop: Full toggle with all options */}
      <div className="hidden md:inline-flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-muted)] p-1 transition-all duration-300 dark:shadow-[var(--neon-glow)]">
        <button
          onClick={() => handleThemeChange('light')}
          className={`inline-flex h-8 w-8 items-center justify-center rounded transition-all duration-300 ${
            theme === 'light'
              ? 'bg-[var(--color-bg)] text-[var(--color-primary)] shadow-[var(--neon-glow)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:shadow-[var(--neon-glow)]'
          }`}
          aria-label="Light theme"
        >
          <Sun size={18} />
        </button>

        <button
          onClick={() => handleThemeChange('dark')}
          className={`inline-flex h-8 w-8 items-center justify-center rounded transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-[var(--color-bg)] text-[var(--color-primary)] shadow-[var(--neon-glow)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:shadow-[var(--neon-glow)]'
          }`}
          aria-label="Dark theme"
        >
          <Moon size={18} />
        </button>

        <button
          onClick={() => handleThemeChange('system')}
          className={`inline-flex h-8 w-8 items-center justify-center rounded transition-all duration-300 ${
            theme === 'system'
              ? 'bg-[var(--color-bg)] text-[var(--color-primary)] shadow-[var(--neon-glow)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:shadow-[var(--neon-glow)]'
          }`}
          aria-label="Use system theme"
        >
          <Monitor size={18} />
        </button>
      </div>
    </>
  );
}
