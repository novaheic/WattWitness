import React, { useState, useEffect } from 'react';
import { useInstallation, useDeviceInfo, useLatestReading } from '../hooks/usePowerData';

export const GeneralInfo: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [copySuccess, setCopySuccess] = useState(false);
  const [showCopyAnimation, setShowCopyAnimation] = useState(false);

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

  // Copy public key to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setShowCopyAnimation(true);
      
      // Start fade out after 1 second
      setTimeout(() => setShowCopyAnimation(false), 1000);
      // Remove completely after animation finishes
      setTimeout(() => setCopySuccess(false), 1500);
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopySuccess(true);
        setShowCopyAnimation(true);
        setTimeout(() => setShowCopyAnimation(false), 1000);
        setTimeout(() => setCopySuccess(false), 1500);
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr);
      }
      document.body.removeChild(textArea);
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

  // Public Key Display Component with Copy Button
  const PublicKeyDisplay = ({ publicKey }: { publicKey: string }) => (
    <div className="relative flex items-center gap-2">
      <span className="text-gray-900 font-medium text-sm">
        {truncatePublicKey(publicKey)}
      </span>
      <button
        onClick={() => copyToClipboard(publicKey)}
        className="text-gray-500 hover:text-gray-700 transition-colors"
        title="Copy public key"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
      {copySuccess && (
        <div className={`absolute top-6 right-0 bg-green-500 text-white px-2 py-1 rounded text-xs z-10 transition-opacity duration-500 ${
          showCopyAnimation ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Copied!
          </div>
        </div>
      )}
    </div>
  );

  const rows = [
    { label: "Device Name/ID", value: deviceInfo?.deviceName || "Unknown", isPublicKey: false },
    { label: "ATECC608A Public Key", value: deviceInfo?.publicKey || "Unknown", isPublicKey: true },
    { label: "Shelly EM Mac Address", value: deviceInfo?.macAddress || "Unknown", isPublicKey: false },
    { label: "Time Since Last Ping", value: getRealTimeLastPing(), isPublicKey: false },
    { label: "Last Boot Time", value: deviceInfo?.lastBoot || "Unknown", isPublicKey: false },
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
            {row.isPublicKey ? (
              <PublicKeyDisplay publicKey={row.value} />
            ) : (
              <div className="text-gray-900 font-medium text-sm">{row.value}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}; 