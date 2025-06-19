import React from 'react';

interface GeneralInfoProps {
  deviceId: string;
  publicKey: string;
  macAddress: string;
  lastPing: string;
  lastBoot: string;
}

export const GeneralInfo: React.FC<GeneralInfoProps> = ({
  deviceId = "WW-Nairobi-01",
  publicKey = "0461D2...C3E01B7",
  macAddress = "EC:FA:BC:11:22:33",
  lastPing = "1m12s",
  lastBoot = "2025-06-04 11:52:03 UTC"
}) => {
  const rows = [
    { label: "Device Name/ID", value: deviceId },
    { label: "ATECC608A Public Key", value: publicKey },
    { label: "Shelly EM Mac Address", value: macAddress },
    { label: "Time Since Last Ping", value: lastPing },
    { label: "Last Boot Time", value: lastBoot },
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