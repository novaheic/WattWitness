import React, { useState, useEffect } from 'react';
import { useInstallation, useDeviceInfo, useLatestReading } from '../hooks/usePowerData';

export const GeneralInfo: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Get installation data
  const { data: installation, isLoading: installationLoading, error: installationError } = useInstallation();
  
  // Get device info
  const { data: deviceInfo, isLoading: deviceInfoLoading, error: deviceInfoError } = useDeviceInfo(installation?.id);

  // Get latest reading for real-time ping calculation
  const { data: latestReading } = useLatestReading(installation?.id);

  // Update current time every second for real-time countup
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate real-time time since last ping using ESP32 timestamp directly
  const getRealTimeLastPing = (): string => {
    if (!latestReading?.timestamp) return deviceInfo?.lastPing || 'Unknown';
    
    // Use ESP32 timestamp directly (convert from Unix timestamp to milliseconds)
    const lastPingTime = latestReading.timestamp * 1000;
    const timeSinceLastPing = Math.floor((currentTime - lastPingTime) / 1000); // seconds
    
    if (timeSinceLastPing < 60) {
      return `${timeSinceLastPing}s`;
    } else if (timeSinceLastPing < 3600) {
      return `${Math.floor(timeSinceLastPing / 60)}m${timeSinceLastPing % 60}s`;
    } else {
      const hours = Math.floor(timeSinceLastPing / 3600);
      const minutes = Math.floor((timeSinceLastPing % 3600) / 60);
      return `${hours}h${minutes}m`;
    }
  };

  // Loading state
  if (installationLoading || deviceInfoLoading) {
    return (
      <div className="bg-[#D0D6DD] rounded-[26px] h-full flex flex-col">
        <div className="flex items-center gap-2 px-6 pt-6 pb-4">
          <h2 className="text-2xl font-medium text-gray-900">General</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading device info...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (installationError || deviceInfoError) {
    return (
      <div className="bg-[#D0D6DD] rounded-[26px] h-full flex flex-col">
        <div className="flex items-center gap-2 px-6 pt-6 pb-4">
          <h2 className="text-2xl font-medium text-gray-900">General</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500 text-center">
            <div className="font-medium">Connection Error</div>
            <div className="text-sm">Unable to load device info</div>
          </div>
        </div>
      </div>
    );
  }

  // Truncate long values for display
  const truncatePublicKey = (key: string) => {
    if (key.length > 20) {
      return `${key.substring(0, 10)}...${key.substring(key.length - 10)}`;
    }
    return key;
  };

  const rows = [
    { label: "Device Name/ID", value: deviceInfo?.deviceName || "Unknown" },
    { label: "ATECC608A Public Key", value: truncatePublicKey(deviceInfo?.publicKey || "Unknown") },
    { label: "Shelly EM Mac Address", value: deviceInfo?.macAddress || "Unknown" },
    { label: "Time Since Last Ping", value: getRealTimeLastPing() },
    { label: "Last Boot Time", value: deviceInfo?.lastBoot || "Unknown" },
  ];

  return (
    <div className="bg-[#D0D6DD] rounded-[26px] h-full flex flex-col">
      <div className="flex items-center gap-2 px-6 pt-6 pb-4">
        <h2 className="text-2xl font-medium text-gray-900">General</h2>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        {rows.map((row, index) => (
          <div 
            key={row.label}
            className={`flex items-center px-6 py-2 ${
              index !== rows.length - 1 ? 'border-b border-white' : 'pb-5'
            }`}
          >
            <div className="flex-1 text-gray-600 text-sm">{row.label}</div>
            <div className="text-gray-900 font-medium text-sm">{row.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}; 