import React from 'react';
import { EnergyChart } from './EnergyChart';
import { LatestRecords } from './LatestRecords';
import { PowerOutput } from './PowerOutput';
import { GeneralInfo } from './GeneralInfo';
import { SystemStatus } from './SystemStatus';
import { useESP32DataMonitor, useInstallation } from '../hooks/usePowerData';

export const Dashboard: React.FC = () => {
  // Monitor for new ESP32 data to synchronize all dashboard refreshes
  const { data: installation } = useInstallation();
  useESP32DataMonitor(installation?.id);

  return (
    <div className="w-full">
      <div className="max-w-[1920px] w-full mx-auto px-24 lg:px-48 xl:px-64 2xl:px-80">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Top row */}
          <div className="lg:col-span-2 bg-white rounded-[26px] shadow-[0_4px_30px_0_rgba(4,5,54,0.08)] px-8 pt-8 pb-6 min-h-[400px]">
            <EnergyChart />
          </div>
          <div className="card h-[400px] bg-transparent shadow-none flex flex-col">
            <LatestRecords />
          </div>

          {/* Bottom row */}
          <div className="p-6">
            <PowerOutput />
          </div>
          <div className="rounded-[26px]">
            <GeneralInfo />
          </div>
          <div className="bg-white rounded-[26px] min-h-[180px]">
            <SystemStatus />
          </div>
        </div>
      </div>
    </div>
  );
}; 