import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import pendingIcon from '../assets/pending-icon.png';
import confirmedIcon from '../assets/confirmed-icon.png';
import { useBlockchainData } from '../hooks/useBlockchainData';
import { usePendingTransaction } from '../hooks/usePendingTransaction';

// Use custom asset icons
const PendingIcon = () => (
  <img src={pendingIcon} alt="Pending" className="w-7 h-7 mr-3" />
);
const ConfirmedIcon = () => (
  <img src={confirmedIcon} alt="Confirmed" className="w-7 h-7 mr-3" />
);

const explorerBaseUrl = 'https://testnet.snowtrace.io/tx/'; // Avalanche Fuji explorer

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
  kWhDisplay?: string; // Optional display string with proper units
  txHash: string;
  publicKey: string;
  readings: PowerReading[];
};

// Removed static pending constants - now using real data from usePendingTransaction hook

// Truncate long public keys for display (same logic as GeneralInfo)
const truncatePublicKey = (key: string) => {
  if (key.length > 20) {
    return `${key.substring(0, 10)}...${key.substring(key.length - 10)}`;
  }
  return key;
};

// Truncate transaction hashes for display
const truncateTxHash = (hash: string) => {
  if (hash.length > 20) {
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 10)}`;
  }
  return hash;
};

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
                  {record.readings.length} Readings - {record.kWhDisplay || `${record.kWh.toFixed(6)}kWh`}
                </h2>
                <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <span>Public Key: {truncatePublicKey(record.publicKey)}</span>
                  <button
                    onClick={() => copyToClipboard(record.publicKey, 'publicKey')}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                    title="Copy full public key"
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
  const [modalRecord, setModalRecord] = useState<ConfirmedRecord | null>(null);
  const [lastKnownRecordCount, setLastKnownRecordCount] = useState<number>(0);
  
  // Fetch real blockchain data
  const { records: blockchainRecords, loading, error, refetch: refetchBlockchainData } = useBlockchainData();
  
  // Get real pending transaction data from local API
  const { 
    hasPendingTransaction, 
    formatCountdown,
    pendingTransaction,
    shouldRefreshBlockchain,
    setShouldRefreshBlockchain,
    refetchTiming,
    forceCountdownReset,
    isInOverdueMode,
    overdueCheckSeconds
  } = usePendingTransaction(1); // Installation ID 1

  // Handle blockchain refresh trigger from countdown
  useEffect(() => {
    if (shouldRefreshBlockchain) {
      console.log('🔄 Countdown ended - refreshing blockchain data to check for new transactions');
      refetchBlockchainData();
      setShouldRefreshBlockchain(false); // Reset the trigger
    }
  }, [shouldRefreshBlockchain, refetchBlockchainData, setShouldRefreshBlockchain]);

  // Detect when new blockchain records arrive and reset countdown
  useEffect(() => {
    const currentRecordCount = blockchainRecords.length;
    
    // If we have more records than before, a new transaction was found
    if (currentRecordCount > lastKnownRecordCount && lastKnownRecordCount > 0) {
      console.log(`🆕 New blockchain transaction detected! Records: ${lastKnownRecordCount} → ${currentRecordCount}`);
      console.log(`🔄 Refreshing timing pattern and forcing countdown reset...`);
      
      // Immediately force countdown reset as backup
      forceCountdownReset();
      
      // Also refresh timing pattern with delay to ensure data is processed
      setTimeout(() => {
        console.log(`🔄 Executing delayed timing pattern refresh...`);
        refetchTiming();
      }, 1000); // 1 second delay
    }
    
    setLastKnownRecordCount(currentRecordCount);
  }, [blockchainRecords.length, lastKnownRecordCount, refetchTiming, forceCountdownReset]);

  // Convert blockchain records to component format
  const confirmedRecords: ConfirmedRecord[] = blockchainRecords.map((record, index) => {
    console.log(`🔍 UI DEBUG Record ${index}:`, {
      kWh: record.kWh,
      kWhDisplay: record.kWhDisplay,
      readingCount: record.readings.length
    });
    
    return {
      timestamp: record.timestamp,
      kWh: record.kWh,
      kWhDisplay: record.kWhDisplay, // Pass through the display string with proper units
      txHash: record.txHash,
      publicKey: record.publicKey,
      readings: record.readings.map(reading => ({
        timestamp: reading.timestamp,
        power: reading.power,
        totalKwh: reading.totalKwh,
        signature: reading.signature
      }))
    };
  });

  // Debug pending transaction data
  console.log(`🔄 Pending Transaction Debug:`, {
    hasPendingTransaction,
    readingCount: pendingTransaction.readingCount,
    estimatedEnergyWh: pendingTransaction.estimatedEnergyWh,
    countdownSeconds: pendingTransaction.countdownSeconds,
    isOverdue: pendingTransaction.isOverdue,
    countdownDisplay: formatCountdown(),
    isInOverdueMode,
    overdueCheckSeconds
  });

  // Determine pending transactions (those with low confirmations on blockchain)
  const pendingRecords = blockchainRecords.filter(record => record.confirmations < 12);
  const hasLowConfirmationRecords = pendingRecords.length > 0;

  return (
    <>
    <div className="rounded-2xl p-6 w-full max-w-xl shadow-none h-full flex flex-col">
      {/* Title Row */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-medium text-gray-900">Latest Records</h2>
        <a
            href="https://testnet.snowtrace.io/address/0x7189D2b09691a8867056a228fb3e227e12E5B105/events"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:underline flex items-center"
        >
          View in Explorer
          <svg className="ml-0.5 w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"/></svg>
        </a>
      </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">🔄 Loading blockchain records...</div>
          </div>
        )}

        {/* Error State - Less intrusive for rate limiting */}
        {error && (
          <div className={`mb-4 p-3 rounded text-sm ${
            error.includes('Rate limited') || error.includes('cooling down')
              ? 'bg-yellow-50 border border-yellow-200 text-yellow-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <strong>{error.includes('Rate limited') || error.includes('cooling down') ? '⏱️ Cooling Down:' : '❌ Error:'}</strong> {error}
            {!error.includes('Rate limited') && !error.includes('cooling down') && (
              <span className="ml-2 text-red-600">
                Use the refresh button in the header to retry
              </span>
            )}
          </div>
        )}

        {/* No Data State */}
        {!loading && !error && confirmedRecords.length === 0 && !hasPendingTransaction && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">📭 No blockchain records found</div>
          </div>
        )}

        {/* Show pending transaction even when no confirmed records exist */}
        {!loading && !error && confirmedRecords.length === 0 && hasPendingTransaction && (
      <div className="flex-1 overflow-y-hidden overflow-x-hidden">
            {/* Real Pending Transaction - readings not yet on blockchain */}
        <div className="flex items-center py-3 border-b border-[#D2D2D2] text-sm">
          <PendingIcon />
          <div className="flex-1 min-w-0">
                <div className="text-gray-700 font-medium truncate">
                  Pending: {formatCountdown()}
                </div>
              </div>

            </div>
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">⏳ Waiting for first blockchain confirmation...</div>
            </div>
          </div>
        )}

        {/* List container with overflow */}
        {!loading && !error && confirmedRecords.length > 0 && (
          <div className="flex-1 overflow-y-hidden overflow-x-hidden">
            {/* Real Pending Transaction - readings not yet on blockchain */}
            {hasPendingTransaction && (
              <div className="flex items-center py-3 border-b border-[#D2D2D2] text-sm">
                <PendingIcon />
                <div className="flex-1 min-w-0">
                                  <div className="text-gray-700 font-medium truncate">
                  Pending: {formatCountdown()}
          </div>
        </div>

              </div>
            )}
            
            {/* Low Confirmation Transactions - show if there are blockchain transactions with low confirmations */}
            {hasLowConfirmationRecords && (
              <div className="flex items-center py-3 border-b border-[#D2D2D2] text-sm">
                <PendingIcon />
                <div className="flex-1 min-w-0">
                  <div className="text-gray-700 font-medium truncate">
                    Confirming: {pendingRecords.length} transaction{pendingRecords.length > 1 ? 's' : ''} 
                    ({pendingRecords.reduce((sum, r) => sum + r.confirmations, 0)}/12+ confirmations)
                  </div>
                </div>
                <div className="text-right ml-2">
                  <span className="text-base text-gray-500 italic font-semibold">
                    {(() => {
                      const totalKwh = pendingRecords.reduce((sum, r) => sum + r.kWh, 0);
                      const totalWh = totalKwh * 1000;
                      return totalWh >= 1000 
                        ? `+${totalKwh.toFixed(2)}kWh`
                        : `+${totalWh.toFixed(0)}Wh`;
                    })()}
                  </span>
                </div>
              </div>
            )}

        {/* Confirmed Records with layout animation */}
            {confirmedRecords.map((rec, i) => {
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
                    <span className="font-semibold text-base text-gray-700">
                      {rec.kWhDisplay || `+${rec.kWh.toFixed(2)}kWh`}
                    </span>
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
                        Transaction Hash: <a href={`${explorerBaseUrl}${rec.txHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" title={rec.txHash}>{truncateTxHash(rec.txHash)}</a>
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
        )}
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