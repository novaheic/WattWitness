import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { api, PowerReading } from '../services/api';
// import { useBlockchainData } from './useBlockchainData';
import { blockchainService } from '../services/blockchain';

// Hook to get the first available installation ID
export const useInstallation = () => {
  return useQuery({
    queryKey: ['installations', 'v2'],
    queryFn: api.getInstallations,
    select: (installations) => {
      // Find the installation with the actual ESP32 MAC address (EC64C9C05E97)
      const realInstallation = installations.find(inst => inst.shelly_mac === 'EC64C9C05E97');
      
      // Fallback: find first installation with non-empty, non-test MAC
      if (!realInstallation) {
        const nonTestInstallation = installations.find(inst => 
          inst.shelly_mac && 
          inst.shelly_mac.trim() !== '' && 
          !inst.shelly_mac.startsWith('TEST')
        );
        return nonTestInstallation || installations[0];
      }
      
      return realInstallation;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - installations don't change often
    refetchInterval: false, // Don't refetch installations automatically
  });
};

// Hook to get latest power reading
export const useLatestReading = (installationId: number | undefined) => {
  return useQuery({
    queryKey: ['latest-reading', installationId],
    queryFn: () => api.getLatestReading(installationId!),
    enabled: !!installationId, // Only run if installationId is available
    staleTime: 0, // Always consider data stale to get fresh timestamps
    refetchInterval: 5000, // Poll every 5 seconds as backup
    refetchIntervalInBackground: false,
  });
};

// Hook to get weekly average power
export const useWeeklyAverage = (installationId: number | undefined) => {
  return useQuery({
    queryKey: ['weekly-average', installationId],
    queryFn: () => api.getWeeklyAverage(installationId!),
    enabled: !!installationId,
    staleTime: 0, // Always consider data stale
    refetchInterval: 30000, // Refresh every 30 seconds (less frequent)
    refetchIntervalInBackground: false,
  });
};

// Hook to get recent readings for LatestRecords component
export const useRecentReadings = (installationId: number | undefined, limit: number = 10) => {
  return useQuery({
    queryKey: ['recent-readings', installationId, limit],
    queryFn: async () => {
      const readings = await api.getReadings(installationId!);
      return readings.slice(0, limit); // Get only the most recent ones
    },
    enabled: !!installationId,
    staleTime: 0, // Always consider data stale
    refetchInterval: 5000, // Refresh every 5 seconds as backup
    refetchIntervalInBackground: false,
  });
};

// Hook to get system health status
export const useSystemHealth = () => {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: api.healthCheck,
    staleTime: 0, // Always consider data stale
    refetchInterval: 30000, // Check health every 30 seconds
    refetchIntervalInBackground: false,
  });
};

// Hook to get device information for GeneralInfo component
export const useDeviceInfo = (installationId: number | undefined) => {
  return useQuery({
    queryKey: ['device-info', installationId],
    queryFn: () => api.getDeviceInfo(installationId!),
    enabled: !!installationId,
    staleTime: 0, // Always consider data stale
    refetchInterval: 5000, // Refresh every 5 seconds as backup
    refetchIntervalInBackground: false,
  });
};

// Hook to get total production for a specific time frame
export const useTotalProduction = (installationId: number | undefined, timeFrame: string) => {
  return useQuery({
    queryKey: ['total-production', installationId, timeFrame],
    queryFn: () => api.getTotalProduction(installationId!, timeFrame),
    enabled: !!installationId,
    staleTime: 0, // Always consider data stale
    refetchInterval: 10000, // Refresh every 10 seconds as backup
    refetchIntervalInBackground: false,
    refetchOnMount: true, // Force refresh when component mounts
    refetchOnWindowFocus: true, // Force refresh when window gains focus
  });
};

// Hook to get lifetime production
export const useLifetimeProduction = (installationId: number | undefined) => {
  return useQuery({
    queryKey: ['lifetime-production', installationId, 'v3'],
    queryFn: () => api.getLifetimeProduction(installationId!),
    enabled: !!installationId,
    staleTime: 0, // Always consider data stale
    refetchInterval: 10000, // Refresh every 10 seconds as backup
    refetchIntervalInBackground: false,
    refetchOnMount: true, // Force refresh when component mounts
    refetchOnWindowFocus: true, // Force refresh when window gains focus
  });
};

// Hook to get chart data for EnergyChart component
export const useChartData = (installationId: number | undefined, timeFrame: string) => {
  return useQuery({
    queryKey: ['chart-data', installationId, timeFrame, 'v2'],
    queryFn: () => api.getChartData(installationId!, timeFrame),
    enabled: !!installationId,
    staleTime: 0, // Always consider data stale
    refetchInterval: 10000, // Refresh every 10 seconds as backup
    refetchIntervalInBackground: false,
    refetchOnMount: true, // Force refresh when component mounts
    refetchOnWindowFocus: true, // Force refresh when window gains focus
  });
};

