import axios from 'axios';

// API base URL - configurable via environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// TypeScript interfaces matching backend models
export interface PowerReading {
  id: number;
  installation_id: number;
  power_w: number;
  total_wh: number;
  timestamp: number;
  signature: string;
  is_verified: boolean;
  verification_timestamp: string | null;
  is_on_chain: boolean;
  blockchain_tx_hash: string | null;
  blockchain_block_number: number | null;
  created_at: string;
}

export interface SolarInstallation {
  id: number;
  name: string;
  shelly_mac: string;
  public_key: string;
  created_at: string;
  is_active: boolean;
  last_boot_timestamp?: number;
}

// Chart data interfaces
export interface ChartDataPoint {
  label: string;
  value: number;
  timestamp: number;
}

export interface ChartDataResponse {
  data_points: ChartDataPoint[];
  time_frame: string;
  total_energy: number;
}

// API functions
export const api = {
  // Get all installations (we'll need to add this endpoint to backend)
  async getInstallations(): Promise<SolarInstallation[]> {
    const response = await apiClient.get('/api/v1/installations/');
    return response.data;
  },

  // Get latest power reading for an installation
  async getLatestReading(installationId: number): Promise<PowerReading> {
    const response = await apiClient.get(`/api/v1/readings/latest/${installationId}`);
    return response.data;
  },

  // Get power readings for an installation with optional time range
  async getReadings(
    installationId: number, 
    startTime?: string, 
    endTime?: string,
    verifiedOnly: boolean = true
  ): Promise<PowerReading[]> {
    const params = new URLSearchParams();
    if (startTime) params.append('start_time', startTime);
    if (endTime) params.append('end_time', endTime);
    params.append('verified_only', verifiedOnly.toString());
    
    const response = await apiClient.get(`/api/v1/readings/${installationId}?${params}`);
    return response.data;
  },

  // Get readings that haven't been submitted to blockchain yet (for pending transaction)
  async getUnprocessedReadings(installationId: number): Promise<PowerReading[]> {
    const params = new URLSearchParams();
    params.append('verified_only', 'true');
    params.append('on_chain_only', 'false'); // Get readings not yet on chain
    
    const response = await apiClient.get(`/api/v1/readings/${installationId}?${params}`);
    // Filter to only readings that aren't on chain yet
    return response.data.filter((reading: PowerReading) => !reading.is_on_chain);
  },

  // Get ONLY the most recent unprocessed readings (for pending transaction calculation)
  async getRecentUnprocessedReadings(installationId: number, limit: number = 15): Promise<PowerReading[]> {
    console.log(`🔍 Fetching readings from the last 3 minutes only`);
    
    // Get readings only from the last 3 minutes to ensure we get the truly recent ones
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 3 * 60 * 1000); // 3 minutes ago
    
    const params = new URLSearchParams();
    params.append('verified_only', 'true');
    params.append('on_chain_only', 'false'); // Get readings not yet on chain
    params.append('start_time', startTime.toISOString());
    params.append('end_time', endTime.toISOString());
    
    console.log(`🔍 Fetching readings between:`, {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    });
    
    const response = await apiClient.get(`/api/v1/readings/${installationId}?${params}`);
    
    // Filter to only readings that aren't on chain yet
    const unprocessedReadings = response.data.filter((reading: PowerReading) => !reading.is_on_chain);
    
    // Sort by timestamp descending (most recent first) and take only the limit
    const recentReadings = unprocessedReadings
      .sort((a: PowerReading, b: PowerReading) => b.timestamp - a.timestamp)
      .slice(0, limit);
    
    console.log(`🔍 Got ${recentReadings.length} readings from last 3 minutes:`, {
      totalUnprocessed: unprocessedReadings.length,
      takingMostRecent: recentReadings.length,
      timeSpan: recentReadings.length > 1 ? 
        `${((recentReadings[0].timestamp - recentReadings[recentReadings.length - 1].timestamp) / 60).toFixed(1)} minutes` : 'N/A',
      firstTotalWh: recentReadings[0]?.total_wh,
      lastTotalWh: recentReadings[recentReadings.length - 1]?.total_wh,
      energyDiff: recentReadings.length > 1 ? 
        (recentReadings[0].total_wh - recentReadings[recentReadings.length - 1].total_wh) : 0
    });
    
    return recentReadings;
  },

  // Get optimized power readings using backend aggregation and smart sampling
  async getSampledReadings(
    installationId: number,
    startTime?: string,
    endTime?: string,
    maxReadings: number = 100, // Maximum number of readings to return
    verifiedOnly: boolean = true
  ): Promise<PowerReading[]> {
    console.log(`Fetching optimized readings with max limit: ${maxReadings}`);
    
    try {
      // Try the new optimized endpoint first
      const params = new URLSearchParams();
      if (startTime) params.append('start_time', startTime);
      if (endTime) params.append('end_time', endTime);
      params.append('max_points', maxReadings.toString());
      params.append('verified_only', verifiedOnly.toString());
      
      const response = await apiClient.get(`/api/v1/readings/${installationId}/optimized?${params}`);
      console.log(`Received ${response.data.length} optimized readings from backend`);
      return response.data;
      
    } catch (error) {
      console.warn('Optimized endpoint not available, falling back to client-side sampling');
      
      // Fallback to old method
      const allReadings = await this.getReadings(installationId, startTime, endTime, verifiedOnly);
      
      if (allReadings.length <= maxReadings) {
        console.log(`Got ${allReadings.length} readings (within limit)`);
        return allReadings;
      }
      
      // Sample readings by taking every Nth reading
      const sampleInterval = Math.floor(allReadings.length / maxReadings);
      const sampledReadings: PowerReading[] = [];
      
      for (let i = 0; i < allReadings.length; i += sampleInterval) {
        sampledReadings.push(allReadings[i]);
        if (sampledReadings.length >= maxReadings) break;
      }
      
      console.log(`Sampled ${sampledReadings.length} readings from ${allReadings.length} total (every ${sampleInterval}th reading)`);
      return sampledReadings;
    }
  },

  // Get ALL power readings for an installation (for lifetime calculations)
  async getAllReadings(
    installationId: number,
    verifiedOnly: boolean = true
  ): Promise<PowerReading[]> {
    const params = new URLSearchParams();
    params.append('verified_only', verifiedOnly.toString());
    
    const response = await apiClient.get(`/api/v1/readings/${installationId}/all?${params}`);
    return response.data;
  },

  // Get 7-day average power (calculated from sampled readings)
  async getWeeklyAverage(installationId: number): Promise<number> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    
    console.log(`Fetching weekly average for installation ${installationId} from ${startTime.toISOString()} to ${endTime.toISOString()}`);
    
    // Smart sampling: For weekly average, we only need ~200 readings max
    // This reduces 60k+ readings to ~200 readings for much faster calculation
    const readings = await this.getSampledReadings(
      installationId,
      startTime.toISOString(),
      endTime.toISOString(),
      200, // Limit to 200 readings max
      true
    );
    
    console.log(`Found ${readings.length} sampled readings for weekly average calculation`);
    
    if (readings.length === 0) {
      console.log('No readings found for weekly average, returning 0');
      return 0;
    }
    
    const totalPower = readings.reduce((sum, reading) => sum + reading.power_w, 0);
    const average = totalPower / readings.length;
    
    console.log(`Weekly average calculated: ${average}W from ${readings.length} sampled readings`);
    return average;
  },

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Get device information for GeneralInfo component
  async getDeviceInfo(installationId: number): Promise<{
    deviceName: string;
    publicKey: string;
    macAddress: string;
    lastPing: string;
    lastBoot: string;
  }> {
    // Get installation details
    const installations = await this.getInstallations();
    const installation = installations.find(inst => inst.id === installationId);
    
    if (!installation) {
      throw new Error('Installation not found');
    }

    // Get latest reading to determine last ping time and last boot time
    const latestReading = await this.getLatestReading(installationId);
    const lastPingTime = new Date(latestReading.timestamp * 1000);
    const now = new Date();
    const timeSinceLastPing = Math.floor((now.getTime() - lastPingTime.getTime()) / 1000); // seconds

    console.log('Device Info Debug:', {
      esp32Timestamp: latestReading.timestamp,
      latestReadingCreatedAt: latestReading.created_at,
      lastPingTime: lastPingTime.toISOString(),
      now: now.toISOString(),
      timeSinceLastPingSeconds: timeSinceLastPing
    });

    // Format time since last ping
    let lastPingFormatted: string;
    if (timeSinceLastPing < 60) {
      lastPingFormatted = `${timeSinceLastPing}s`;
    } else if (timeSinceLastPing < 3600) {
      lastPingFormatted = `${Math.floor(timeSinceLastPing / 60)}m${timeSinceLastPing % 60}s`;
    } else {
      const hours = Math.floor(timeSinceLastPing / 3600);
      const minutes = Math.floor((timeSinceLastPing % 3600) / 60);
      lastPingFormatted = `${hours}h${minutes}m`;
    }

    console.log('Formatted last ping:', lastPingFormatted);

    // Use the actual boot timestamp from the installation
    const lastBootTime = installation.last_boot_timestamp 
      ? new Date(installation.last_boot_timestamp * 1000)
      : new Date(installation.created_at); // Fallback to creation time if no boot timestamp
    const lastBootFormatted = lastBootTime.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });

    return {
      deviceName: installation.name,
      publicKey: installation.public_key,
      macAddress: installation.shelly_mac,
      lastPing: lastPingFormatted,
      lastBoot: lastBootFormatted
    };
  },

  // Get total energy production for a specific time frame
  async getTotalProduction(installationId: number, timeFrame: string): Promise<number> {
    console.log(`Getting total production for ${timeFrame} (fixed period, not chart-dependent)`);
    
    // The "Produced this [timeframe]" should represent a FIXED time period regardless of chart view
    // For example: "Produced this month" should always show this month's data, 
    // whether you're viewing month chart or year chart
    
    switch (timeFrame.toLowerCase()) {
      case 'hour':
      case 'day':
      case 'week':
        // For these timeframes, use the chart data directly since it represents the period
        const chartData = await this.getChartData(installationId, timeFrame);
        console.log(`${timeFrame} production: ${chartData.total_energy} Wh (from chart total)`);
        return chartData.total_energy;
        
      case 'month':
        // For month, always use the month chart to get this month's data
        const monthChartData = await this.getChartData(installationId, 'month');
        console.log(`Month production: ${monthChartData.total_energy} Wh (from month chart)`);
        return monthChartData.total_energy;
        
      case 'year':
        // For year, we want "this year" which is the same as lifetime since system started in 2025
        const yearChartData = await this.getChartData(installationId, 'year');
        console.log(`Year production: ${yearChartData.total_energy} Wh (from year chart)`);
        return yearChartData.total_energy;
        
      default:
        console.warn(`Unknown timeframe: ${timeFrame}, falling back to month`);
        const fallbackData = await this.getChartData(installationId, 'month');
        return fallbackData.total_energy;
    }
  },

  // Get lifetime total energy production using chart API for consistency
  async getLifetimeProduction(installationId: number): Promise<number> {
    console.log(`Getting lifetime production using chart API (consistent calculation)`);
    
    // Since the system has only been running since June 2025, the "year" timeframe
    // effectively covers the entire lifetime. This ensures consistency with the chart.
    const chartData = await this.getChartData(installationId, 'year');
    
    console.log(`Lifetime production from chart API: ${chartData.total_energy} Wh`);
    return chartData.total_energy;
  },

  // Get chart data for EnergyChart component
  async getChartData(installationId: number, timeFrame: string): Promise<ChartDataResponse> {
    const response = await apiClient.get(`/api/v1/readings/${installationId}/chart`, {
      params: {
        time_frame: timeFrame.toLowerCase(),
        verified_only: true
      }
    });
    
    return response.data;
  },
};

// Error handling utility
export const handleApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      return `Server error: ${error.response.status} - ${error.response.data?.detail || error.response.statusText}`;
    } else if (error.request) {
      return 'Network error: Unable to connect to server';
    }
  }
  return 'An unexpected error occurred';
}; 