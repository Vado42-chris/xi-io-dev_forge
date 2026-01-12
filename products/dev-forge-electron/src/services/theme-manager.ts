/**
 * Theme Manager
 * 
 * Manages themes and appearance customization.
 * Supports Xibalba Framework themes and custom themes.
 */

export interface Theme {
  id: string;
  name: string;
  displayName: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  styles: ThemeStyles;
  isDark: boolean;
}

export interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  accent: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export interface ThemeFonts {
  tallThin: string;
  tech: string;
  body: string;
}

export interface ThemeStyles {
  borderRadius: string;
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export class ThemeManager {
  private themes: Map<string, Theme> = new Map();
  private currentThemeId: string = 'xibalba-dark';
  private statusCallbacks: Set<(theme: Theme) => void> = new Set();

  constructor() {
    this.initializeDefaultThemes();
  }

  /**
   * Initialize default themes
   */
  private initializeDefaultThemes(): void {
    // Xibalba Dark Theme
    const xibalbaDark: Theme = {
      id: 'xibalba-dark',
      name: 'xibalba-dark',
      displayName: 'Xibalba Dark',
      isDark: true,
      colors: {
        background: '#050505',
        surface: '#1e1e1e',
        primary: '#007acc',
        secondary: '#2d2d2d',
        accent: '#007acc',
        text: {
          primary: '#FFFFFF',
          secondary: '#CCCCCC',
          disabled: '#858585',
        },
        border: '#2d2d2d',
        error: '#dc3545',
        warning: '#ffc107',
        success: '#28a745',
        info: '#17a2b8',
      },
      fonts: {
        tallThin: "'Antonio', sans-serif",
        tech: "'JetBrains Mono', monospace",
        body: "'Inter', sans-serif",
      },
      styles: {
        borderRadius: '4px',
        spacing: {
          xs: '4px',
          sm: '8px',
          md: '16px',
          lg: '24px',
          xl: '32px',
        },
      },
    };

    // Xibalba Light Theme
    const xibalbaLight: Theme = {
      id: 'xibalba-light',
      name: 'xibalba-light',
      displayName: 'Xibalba Light',
      isDark: false,
      colors: {
        background: '#FFFFFF',
        surface: '#F5F5F5',
        primary: '#007acc',
        secondary: '#E0E0E0',
        accent: '#007acc',
        text: {
          primary: '#000000',
          secondary: '#333333',
          disabled: '#999999',
        },
        border: '#CCCCCC',
        error: '#dc3545',
        warning: '#ffc107',
        success: '#28a745',
        info: '#17a2b8',
      },
      fonts: {
        tallThin: "'Antonio', sans-serif",
        tech: "'JetBrains Mono', monospace",
        body: "'Inter', sans-serif",
      },
      styles: {
        borderRadius: '4px',
        spacing: {
          xs: '4px',
          sm: '8px',
          md: '16px',
          lg: '24px',
          xl: '32px',
        },
      },
    };

    this.themes.set(xibalbaDark.id, xibalbaDark);
    this.themes.set(xibalbaLight.id, xibalbaLight);
  }

  /**
   * Get all themes
   */
  getAllThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  /**
   * Get theme by ID
   */
  getTheme(id: string): Theme | undefined {
    return this.themes.get(id);
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): Theme {
    return this.themes.get(this.currentThemeId) || this.themes.get('xibalba-dark')!;
  }

  /**
   * Set current theme
   */
  setTheme(id: string): void {
    const theme = this.themes.get(id);
    if (!theme) {
      throw new Error(`Theme ${id} not found`);
    }

    this.currentThemeId = id;
    this.applyTheme(theme);
    this.notifyStatusChange(theme);
  }

  /**
   * Apply theme to document
   */
  private applyTheme(theme: Theme): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const colors = theme.colors;
    const fonts = theme.fonts;
    const styles = theme.styles;

    // Apply CSS variables
    root.style.setProperty('--xibalba-bg', colors.background);
    root.style.setProperty('--xibalba-surface', colors.surface);
    root.style.setProperty('--xibalba-primary', colors.primary);
    root.style.setProperty('--xibalba-secondary', colors.secondary);
    root.style.setProperty('--xibalba-accent', colors.accent);
    root.style.setProperty('--xibalba-text-primary', colors.text.primary);
    root.style.setProperty('--xibalba-text-secondary', colors.text.secondary);
    root.style.setProperty('--xibalba-text-disabled', colors.text.disabled);
    root.style.setProperty('--xibalba-border', colors.border);
    root.style.setProperty('--xibalba-error', colors.error);
    root.style.setProperty('--xibalba-warning', colors.warning);
    root.style.setProperty('--xibalba-success', colors.success);
    root.style.setProperty('--xibalba-info', colors.info);

    root.style.setProperty('--font-tall-thin', fonts.tallThin);
    root.style.setProperty('--font-tech', fonts.tech);
    root.style.setProperty('--font-body', fonts.body);

    root.style.setProperty('--border-radius', styles.borderRadius);
    root.style.setProperty('--spacing-xs', styles.spacing.xs);
    root.style.setProperty('--spacing-sm', styles.spacing.sm);
    root.style.setProperty('--spacing-md', styles.spacing.md);
    root.style.setProperty('--spacing-lg', styles.spacing.lg);
    root.style.setProperty('--spacing-xl', styles.spacing.xl);

    // Set theme attribute
    root.setAttribute('data-theme', theme.id);
    document.body.setAttribute('data-theme', theme.id);
    document.body.setAttribute('data-dark', theme.isDark.toString());
  }

  /**
   * Create custom theme
   */
  createTheme(theme: Omit<Theme, 'id'>): Theme {
    const newTheme: Theme = {
      ...theme,
      id: `theme-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    this.themes.set(newTheme.id, newTheme);
    return newTheme;
  }

  /**
   * Update theme
   */
  updateTheme(id: string, updates: Partial<Theme>): void {
    const theme = this.themes.get(id);
    if (theme) {
      Object.assign(theme, updates);
      if (id === this.currentThemeId) {
        this.applyTheme(theme);
        this.notifyStatusChange(theme);
      }
    }
  }

  /**
   * Delete theme
   */
  deleteTheme(id: string): void {
    if (id === this.currentThemeId) {
      throw new Error('Cannot delete current theme');
    }
    this.themes.delete(id);
  }

  /**
   * Export theme
   */
  exportTheme(id: string): string {
    const theme = this.themes.get(id);
    if (!theme) {
      throw new Error(`Theme ${id} not found`);
    }
    return JSON.stringify(theme, null, 2);
  }

  /**
   * Import theme
   */
  importTheme(themeJson: string): Theme {
    try {
      const theme = JSON.parse(themeJson) as Theme;
      if (!theme.id || !theme.name) {
        throw new Error('Invalid theme format');
      }
      this.themes.set(theme.id, theme);
      return theme;
    } catch (error) {
      throw new Error(`Invalid theme format: ${error}`);
    }
  }

  /**
   * Subscribe to theme changes
   */
  onThemeChange(callback: (theme: Theme) => void): () => void {
    this.statusCallbacks.add(callback);
    
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Notify status change
   */
  private notifyStatusChange(theme: Theme): void {
    this.statusCallbacks.forEach(callback => {
      try {
        callback(theme);
      } catch (error) {
        console.error('[ThemeManager] Error in status callback:', error);
      }
    });
  }
}

// Singleton instance
export const themeManager = new ThemeManager();

