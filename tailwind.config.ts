import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Gibson Swarm Color System - Uses CSS variables for dynamic theming
      colors: {
        // Backgrounds (layered depth) - using CSS vars for dynamic updates
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'bg-hover': 'var(--bg-hover)',
        
        // Borders (subtle hierarchy)
        'border-primary': 'var(--border-primary)',
        'border-subtle': 'var(--border-subtle)',
        'border-default': 'var(--border-default)',
        'border-strong': 'var(--border-strong)',
        'border-secondary': 'var(--border-secondary)',
        
        // Text (information hierarchy)
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-accent': 'var(--text-accent)',
        
        // Status Colors (the only saturation)
        'status-active': 'var(--status-active)',
        'status-success': 'var(--status-success)',
        'status-warning': 'var(--status-warning)',
        'status-error': 'var(--status-error)',
        'status-info': 'var(--status-info)',
        
        // Legacy mappings for compatibility
        background: 'var(--bg-primary)',
        foreground: 'var(--text-primary)',
      },
      
      // Typography
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      },
      
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }], // 10px - labels, timestamps
        'xs': ['0.75rem', { lineHeight: '1rem' }],       // 12px - buttons, nav
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],   // 14px - body text
        'base': ['0.8125rem', { lineHeight: '1.375rem' }], // 13px - root
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],   // 18px - headings
      },
      
      // Minimal border radius (terminal aesthetic)
      borderRadius: {
        'none': '0',
        'sm': '2px',
        DEFAULT: '2px',
      },
      
      // Fast, subtle transitions
      transitionDuration: {
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
      },
    },
  },
  plugins: [],
} satisfies Config;
