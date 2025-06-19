import React from 'react';
import { EnergyChart } from './EnergyChart';
import { LatestRecords } from './LatestRecords';
import { PowerOutput } from './PowerOutput';
import { GeneralInfo } from './GeneralInfo';
import { SystemStatus } from './SystemStatus';

export const Dashboard: React.FC = () => {
  return (
    <div className="w-full">
      <div className="max-w-[1920px] w-full mx-auto px-24 lg:px-48 xl:px-64 2xl:px-80">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Top row */}
          <div className="lg:col-span-2 bg-white rounded-[26px] shadow-[0_4px_30px_0_rgba(4,5,54,0.08)] px-8 pt-8 pb-6 min-h-[400px]">
            <EnergyChart />
          </div>
          <div className="card min-h-[400px]">
            <h2 className="text-xl font-semibold mb-4">Latest Records</h2>
            <LatestRecords />
          </div>

          {/* Bottom row */}
          <div className="p-6">
            <PowerOutput currentPower={12.8} weeklyAverage={11.4} isOnline={true} />
          </div>
          <div className="rounded-[26px]">
            <GeneralInfo 
              deviceId="WW-Nairobi-01"
              publicKey="0461D2...C3E01B7"
              macAddress="EC:FA:BC:11:22:33"
              lastPing="1m12s"
              lastBoot="2025-06-04 11:52:03 UTC"
            />
          </div>
          <div className="bg-white rounded-[26px] min-h-[180px]">
            <SystemStatus 
              internetConnected={true}
              blockchainUpToDate={true}
              energyMeterLive={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 