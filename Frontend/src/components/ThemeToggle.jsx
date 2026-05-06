import useTheme from './useTheme';

export default function ThemeToggle({ label = false }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light theme' : 'Dark theme'}
      className="h-10 min-w-10 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface flex items-center justify-center gap-2 px-3 hover:bg-surface-container-high transition-colors"
    >
      <span className="material-symbols-outlined text-[20px]">
        {isDark ? 'light_mode' : 'dark_mode'}
      </span>
      {label && (
        <span className="text-label-bold font-label-bold">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
}
