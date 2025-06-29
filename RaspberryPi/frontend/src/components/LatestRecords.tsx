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

// Updated types to include individual readings
type PowerReading = {
  timestamp: string;
  power: number; // in kW
  totalKwh: number;
  signature: string;
};

type ConfirmedRecord = {
  timestamp: string;
  kWh: number;
  txHash: string;
  publicKey: string;
  readings: PowerReading[];
};

// Updated dummy data with individual readings
const confirmedRecords: ConfirmedRecord[] = [
  {
    timestamp: '2025-06-04 12:02:03 UTC',
    kWh: 10.15,
    txHash: '3mjk7l...4kew9m',
    publicKey: '0461D2J3...K4L5C3E01B7',
    readings: [
      { timestamp: '2025-06-28 12:42:46', power: 132.4, totalKwh: 34325030, signature: '854314...000000' },
      { timestamp: '2025-06-28 12:42:46', power: 132.4, totalKwh: 34325030, signature: '854314...000000' },
      { timestamp: '2025-06-28 12:42:46', power: 132.4, totalKwh: 34325030, signature: '854314...000000' },
      { timestamp: '2025-06-28 12:42:46', power: 132.4, totalKwh: 34325030, signature: '854314...000000' },
      { timestamp: '2025-06-28 12:42:46', power: 132.4, totalKwh: 34325030, signature: '854314...000000' },
      { timestamp: '2025-06-28 12:42:46', power: 132.4, totalKwh: 34325030, signature: '854314...000000' },
      { timestamp: '2025-06-28 12:42:46', power: 132.4, totalKwh: 34325030, signature: '854314...000000' },
      { timestamp: '2025-06-28 12:42:46', power: 132.4, totalKwh: 34325030, signature: '854314...000000' },
      { timestamp: '2025-06-28 12:42:46', power: 132.4, totalKwh: 34325030, signature: '854314...000000' },
      // Adding more readings to reach 31 total
      ...Array(22).fill(null).map((_, i) => ({
        timestamp: '2025-06-28 12:42:46',
        power: 132.4,
        totalKwh: 34325030,
        signature: '854314...000000'
      }))
    ],
  },
  {
    timestamp: '2025-06-04 12:02:03 UTC',
    kWh: 10.15,
    txHash: '3mjk7l...4kew9m',
    publicKey: '0461D2...C3E01B7',
    readings: Array(25).fill(null).map(() => ({
      timestamp: '2025-06-28 12:42:46',
      power: 132.4,
      totalKwh: 34325030,
      signature: '854314...000000'
    })),
  },
  {
    timestamp: '2025-06-04 11:57:05 UTC',
    kWh: 9.58,
    txHash: '3mjk7l...4kew9m',
    publicKey: '0461D2...C3E01B7',
    readings: Array(18).fill(null).map(() => ({
      timestamp: '2025-06-28 12:42:46',
      power: 132.4,
      totalKwh: 34325030,
      signature: '854314...000000'
    })),
  },
  {
    timestamp: '2025-06-04 11:52:03 UTC',
    kWh: 10.43,
    txHash: '3mjk7l...4kew9m',
    publicKey: '0461D2...C3E01B7',
    readings: Array(20).fill(null).map(() => ({
      timestamp: '2025-06-28 12:42:46',
      power: 132.4,
      totalKwh: 34325030,
      signature: '854314...000000'
    })),
  },
];

const moreRecords: ConfirmedRecord[] = Array(10).fill(null).map(() => ({
  timestamp: '2025-06-04 11:45:00 UTC',
  kWh: 8.99,
  txHash: '3mjk7l...4kew9m',
  publicKey: '0461D2...C3E01B7',
  readings: Array(15).fill(null).map(() => ({
    timestamp: '2025-06-28 12:42:46',
    power: 132.4,
    totalKwh: 34325030,
    signature: '854314...000000'
  })),
}));

const allConfirmedRecords = [...confirmedRecords, ...moreRecords];

const pendingEstimateSeconds = 192; // 3m12s
const pendingKWh = 3.79;

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m${s.toString().padStart(2, '0')}s`;
}

// Modal component
const ReadingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  record: ConfirmedRecord | null;
}> = ({ isOpen, onClose, record }) => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  if (!isOpen || !record) return null;

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemId);
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedItem(itemId);
      setTimeout(() => setCopiedItem(null), 2000);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {record.readings.length} Readings - {record.kWh}kWh
                </h2>
                <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <span>Public Key: {record.publicKey}</span>
                  <button
                    onClick={() => copyToClipboard(record.publicKey, 'publicKey')}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                    title="Copy public key"
                  >
                    {copiedItem === 'publicKey' ? (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Modal Body - Scrollable readings list */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-3">
              {record.readings.map((reading, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      Timestamp: {reading.timestamp}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-4">
                      <span>Power: {reading.power}kW</span>
                      <span>Total kWh: {reading.totalKwh}</span>
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                      Signature: {reading.signature}
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    <button
                      onClick={() => copyToClipboard(reading.signature, `signature-${index}`)}
                      className="text-xs text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                      title="Copy signature"
                    >
                      {copiedItem === `signature-${index}` ? (
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const LatestRecords: React.FC = () => {
  const [expanded, setExpanded] = useState<number | null>(0); // Default: first confirmed expanded
  const [pendingSeconds, setPendingSeconds] = useState(pendingEstimateSeconds);
  const [pendingAccum, setPendingAccum] = useState(pendingKWh);
  const [modalRecord, setModalRecord] = useState<ConfirmedRecord | null>(null);

  // Simulate countdown and accumulating kWh
  useEffect(() => {
    const interval = setInterval(() => {
      setPendingSeconds((s) => (s > 0 ? s - 1 : 0));
      setPendingAccum((kWh) => (pendingSeconds > 0 ? +(kWh + 0.01).toFixed(2) : kWh));
    }, 1000);
    return () => clearInterval(interval);
  }, [pendingSeconds]);

  return (
    <>
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
                      <div>
                        <button
                          onClick={() => setModalRecord(rec)}
                          className="text-gray-600 underline hover:text-gray-800 cursor-pointer"
                        >
                          Containing {rec.readings.length} signatures
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Readings Modal */}
      <ReadingsModal
        isOpen={modalRecord !== null}
        onClose={() => setModalRecord(null)}
        record={modalRecord}
      />
    </>
  );
};

export default LatestRecords; 