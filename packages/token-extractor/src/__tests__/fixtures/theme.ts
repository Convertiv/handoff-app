// Sample TypeScript theme object
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: {
      sans: string;
      mono: string;
    };
    fontSize: {
      sm: string;
      base: string;
      lg: string;
      xl: string;
    };
  };
}

const theme: Theme = {
  colors: {
    primary: '#0ea5e9',
    secondary: '#8b5cf6',
    background: '#ffffff',
    text: '#1f2937',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"Fira Code", monospace',
    },
    fontSize: {
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '24px',
    },
  },
};

export default theme;
