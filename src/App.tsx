import React from 'react';
import { createTheme, PaletteMode, ThemeProvider } from '@mui/material';
import Body from './Body';
import { grey, blue } from '@mui/material/colors';

export const ColorModeContext = React.createContext({ toggleColorMode: () => { } });

const App: React.VFC = () => {
  const [mode, setMode] = React.useState<PaletteMode>('light');
  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode: PaletteMode) =>
          prevMode === 'light' ? 'dark' : 'light',
        );
      },
    }),
    [],
  );
  const theme = React.useMemo(() => createTheme({
    palette: {
      mode,
      primary: blue,
      ...(mode === "light" ? {
        text: {
          primary: grey[900],
          secondary: grey[800],
        },
      }
        : {
          background: {
            default: "#121212",
          },
          text: {
            primary: '#fff',
            secondary: grey[500],
          },
        })
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: `
        #root {
          backgroundColor: ${mode === "light" ? "#212121" : "white"}
          minHeight: 100vh;
        }
      `,
      },
    }
  }), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <Body />
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
