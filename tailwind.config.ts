// tailwind.config.ts
// Style Guide — Estilo Editorial Jornal Moderno
// Fontes: Playfair Display (títulos) + Liberation Sans (corpo)

import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {

      // ─── CORES ────────────────────────────────────────────────────
      colors: {
        accent:     '#F97316', // laranja principal
        'accent-dark': '#9D4300', // laranja escuro / hover
        ink:        '#1A1C1B', // texto principal
        muted:      '#584237', // texto secundário / marrom
        background: '#F4F4F2', // fundo da página
        surface:    '#FFFFFF', // cartões e superfícies elevadas
        border:     '#1A1C1B', // divisores e bordas

        // Escala de opacidades utilitárias do ink
        'ink-80':   'rgba(26, 28, 27, 0.80)',
        'ink-40':   'rgba(26, 28, 27, 0.40)',
        'ink-20':   'rgba(26, 28, 27, 0.20)',
        'ink-10':   'rgba(26, 28, 27, 0.10)',
      },

      // ─── TIPOGRAFIA ───────────────────────────────────────────────
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"Liberation Sans"', '"Arial"', 'sans-serif'],
        sans:    ['"Liberation Sans"', '"Arial"', 'sans-serif'],
        serif:   ['"Playfair Display"', 'Georgia', 'serif'],
        mono:    ['"Fira Code"', '"Courier New"', 'monospace'],
      },

      fontSize: {
        // Corpo
        'caption':  ['0.75rem',  { lineHeight: '1.4', letterSpacing: '0' }],   // 12px
        'sm':       ['0.875rem', { lineHeight: '1.5', letterSpacing: '0' }],   // 14px
        'base':     ['1rem',     { lineHeight: '1.6', letterSpacing: '0' }],   // 16px
        'lead':     ['1.125rem', { lineHeight: '1.6', letterSpacing: '-0.01em' }], // 18px

        // Eyebrow / Label
        'eyebrow':  ['0.6875rem', { lineHeight: '1', letterSpacing: '0.15em' }], // 11px

        // Títulos — Playfair Display
        'h3':       ['1.375rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }], // 22px
        'h2':       ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }], // 30px
        'h1':       ['2.5rem',   { lineHeight: '1.1', letterSpacing: '-0.02em' }], // 40px
        'display':  ['3.5rem',   { lineHeight: '1.05', letterSpacing: '-0.03em' }], // 56px
        'headline': ['4.5rem',   { lineHeight: '1',   letterSpacing: '-0.03em' }], // 72px
      },

      fontWeight: {
        normal:      '400',
        semibold:    '600',
        bold:        '700',
      },

      // ─── ESPAÇAMENTO ──────────────────────────────────────────────
      // Escala editorial baseada em múltiplos de 4px
      spacing: {
        'xs':  '4px',
        'sm':  '8px',
        'md':  '16px',
        'lg':  '24px',
        'xl':  '40px',
        '2xl': '64px',
        '3xl': '96px',
        '4xl': '128px',
      },

      // ─── BORDAS ───────────────────────────────────────────────────
      borderWidth: {
        DEFAULT: '0.5px',
        '1':  '1px',
        '2':  '2px',
        '3':  '3px',  // divisor principal (estilo jornal)
      },

      borderRadius: {
        none:   '0',
        sm:     '2px',  // estilo editorial — quase sem arredondamento
        DEFAULT:'4px',
        md:     '4px',
        lg:     '6px',
        full:   '9999px',
      },

      // ─── GRID EDITORIAL ───────────────────────────────────────────
      gridTemplateColumns: {
        'editorial':   'repeat(12, 1fr)',
        'article-2':   '2fr 1fr',
        'article-3':   '1fr 1fr 1fr',
        'sidebar':     '1fr 320px',
        'wide-sidebar':'1fr 400px',
      },

      // ─── LARGURAS ─────────────────────────────────────────────────
      maxWidth: {
        'prose':    '68ch',   // largura ideal de coluna de texto
        'article':  '720px',
        'layout':   '1200px',
        'wide':     '1440px',
      },

      // ─── SOMBRAS ──────────────────────────────────────────────────
      boxShadow: {
        card:    '0 1px 4px rgba(26, 28, 27, 0.08)',
        raised:  '0 4px 16px rgba(26, 28, 27, 0.12)',
        none:    'none',
      },

      // ─── LINE HEIGHT ──────────────────────────────────────────────
      lineHeight: {
        tight:    '1.1',
        snug:     '1.3',
        normal:   '1.6',
        relaxed:  '1.75',
      },

      // ─── LETTER SPACING ───────────────────────────────────────────
      letterSpacing: {
        tighter: '-0.03em',
        tight:   '-0.02em',
        snug:    '-0.01em',
        normal:  '0',
        wide:    '0.05em',
        wider:   '0.10em',
        widest:  '0.15em', // eyebrow / labels
      },

      // ─── TRANSIÇÕES ───────────────────────────────────────────────
      transitionDuration: {
        DEFAULT: '150ms',
        fast:    '100ms',
        slow:    '300ms',
      },

      transitionTimingFunction: {
        DEFAULT: 'ease-in-out',
      },

    },
  },

  // ─── PLUGINS ──────────────────────────────────────────────────────
  plugins: [
    // Plugin com utilitários customizados para o estilo editorial
    plugin(function ({ addComponents, addUtilities, theme }) {

      // Divisores editoriais
      addUtilities({
        '.divider-thick': {
          borderTop: `3px solid ${theme('colors.ink')}`,
        },
        '.divider-accent': {
          borderTop: `3px solid ${theme('colors.accent')}`,
        },
        '.divider-medium': {
          borderTop: `1.5px solid ${theme('colors.ink')}`,
        },
        '.divider-thin': {
          borderTop: `0.5px solid rgba(26, 28, 27, 0.25)`,
        },
      })

      // Componentes tipográficos prontos
      addComponents({

        // Eyebrow / Categoria
        '.eyebrow': {
          fontFamily: theme('fontFamily.body').join(', '),
          fontSize: '0.6875rem',
          fontWeight: '700',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: theme('colors.accent'),
        },

        // Headline (manchete grande)
        '.headline': {
          fontFamily: theme('fontFamily.display').join(', '),
          fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
          fontWeight: '700',
          lineHeight: '1.05',
          letterSpacing: '-0.03em',
          color: theme('colors.ink'),
        },

        // H1 padrão
        '.article-h1': {
          fontFamily: theme('fontFamily.display').join(', '),
          fontSize: 'clamp(2rem, 4vw, 2.5rem)',
          fontWeight: '700',
          lineHeight: '1.1',
          letterSpacing: '-0.02em',
          color: theme('colors.ink'),
        },

        // H2 padrão
        '.article-h2': {
          fontFamily: theme('fontFamily.display').join(', '),
          fontSize: '1.875rem',
          fontWeight: '600',
          lineHeight: '1.2',
          letterSpacing: '-0.02em',
          color: theme('colors.ink'),
        },

        // H3 itálico (subtítulo de artigo)
        '.article-h3': {
          fontFamily: theme('fontFamily.display').join(', '),
          fontSize: '1.375rem',
          fontWeight: '400',
          fontStyle: 'italic',
          lineHeight: '1.3',
          color: theme('colors.ink'),
        },

        // Texto de corpo
        '.article-body': {
          fontFamily: theme('fontFamily.body').join(', '),
          fontSize: '1rem',
          fontWeight: '400',
          lineHeight: '1.6',
          color: theme('colors.ink'),
          maxWidth: '68ch',
        },

        // Lead / Subtítulo do artigo
        '.article-lead': {
          fontFamily: theme('fontFamily.body').join(', '),
          fontSize: '1.125rem',
          fontWeight: '400',
          lineHeight: '1.6',
          letterSpacing: '-0.01em',
          color: theme('colors.muted'),
          maxWidth: '68ch',
        },

        // Legenda / Caption
        '.caption': {
          fontFamily: theme('fontFamily.body').join(', '),
          fontSize: '0.75rem',
          color: theme('colors.muted'),
          lineHeight: '1.4',
        },

        // Pullquote
        '.pullquote': {
          borderLeft: `4px solid ${theme('colors.accent')}`,
          paddingLeft: '1.25rem',
          paddingTop: '0.75rem',
          paddingBottom: '0.75rem',
          fontFamily: theme('fontFamily.display').join(', '),
          fontSize: '1.25rem',
          fontStyle: 'italic',
          lineHeight: '1.5',
          color: theme('colors.ink'),
          backgroundColor: theme('colors.background'),
        },

        // Botão primário
        '.btn-primary': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          backgroundColor: theme('colors.accent'),
          color: '#ffffff',
          fontFamily: theme('fontFamily.body').join(', '),
          fontSize: '0.875rem',
          fontWeight: '700',
          letterSpacing: '0.03em',
          padding: '10px 20px',
          borderRadius: '2px',
          border: 'none',
          cursor: 'pointer',
          transition: 'background-color 150ms ease-in-out',
          '&:hover': {
            backgroundColor: theme('colors.accent-dark'),
          },
        },

        // Botão secundário
        '.btn-secondary': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          backgroundColor: 'transparent',
          color: theme('colors.ink'),
          fontFamily: theme('fontFamily.body').join(', '),
          fontSize: '0.875rem',
          fontWeight: '700',
          letterSpacing: '0.03em',
          padding: '10px 20px',
          borderRadius: '2px',
          border: `1.5px solid ${theme('colors.ink')}`,
          cursor: 'pointer',
          transition: 'all 150ms ease-in-out',
          '&:hover': {
            backgroundColor: theme('colors.ink'),
            color: '#ffffff',
          },
        },

        // Tag / Badge
        '.tag': {
          display: 'inline-block',
          fontSize: '0.625rem',
          fontWeight: '700',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '4px 10px',
          borderRadius: '2px',
        },
        '.tag-accent': {
          backgroundColor: theme('colors.accent'),
          color: '#ffffff',
        },
        '.tag-dark': {
          backgroundColor: theme('colors.accent-dark'),
          color: '#ffffff',
        },
        '.tag-outline': {
          backgroundColor: 'transparent',
          color: theme('colors.ink'),
          border: `1px solid ${theme('colors.ink')}`,
        },
        '.tag-muted': {
          backgroundColor: theme('colors.muted'),
          color: theme('colors.background'),
        },

        // Card de artigo
        '.card-article': {
          backgroundColor: '#ffffff',
          border: `0.5px solid rgba(26, 28, 27, 0.15)`,
          borderRadius: '4px',
          overflow: 'hidden',
          transition: 'box-shadow 150ms ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(26, 28, 27, 0.12)',
          },
        },

      })
    }),
  ],
};

export default config;
