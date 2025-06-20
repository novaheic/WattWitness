import axios from 'axios';

// API base URL - will be configurable for production
const API_BASE_URL = 'http://localhost:8000';

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

  // Get 7-day average power (calculated from readings)
  async getWeeklyAverage(installationId: number): Promise<number> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    
    console.log(`Fetching weekly average for installation ${installationId} from ${startTime.toISOString()} to ${endTime.toISOString()}`);
    
    const readings = await this.getReadings(
      installationId,
      startTime.toISOString(),
      endTime.toISOString(),
      true
    );
    
    console.log(`Found ${readings.length} readings for weekly average calculation`);
    
    if (readings.length === 0) {
      console.log('No readings found for weekly average, returning 0');
      return 0;
    }
    
    const totalPower = readings.reduce((sum, reading) => sum + reading.power_w, 0);
    const average = totalPower / readings.length;
    
    console.log(`Weekly average calculated: ${average}W from ${readings.length} readings`);
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
    const now = Math.floor(Date.now() / 1000); // Current Unix timestamp
    let startTime: number;

    // Calculate start time based on time frame using Unix timestamps
    switch (timeFrame.toLowerCase()) {
      case 'hour':
        startTime = now - 60 * 60; // 1 hour ago
        break;
      case 'day':
        startTime = now - 24 * 60 * 60; // 1 day ago
        break;
      case 'week':
        startTime = now - 7 * 24 * 60 * 60; // 7 days ago
        break;
      case 'month':
        startTime = now - 30 * 24 * 60 * 60; // 30 days ago
        break;
      case 'year':
        startTime = now - 365 * 24 * 60 * 60; // 365 days ago
        break;
      default:
        startTime = now - 24 * 60 * 60; // Default to 1 day
    }

    console.log(`Total production calculation for ${timeFrame}:`, {
      startTime,
      endTime: now,
      startTimeISO: new Date(startTime * 1000).toISOString(),
      endTimeISO: new Date(now * 1000).toISOString()
    });

    const readings = await this.getReadings(
      installationId,
      new Date(startTime * 1000).toISOString(),
      new Date(now * 1000).toISOString(),
      true
    );

    console.log(`Found ${readings.length} readings for ${timeFrame} production calculation`);

    // Calculate total energy production using power readings instead of cumulative totals
    if (readings.length < 2) {
      console.log(`Not enough readings for ${timeFrame} production calculation`);
      return 0;
    }

    // Calculate energy production by averaging power over time periods
    let totalEnergyWh = 0;
    
    for (let i = 1; i < readings.length; i++) {
      const currentReading = readings[i];
      const previousReading = readings[i - 1];
      
      // Calculate time difference in hours
      const timeDiffHours = (currentReading.timestamp - previousReading.timestamp) / 3600;
      
      // Use average power between readings
      const averagePowerW = (currentReading.power_w + previousReading.power_w) / 2;
      
      // Calculate energy for this time period: Power × Time
      const energyWh = averagePowerW * timeDiffHours;
      
      totalEnergyWh += Math.abs(energyWh); // Use absolute value to keep it positive
    }

    console.log(`${timeFrame} production calculation details:`, {
      firstReading: {
        id: readings[readings.length - 1].id,
        timestamp: readings[readings.length - 1].timestamp,
        total_wh: readings[readings.length - 1].total_wh,
        power_w: readings[readings.length - 1].power_w,
        created_at: readings[readings.length - 1].created_at
      },
      lastReading: {
        id: readings[0].id,
        timestamp: readings[0].timestamp,
        total_wh: readings[0].total_wh,
        power_w: readings[0].power_w,
        created_at: readings[0].created_at
      },
      // Old calculation (cumulative difference)
      cumulativeDifferenceWh: readings[0].total_wh - readings[readings.length - 1].total_wh,
      cumulativeDifferenceKWh: (readings[0].total_wh - readings[readings.length - 1].total_wh) / 1000,
      // New calculation (power-based)
      totalEnergyWh: totalEnergyWh,
      totalEnergyKWh: totalEnergyWh / 1000,
      timeSpanHours: (readings[0].timestamp - readings[readings.length - 1].timestamp) / 3600,
      averagePowerW: totalEnergyWh / ((readings[0].timestamp - readings[readings.length - 1].timestamp) / 3600)
    });

    // Return the power-based calculation instead of cumulative difference
    return totalEnergyWh;
  },

  // Get lifetime total energy production
  async getLifetimeProduction(installationId: number): Promise<number> {
    const readings = await this.getAllReadings(installationId, true);
    const installations = await this.getInstallations();
    const installation = installations.find(inst => inst.id === installationId);
    
    console.log(`Lifetime production calculation for installation ${installationId}:`);
    console.log(`Found ${readings.length} total readings`);
    
    if (readings.length === 0 || !installation) {
      console.log('No readings found or installation not found for lifetime production calculation');
      return 0;
    }

    // Sort readings by timestamp to ensure correct order
    const sortedReadings = readings.sort((a, b) => a.timestamp - b.timestamp);
    
    // Get the installation creation time as the starting point
    const installationCreatedAt = new Date(installation.created_at);
    const installationTimestamp = Math.floor(installationCreatedAt.getTime() / 1000);
    
    // Find the first reading after installation creation
    const firstReadingAfterInstallation = sortedReadings.find(reading => reading.timestamp >= installationTimestamp);
    const latestReading = sortedReadings[sortedReadings.length - 1];
    
    if (!firstReadingAfterInstallation) {
      console.log('No readings found after installation creation');
      return 0;
    }
    
    // Calculate energy production since installation
    const energySinceInstallation = latestReading.total_wh - firstReadingAfterInstallation.total_wh;
    
    // Also calculate the sum of differences for comparison
    let sumOfDifferencesWh = 0;
    for (let i = 1; i < sortedReadings.length; i++) {
      const currentReading = sortedReadings[i];
      const previousReading = sortedReadings[i - 1];
      const energyProduced = currentReading.total_wh - previousReading.total_wh;
      if (energyProduced > 0) {
        sumOfDifferencesWh += energyProduced;
      }
    }

    console.log('Lifetime production calculation details:', {
      totalReadings: sortedReadings.length,
      // Energy since installation
      energySinceInstallationWh: energySinceInstallation,
      energySinceInstallationKWh: energySinceInstallation / 1000,
      // Installation details
      installationCreatedAt: installation.created_at,
      installationTimestamp: installationTimestamp,
      // Cumulative total from Shelly device (for reference)
      cumulativeTotalWh: latestReading.total_wh,
      cumulativeTotalKWh: latestReading.total_wh / 1000,
      // Sum of differences calculation (for comparison)
      sumOfDifferencesWh: sumOfDifferencesWh,
      sumOfDifferencesKWh: sumOfDifferencesWh / 1000,
      firstReadingAfterInstallation: {
        id: firstReadingAfterInstallation.id,
        timestamp: firstReadingAfterInstallation.timestamp,
        total_wh: firstReadingAfterInstallation.total_wh,
        date: new Date(firstReadingAfterInstallation.timestamp * 1000).toISOString()
      },
      latestReading: {
        id: latestReading.id,
        timestamp: latestReading.timestamp,
        total_wh: latestReading.total_wh,
        date: new Date(latestReading.timestamp * 1000).toISOString()
      },
      timeSpanDays: (latestReading.timestamp - firstReadingAfterInstallation.timestamp) / (24 * 3600)
    });

    // Return the energy production since installation
    return Math.abs(energySinceInstallation); // Use absolute value to keep it positive
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