import { createTheme } from '@mui/material/styles';

// Stanford brand theme
export const theme = createTheme({
  palette: {
    primary: {
      // Stanford Cardinal
      main: '#8C1515',
      light: '#B1040E',
      dark: '#5E0F0F',
      contrastText: '#ffffff',
    },
    secondary: {
      // Stanford Cool Gray
      main: '#4D4F53',
      light: '#6E7074',
      dark: '#343638',
      contrastText: '#ffffff',
    },
    success: {
      main: '#2E7D32',
    },
    warning: {
      main: '#FFB300',
    },
    error: {
      main: '#D32F2F',
    },
    info: {
      main: '#1976D2',
    },
    background: {
      // Stanford Fog and White
      default: '#F4F4F4',
      paper: '#FFFFFF',
    },
    grey: {
      50: '#FAFAFC',
      100: '#F4F4F4',
      200: '#E3E2E0',
      300: '#D6D5D3',
      400: '#C2C1BF',
      500: '#A6A5A3',
      600: '#8B8A88',
      700: '#6F6E6C',
      800: '#535250',
      900: '#2E2D29',
    },
    text: {
      primary: '#2E2D29',
      secondary: '#4D4F53',
    },
    divider: 'rgba(46, 45, 41, 0.18)',
  },
  typography: {
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
          backgroundColor: '#F4F4F4',
          color: '#2E2D29',
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
              borderColor: 'rgba(46,45,41,0.18)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(46,45,41,0.36)',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#4D4F53',
            '&.Mui-focused': {
              color: '#8C1515',
            },
          },
          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#8C1515',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.9)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          color: '#2E2D29',
          boxShadow: '0 1px 0 rgba(140,21,21,0.12)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid rgba(46,45,41,0.18)',
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
            color: '#4D4F53',
            '&.Mui-focused': {
              color: '#8C1515',
            },
          },
          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#8C1515',
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
          borderTop: '1px solid rgba(46,45,41,0.18)',
        },
      },
    },
  },
});