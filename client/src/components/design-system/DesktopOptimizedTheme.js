// client/src/components/design-system/DesktopOptimizedTheme.js
// Desktop-First Design System for Pharmaceutical Intelligence Platform

export const desktopTheme = {
  // Breakpoints optimized for professional desktop usage
  breakpoints: {
    desktop: '1200px',
    largeDesktop: '1600px',
    ultraWide: '2000px',
    workstation: '2400px'
  },

  // Color palette for pharmaceutical intelligence
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe', 
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // Primary blue
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a'
    },
    danger: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444', // Critical red
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d'
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b', // Warning amber
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f'
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#10b981', // Success green
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b'
    },
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
    }
  },

  // Typography optimized for data-heavy desktop interfaces
  typography: {
    fontFamily: {
      sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      mono: ['Monaco', 'Consolas', 'Liberation Mono', 'monospace'],
      display: ['Inter', 'sans-serif']
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem'     // 48px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    }
  },

  // Spacing system for desktop layouts
  spacing: {
    px: '1px',
    0: '0',
    1: '0.25rem',    // 4px
    2: '0.5rem',     // 8px
    3: '0.75rem',    // 12px
    4: '1rem',       // 16px
    5: '1.25rem',    // 20px
    6: '1.5rem',     // 24px
    8: '2rem',       // 32px
    10: '2.5rem',    // 40px
    12: '3rem',      // 48px
    16: '4rem',      // 64px
    20: '5rem',      // 80px
    24: '6rem',      // 96px
    32: '8rem'       // 128px
  },

  // Shadows for depth and hierarchy
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  },

  // Border radius for modern interface elements
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    full: '9999px'
  },

  // Component-specific design tokens
  components: {
    // Executive Dashboard Cards
    dashboardCard: {
      padding: '1.5rem',
      borderRadius: '0.75rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      minHeight: '400px'
    },

    // Metric Cards
    metricCard: {
      padding: '2rem',
      borderRadius: '0.75rem',
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
      border: '1px solid #e5e7eb',
      minHeight: '160px'
    },

    // Data Tables
    dataTable: {
      backgroundColor: '#ffffff',
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      headerBackgroundColor: '#f9fafb',
      rowHoverColor: '#f9fafb',
      borderColor: '#e5e7eb'
    },

    // Patent Risk Badges
    riskBadge: {
      critical: {
        backgroundColor: '#fef2f2',
        color: '#ef4444',
        borderColor: '#fecaca'
      },
      high: {
        backgroundColor: '#fffbeb',
        color: '#f59e0b',
        borderColor: '#fed7aa'
      },
      medium: {
        backgroundColor: '#eff6ff',
        color: '#3b82f6',
        borderColor: '#bfdbfe'
      },
      low: {
        backgroundColor: '#f0fdf4',
        color: '#10b981',
        borderColor: '#bbf7d0'
      }
    },

    // Action Buttons
    button: {
      primary: {
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        hoverBackgroundColor: '#2563eb',
        padding: '0.75rem 1.5rem',
        borderRadius: '0.5rem',
        fontWeight: 500
      },
      secondary: {
        backgroundColor: '#f3f4f6',
        color: '#4b5563',
        hoverBackgroundColor: '#e5e7eb',
        border: '1px solid #d1d5db',
        padding: '0.75rem 1.5rem',
        borderRadius: '0.5rem'
      },
      danger: {
        backgroundColor: '#ef4444',
        color: '#ffffff',
        hoverBackgroundColor: '#dc2626',
        padding: '0.75rem 1.5rem',
        borderRadius: '0.5rem'
      }
    },

    // Form Elements
    input: {
      padding: '0.75rem',
      borderRadius: '0.5rem',
      border: '1px solid #d1d5db',
      backgroundColor: '#ffffff',
      focusBorderColor: '#3b82f6',
      fontSize: '0.875rem'
    },

    // Navigation
    navbar: {
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      padding: '1rem 2rem',
      height: '72px'
    },

    // Sidebar for desktop navigation
    sidebar: {
      backgroundColor: '#f9fafb',
      borderRight: '1px solid #e5e7eb',
      width: '256px',
      padding: '1.5rem',
      minHeight: '100vh'
    }
  },

  // Grid system for desktop layouts
  grid: {
    container: {
      maxWidth: {
        desktop: '1200px',
        largeDesktop: '1600px',
        ultraWide: '2000px',
        workstation: '2400px'
      },
      padding: '2rem',
      margin: '0 auto'
    },
    columns: 12,
    gutters: {
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
      xl: '2.5rem'
    }
  },

  // Animation and transitions
  transitions: {
    fast: '150ms ease-out',
    normal: '250ms ease-out',
    slow: '350ms ease-out'
  },

  // Z-index scale for layering
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800
  }
}

// CSS Custom Properties Generator
export const generateCSSCustomProperties = (theme) => {
  const cssVars = {}
  
  // Convert theme colors to CSS custom properties
  Object.entries(theme.colors).forEach(([colorName, shades]) => {
    if (typeof shades === 'object') {
      Object.entries(shades).forEach(([shade, value]) => {
        cssVars[`--color-${colorName}-${shade}`] = value
      })
    } else {
      cssVars[`--color-${colorName}`] = shades
    }
  })

  // Convert spacing to CSS custom properties
  Object.entries(theme.spacing).forEach(([key, value]) => {
    cssVars[`--spacing-${key}`] = value
  })

  // Convert typography to CSS custom properties
  Object.entries(theme.typography.fontSize).forEach(([size, value]) => {
    cssVars[`--font-size-${size}`] = value
  })

  return cssVars
}

// Utility functions for responsive design
export const mediaQueries = {
  desktop: `@media (min-width: ${desktopTheme.breakpoints.desktop})`,
  largeDesktop: `@media (min-width: ${desktopTheme.breakpoints.largeDesktop})`,
  ultraWide: `@media (min-width: ${desktopTheme.breakpoints.ultraWide})`,
  workstation: `@media (min-width: ${desktopTheme.breakpoints.workstation})`
}

// Component style generators
export const createComponentStyles = (component, variant = 'default') => {
  const baseStyles = desktopTheme.components[component]
  if (!baseStyles) return {}

  if (variant !== 'default' && baseStyles[variant]) {
    return { ...baseStyles, ...baseStyles[variant] }
  }

  return baseStyles
}

// Semantic color helpers
export const getSemanticColor = (type, shade = 500) => {
  const colorMap = {
    primary: desktopTheme.colors.primary[shade],
    danger: desktopTheme.colors.danger[shade],
    warning: desktopTheme.colors.warning[shade],
    success: desktopTheme.colors.success[shade],
    neutral: desktopTheme.colors.neutral[shade]
  }
  
  return colorMap[type] || desktopTheme.colors.neutral[shade]
}

// Layout utilities
export const createLayoutGrid = (columns = 12, gap = 'md') => {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: desktopTheme.grid.gutters[gap] || desktopTheme.grid.gutters.md
  }
}

// Export default theme
export default desktopTheme