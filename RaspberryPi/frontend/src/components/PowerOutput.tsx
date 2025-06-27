import React from 'react';
import { useInstallation, useLatestReading, useWeeklyAverage, useESP32Status } from '../hooks/usePowerData';

export const PowerOutput: React.FC = () => {
  // Get installation data
  const { data: installation, isLoading: installationLoading, error: installationError } = useInstallation();
  
  // Get ESP32 status (same logic as SystemStatus)
  const { data: energyMeterLive = false } = useESP32Status(installation?.id);
  
  // Get latest power reading
  const { 
    data: latestReading, 
    isLoading: readingLoading, 
    error: readingError 
  } = useLatestReading(installation?.id);
  
  // Get weekly average
  const { 
    data: weeklyAverage, 
    isLoading: averageLoading, 
    error: averageError 
  } = useWeeklyAverage(installation?.id);

  // Loading state
  if (installationLoading || readingLoading || averageLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-medium text-gray-900">Power Output</h2>
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading power data...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (installationError || readingError || averageError) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-medium text-gray-900">Power Output</h2>
          <div className="w-2 h-2 rounded-full bg-red-500" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500 text-center">
            <div className="font-medium">Connection Error</div>
            <div className="text-sm">Unable to load power data</div>
          </div>
        </div>
      </div>
    );
  }

  // Use ESP32 status to determine if device is online and what power to show
  const isDeviceOnline = energyMeterLive;
  const currentPower = (isDeviceOnline && latestReading) ? latestReading.power_w / 1000 : 0;
  const weeklyAvg = weeklyAverage ? weeklyAverage / 1000 : 0;
  
  // Number of scale lines
  const scaleLines = 20;
  
  // Calculate dynamic scale range based on actual values
  const minValue = Math.min(currentPower, weeklyAvg);
  const maxValue = Math.max(currentPower, weeklyAvg);
  const range = maxValue - minValue;
  const padding = Math.max(range * 0.4, 0.5); // 40% padding or minimum 0.5 kW
  
  const minPower = Math.max(0, minValue - padding);
  const maxPower = maxValue + padding;
  
  // Calculate positions as percentages (0-100%)
  const currentPosition = Math.max(0, Math.min(100, ((currentPower - minPower) / (maxPower - minPower)) * 100));
  const averagePosition = Math.max(0, Math.min(100, ((weeklyAvg - minPower) / (maxPower - minPower)) * 100));
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-medium text-gray-900">Power Output</h2>
        <div className={`w-2 h-2 rounded-full ${isDeviceOnline ? 'bg-green-500' : 'bg-red-500'}`} />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center">
        {/* Scale lines container */}
        <div className="relative w-full h-[4px]">
          {[...Array(scaleLines)].map((_, i) => {
            const isLongDash = i === 0 || i === scaleLines - 1 || i % 5 === 0;
            return (
              <div
                key={i}
                className={`absolute w-[1px] bg-gray-500 ${
                  isLongDash ? 'h-8' : 'h-4'
                }`}
                style={{
                  left: `${(i * 100) / (scaleLines - 1)}%`,
                  top: isLongDash ? '-14px' : '-8px',
                  transform: 'translateX(-50%)'
                }}
              />
            );
          })}
        </div>

        {/* Real-time tooltip */}
        <div 
          className="absolute transform -translate-y-16"
          style={{ left: `${currentPosition}%` }}
        >
          <div className={`border border-gray-200 rounded-lg px-3 py-2 relative ${
            isDeviceOnline ? 'bg-white' : 'bg-gray-100'
          }`} style={{ boxShadow: '0 0 13px 0 rgba(0, 0, 0, 0.08)' }}>
            <div className="text-gray-500 text-xs">
              {isDeviceOnline ? 'Real-Time:' : 'Offline:'}
            </div>
            <div className={`text-lg font-medium ${
              isDeviceOnline ? 'text-gray-900' : 'text-gray-500'
            }`}>
              {currentPower >= 0.1
                ? `${currentPower.toFixed(2)} kW`
                : `${(currentPower * 1000).toFixed(1)} W`
              }
            </div>
            {/* Triangle pointing down */}
            <svg 
              className="absolute top-full left-1/2 transform -translate-x-1/2 w-4 h-4 rotate-180" 
              viewBox="0 0 16 16"
            >
              <polygon points="8,0 0,16 16,16" fill={isDeviceOnline ? "white" : "#f3f4f6"} />
            </svg>
          </div>
        </div>

        {/* Weekly average tooltip */}
        <div 
          className="absolute transform translate-y-16"
          style={{ left: `${averagePosition}%` }}
        >
          <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 relative" style={{ boxShadow: '0 0 13px 0 rgba(0, 0, 0, 0.08)' }}>
            <div className="text-gray-500 text-xs">7 Day Avg.</div>
            <div className="text-lg font-medium text-gray-900">
              {weeklyAvg >= 0.1
                ? `${weeklyAvg.toFixed(2)} kW`
                : `${(weeklyAvg * 1000).toFixed(1)} W`
              }
            </div>
            {/* Triangle pointing up */}
            <svg 
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-4 h-4 rotate-180" 
              viewBox="0 0 16 16"
            >
              <polygon points="0,0 16,0 8,16" fill="white" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}; 