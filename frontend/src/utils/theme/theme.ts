import { createTheme } from '@mui/material/styles';

// iOS-inspired MUI theme
export const theme = createTheme({
  palette: {
    primary: {
      // iOS system blue
      main: '#0A84FF',
      light: '#409CFF',
      dark: '#0060DF',
      contrastText: '#ffffff',
    },
    secondary: {
      // iOS system pink/red
      main: '#FF2D55',
      light: '#FF667A',
      dark: '#C41E3A',
      contrastText: '#ffffff',
    },
    success: {
      // iOS system green
      main: '#34C759',
    },
    warning: {
      // iOS system yellow
      main: '#FFCC00',
    },
    error: {
      // iOS system red
      main: '#FF3B30',
    },
    info: {
      main: '#5AC8FA',
    },
    background: {
      // iOS grouped background
      default: '#F2F2F7',
      paper: '#FFFFFF',
    },
    grey: {
      // iOS-like grayscale
      50: '#FAFAFC',
      100: '#F2F2F7',
      200: '#E5E5EA',
      300: '#D1D1D6',
      400: '#C7C7CC',
      500: '#AEAEB2',
      600: '#8E8E93',
      700: '#636366',
      800: '#3A3A3C',
      900: '#1C1C1E',
    },
    text: {
      primary: '#1C1C1E',
      secondary: '#636366',
    },
    divider: 'rgba(60, 60, 67, 0.18)',
  },
  typography: {
    // Prefer iOS system font stack
    fontFamily:
      '"SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.15,
      letterSpacing: '-0.5px',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.3px',
    },
    h3: {
      fontSize: '1.875rem',
      fontWeight: 700,
      lineHeight: 1.25,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.35,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.35,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.9375rem',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.8125rem',
      lineHeight: 1.4,
    },
  },
  spacing: 8,
  shape: {
    // iOS-friendly radius
    borderRadius: 14,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F2F2F7',
          color: '#1C1C1E',
          MozOsxFontSmoothing: 'grayscale',
          WebkitFontSmoothing: 'antialiased',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
          padding: '10px 18px',
          minHeight: 44,
        },
        contained: {
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          '&:hover': {
            boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
          },
        },
        outlined: {
          borderColor: 'rgba(60,60,67,0.18)',
          '&:hover': {
            borderColor: 'rgba(60,60,67,0.36)',
            backgroundColor: 'rgba(60,60,67,0.04)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#FFFFFF',
            '& fieldset': {
              borderColor: 'rgba(60,60,67,0.18)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(60,60,67,0.36)',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#636366',
            '&.Mui-focused': {
              color: '#0A84FF',
            },
          },
          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0A84FF',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.7)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          color: '#1C1C1E',
          boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid rgba(60,60,67,0.18)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '4px 8px',
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          '& .MuiInputLabel-root': {
            color: '#636366',
            '&.Mui-focused': {
              color: '#0A84FF',
            },
          },
          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0A84FF',
          },
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.7)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderTop: '1px solid rgba(60,60,67,0.18)',
        },
      },
    },
  },
});