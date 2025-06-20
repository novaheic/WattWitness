import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import pendingIcon from '../assets/pending-icon.png';
import confirmedIcon from '../assets/confirmed-icon.png';

// Use custom asset icons
const PendingIcon = () => (
  <img src={pendingIcon} alt="Pending" className="w-7 h-7 mr-3" />
);
const ConfirmedIcon = () => (
  <img src={confirmedIcon} alt="Confirmed" className="w-7 h-7 mr-3" />
);

const explorerBaseUrl = 'https://explorer.example.com/tx/'; // TODO: Replace with real explorer URL

// Placeholder data
type ConfirmedRecord = {
  timestamp: string;
  kWh: number;
  txHash: string;
  signer: string;
};

const confirmedRecords: ConfirmedRecord[] = [
  {
    timestamp: '2025-06-04 12:02:03 UTC',
    kWh: 10.15,
    txHash: '3mjk7l...4kew9m',
    signer: '0461D2...C3E01B7',
  },
  {
    timestamp: '2025-06-04 12:02:03 UTC',
    kWh: 10.15,
    txHash: '3mjk7l...4kew9m',
    signer: '0461D2...C3E01B7',
  },
  {
    timestamp: '2025-06-04 11:57:05 UTC',
    kWh: 9.58,
    txHash: '3mjk7l...4kew9m',
    signer: '0461D2...C3E01B7',
  },
  {
    timestamp: '2025-06-04 11:52:03 UTC',
    kWh: 10.43,
    txHash: '3mjk7l...4kew9m',
    signer: '0461D2...C3E01B7',
  },
];

const moreRecords: ConfirmedRecord[] = Array(10).fill({
  timestamp: '2025-06-04 11:45:00 UTC',
  kWh: 8.99,
  txHash: '3mjk7l...4kew9m',
  signer: '0461D2...C3E01B7',
});

const allConfirmedRecords = [...confirmedRecords, ...moreRecords];

const pendingEstimateSeconds = 192; // 3m12s
const pendingKWh = 3.79;

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m${s.toString().padStart(2, '0')}s`;
}

export const LatestRecords: React.FC = () => {
  const [expanded, setExpanded] = useState<number | null>(0); // Default: first confirmed expanded
  const [pendingSeconds, setPendingSeconds] = useState(pendingEstimateSeconds);
  const [pendingAccum, setPendingAccum] = useState(pendingKWh);

  // Simulate countdown and accumulating kWh
  useEffect(() => {
    const interval = setInterval(() => {
      setPendingSeconds((s) => (s > 0 ? s - 1 : 0));
      setPendingAccum((kWh) => (pendingSeconds > 0 ? +(kWh + 0.01).toFixed(2) : kWh));
    }, 1000);
    return () => clearInterval(interval);
  }, [pendingSeconds]);

  return (
    <div className="rounded-2xl p-6 w-full max-w-xl shadow-none h-full flex flex-col">
      {/* Title Row */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-medium text-gray-900">Latest Records</h2>
        <a
          href="https://explorer.example.com" // TODO: Replace with real explorer URL
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:underline flex items-center"
        >
          View in Explorer
          <svg className="ml-0.5 w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"/></svg>
        </a>
      </div>

      {/* List container with overflow */}
      <div className="flex-1 overflow-y-hidden overflow-x-hidden">
        {/* Pending Record */}
        <div className="flex items-center py-3 border-b border-[#D2D2D2] text-sm">
          <PendingIcon />
          <div className="flex-1 min-w-0">
            <div className="text-gray-700 font-medium truncate">Pending: est. {formatCountdown(pendingSeconds)}</div>
          </div>
          <div className="text-right ml-2">
            <span className="text-base text-gray-500 italic font-semibold">+{pendingAccum.toFixed(2)} kWh</span>
          </div>
        </div>

        {/* Confirmed Records with layout animation */}
        {allConfirmedRecords.map((rec, i) => {
          const isExpanded = expanded === i;
          return (
            <motion.div
              key={i}
              layout="position"
              transition={{ duration: 0.25 }}
              className="border-b border-[#D2D2D2] last:border-b-0"
            >
              <div className="flex items-center py-3 text-sm">
                <ConfirmedIcon />
                <div className="flex-1 min-w-0">
                  <div className="text-gray-700 font-medium truncate">{rec.timestamp}</div>
                </div>
                <div className="text-right ml-2">
                  <span className="font-semibold text-base text-gray-700">+{rec.kWh.toFixed(2)} kWh</span>
                </div>
                <button
                  className={`ml-2 flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#D4D9DC] p-0 transition-transform focus:outline-none ${isExpanded ? 'rotate-180' : ''}`}
                  onClick={() => setExpanded(isExpanded ? null : i)}
                  aria-label="Expand details"
                >
                  <svg className="w-4 h-4" fill="none" stroke="#686A6C" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </button>
              </div>
              {/* Expanded details with animation */}
              <AnimatePresence mode="popLayout">
                {isExpanded && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.25 } }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    className="pl-14 pb-3 text-xs text-gray-600"
                  >
                    <div>
                      Transaction Hash: <a href={`${explorerBaseUrl}${rec.txHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{rec.txHash}</a>
                    </div>
                    <div>Signer Public Key: {rec.signer}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default LatestRecords; 