// Hook to check internet connectivity
export const useInternetStatus = () => {
  return useQuery({
    queryKey: ['internet-status'],
    queryFn: async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        try {
          // Use a GET request to a reliable, CORS-friendly resource
          await fetch('https://www.google.com/favicon.ico', {
            method: 'GET',
            mode: 'no-cors',
            cache: 'no-cache',
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          // If fetch does not throw, assume online
          return true;
        } catch (error) {
          clearTimeout(timeoutId);
          return false;
        }
      } catch {
        return false;
      }
    },
    staleTime: 0,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });
};

// Hook to check if ESP32 is live (has recent readings)
export const useESP32Status = (installationId: number | undefined) => {
  return useQuery({
    queryKey: ['esp32-status', installationId],
    queryFn: async () => {
      if (!installationId) return false;
      
      try {
        const latestReading = await api.getLatestReading(installationId);
        const now = Math.floor(Date.now() / 1000);
        const timeSinceLastReading = now - latestReading.timestamp;
        
        // Consider ESP32 live if last reading was within the last 2 minutes
        // (ESP32 sends data every 10 seconds, so 2 minutes gives some buffer)
        return timeSinceLastReading <= 120;
      } catch (error) {
        console.warn('ESP32 status check failed:', error);
        return false;
      }
    },
    enabled: !!installationId,
    staleTime: 0, // Always check
    refetchInterval: 10000, // Check every 10 seconds
    refetchIntervalInBackground: false,
  });
};

// Hook to check if blockchain is up to date (has records within last 20 minutes)
// Uses cached blockchain service data to avoid duplicate requests
export const useBlockchainStatus = () => {
  return useQuery({
    queryKey: ['blockchain-status'],
    queryFn: async () => {
      try {
        // Use cached blockchain service data to avoid duplicate API calls
        const records = await blockchainService.getRecentTransactions();
        
        if (records.length === 0) {
          return false;
        }
        
        // Check if the most recent blockchain record is within the last 20 minutes
        const latestRecord = records[0]; // Records are sorted most recent first
        if (!latestRecord) return false;
        
        // Parse the timestamp from the latest record (format: "2024-01-01 12:00:00 UTC")
        const recordTime = new Date(latestRecord.timestamp.replace(' UTC', 'Z'));
        const now = new Date();
        const timeDiffMinutes = (now.getTime() - recordTime.getTime()) / (1000 * 60);
        
        // Consider up to date if latest record is within 20 minutes
        return timeDiffMinutes <= 20;
      } catch (error) {
        console.warn('Blockchain status check failed:', error);
        return false;
      }
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchInterval: 60000, // Check every minute (less frequent)
    refetchIntervalInBackground: false,
  });
};

// Custom hook to monitor for new ESP32 data and trigger refreshes
export const useESP32DataMonitor = (installationId: number | undefined) => {
  const queryClient = useQueryClient();
  const lastDataRef = useRef<PowerReading | null>(null);
  
  const { data: currentData } = useQuery({
    queryKey: ['esp32-monitor', installationId],
    queryFn: () => api.getLatestReading(installationId!),
    enabled: !!installationId,
    staleTime: 0,
    refetchInterval: 1000, // Check every second for new data
    refetchIntervalInBackground: false,
  });

  // Monitor for new data and trigger refreshes
  useEffect(() => {
    if (currentData && (!lastDataRef.current || 
        currentData.timestamp !== lastDataRef.current.timestamp || 
        currentData.id !== lastDataRef.current.id)) {
      
      console.log('New ESP32 data detected, triggering dashboard refresh:', {
        previousTimestamp: lastDataRef.current?.timestamp,
        newTimestamp: currentData.timestamp,
        previousId: lastDataRef.current?.id,
        newId: currentData.id
      });
      
      // Invalidate all related queries to trigger fresh data fetch
      queryClient.invalidateQueries({ queryKey: ['latest-reading', installationId] });
      queryClient.invalidateQueries({ queryKey: ['total-production'] });
      queryClient.invalidateQueries({ queryKey: ['lifetime-production'] });
      queryClient.invalidateQueries({ queryKey: ['recent-readings'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-average'] });
      queryClient.invalidateQueries({ queryKey: ['device-info'] });
      queryClient.invalidateQueries({ queryKey: ['chart-data'] });
      queryClient.invalidateQueries({ queryKey: ['esp32-status'] });
      
      // Update the reference
      lastDataRef.current = currentData;
    }
  }, [currentData, installationId, queryClient]);

  return currentData;
}; 