import { useQuery } from '@tanstack/react-query';
import { Box, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';

interface PowerData {
  power_kw: number;
  voltage_v: number;
  current_a: number;
  temperature_c: number;
  timestamp: string;
  is_verified: boolean;
}

const PowerReading = () => {
  const { data, isLoading, error } = useQuery<PowerData>({
    queryKey: ['powerReading'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/api/v1/readings/latest');
      return response.data;
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <Typography color="error">Error loading power data</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h3" component="div" gutterBottom>
        {data?.power_kw.toFixed(2)} kW
      </Typography>
      <Box display="flex" justifyContent="space-between" mt={2}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Voltage
          </Typography>
          <Typography variant="h6">
            {data?.voltage_v.toFixed(1)} V
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Current
          </Typography>
          <Typography variant="h6">
            {data?.current_a.toFixed(1)} A
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Temperature
          </Typography>
          <Typography variant="h6">
            {data?.temperature_c.toFixed(1)} °C
          </Typography>
        </Box>
      </Box>
      <Box mt={2}>
        <Typography variant="body2" color={data?.is_verified ? 'success.main' : 'error.main'}>
          {data?.is_verified ? '✓ Verified' : '⚠ Unverified'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Last updated: {new Date(data?.timestamp || '').toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default PowerReading; 