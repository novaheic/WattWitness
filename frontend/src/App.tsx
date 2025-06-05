import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PowerReading from './components/PowerReading';
import Grid from './components/Grid';

// Create a theme instance
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {/* Header */}
          <Box component="header" sx={{ py: 2, bgcolor: 'primary.dark' }}>
            <Container maxWidth="lg">
              <Typography variant="h4" component="h1" gutterBottom>
                WattWitness Dashboard
              </Typography>
            </Container>
          </Box>

          {/* Main Content */}
          <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Grid container spacing={3}>
                {/* Real-time Power Reading */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
                    <Typography component="h2" variant="h6" color="primary" gutterBottom>
                      Current Power Output
                    </Typography>
                    <PowerReading />
                  </Paper>
                </Grid>

                {/* System Status */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
                    <Typography component="h2" variant="h6" color="primary" gutterBottom>
                      System Status
                    </Typography>
                    {/* System status component will go here */}
                  </Paper>
                </Grid>

                {/* Historical Data Chart */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400 }}>
                    <Typography component="h2" variant="h6" color="primary" gutterBottom>
                      Power Production History
                    </Typography>
                    {/* Chart component will go here */}
                  </Paper>
                </Grid>

                {/* Blockchain Verification Status */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
                    <Typography component="h2" variant="h6" color="primary" gutterBottom>
                      Blockchain Verification Status
                    </Typography>
                    {/* Blockchain status component will go here */}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Container>

          {/* Footer */}
          <Box component="footer" sx={{ py: 2, bgcolor: 'primary.dark' }}>
            <Container maxWidth="lg">
              <Typography variant="body2" color="text.secondary" align="center">
                WattWitness - Trustless Tamperproof Electricity Production Meter
              </Typography>
            </Container>
          </Box>
        </Box>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
