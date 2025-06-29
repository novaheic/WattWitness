import React from 'react';
import { useInternetStatus, useESP32Status, useInstallation, useBlockchainStatus } from '../hooks/usePowerData';

export const SystemStatus: React.FC = () => {
  // Get installation for ESP32 status check
  const { data: installation } = useInstallation();
  
  // Get real status values
  const { data: internetConnected = false, isLoading: internetLoading } = useInternetStatus();
  const { data: energyMeterLive = false, isLoading: esp32Loading } = useESP32Status(installation?.id);
  const { data: blockchainUpToDate = false, isLoading: blockchainLoading } = useBlockchainStatus();
  
  // Calculate overall status
  const operationalCount = [internetConnected, blockchainUpToDate, energyMeterLive]
    .filter(Boolean).length;
  
  const overallStatus = operationalCount === 3 ? 'optimal' : 
    operationalCount === 2 ? 'warning' : 'error';

  const statusColor = {
    optimal: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500'
  }[overallStatus];

  const statusText = {
    optimal: 'Optimal',
    warning: 'Warning',
    error: 'Error'
  }[overallStatus];

  interface CheckIconProps {
    isActive: boolean;
    isLoading?: boolean;
  }

  const CheckIcon: React.FC<CheckIconProps> = ({ isActive, isLoading = false }) => {
    if (isLoading) {
      return (
        <div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
      );
    }
    
    return (
      <svg className={`w-5 h-5 ${isActive ? 'text-green-500' : 'text-red-500'}`} viewBox="0 0 20 20" fill="currentColor">
        {isActive ? (
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        ) : (
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        )}
      </svg>
    );
  };

  const PowerIcon = () => (
    <svg className={`w-11 h-11 ${statusColor}`} viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="3">
      <path 
        d="M14 4v10 M8 6.5a9.5 9.5 0 1 0 12 0" 
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div className="bg-white rounded-[26px] h-full flex flex-col">
      <div className="flex items-center gap-2 px-6 pt-6">
        <h2 className="text-2xl font-medium text-gray-900">System Status</h2>
      </div>
      
      <div className="flex-1 flex items-center px-6">
        <div>
          {/* Status Items */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <CheckIcon isActive={internetConnected} isLoading={internetLoading} />
              <span className={`text-gray-600 text-sm ${!internetConnected && !internetLoading && 'text-red-500'}`}>
                Internet Connected
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckIcon isActive={blockchainUpToDate} isLoading={blockchainLoading} />
              <span className={`text-gray-600 text-sm ${!blockchainUpToDate && !blockchainLoading && 'text-red-500'}`}>
                Blockchain Up To Date
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckIcon isActive={energyMeterLive} isLoading={esp32Loading} />
              <span className={`text-gray-600 text-sm ${!energyMeterLive && !esp32Loading && 'text-red-500'}`}>
                Energy Meter Live
              </span>
            </div>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="w-[1px] h-24 bg-gray-200 mx-12"></div>

        {/* Right side status */}
        <div className="flex flex-col items-center">
          <PowerIcon />
          <span className={`text-sm font-medium mt-2 ${statusColor}`}>{statusText}</span>
        </div>
      </div>
    </div>
  );
}; 