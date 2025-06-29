import { useState, useEffect } from 'react';
import { blockchainService, BlockchainRecord } from '../services/blockchain';

export interface UseBlockchainDataResult {
  records: BlockchainRecord[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useBlockchainData = (): UseBlockchainDataResult => {
  const [records, setRecords] = useState<BlockchainRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [_nextExpectedTx, setNextExpectedTx] = useState<Date | null>(null);

  const fetchData = async (isInitialLoad: boolean = false) => {
    try {
      // Rate limiting protection - don't fetch if recently rate limited or too soon
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime;
      
      if (!isInitialLoad && isRateLimited && timeSinceLastFetch < 300000) { // 5 minute cooldown
        console.log('⏱️ Skipping fetch - still in rate limit cooldown');
        return;
      }
      
      if (!isInitialLoad && timeSinceLastFetch < 30000) { // Minimum 30 seconds between fetches
        console.log('⏱️ Skipping fetch - too soon since last attempt');
        return;
      }
      
      setLastFetchTime(now);
      
      // Only show loading spinner on initial load, not on background refreshes
      if (isInitialLoad) {
        setLoading(true);
      }
      setError(null);
      console.log(`🔗 Fetching blockchain records for LatestRecords... (${isInitialLoad ? 'initial load' : 'silent refresh'})`);
      
      const blockchainRecords = await blockchainService.getRecentTransactions();
      console.log(`✅ Fetched blockchain records: ${blockchainRecords.length} (${isInitialLoad ? 'initial' : 'refresh'})`);
      
      // Update transaction timing prediction
      try {
        const timingPattern = await blockchainService.getTransactionTimingPattern();
        if (timingPattern) {
          setNextExpectedTx(timingPattern.nextExpectedTime);
          console.log(`⏰ Next transaction expected at: ${timingPattern.nextExpectedTime.toLocaleTimeString()} (in ${timingPattern.minutesUntilNext.toFixed(1)} minutes)`);
        }
      } catch (error) {
        console.log('⚠️ Could not analyze transaction timing:', error);
      }
      
      // Clear rate limit flag and error on successful fetch
      setIsRateLimited(false);
      setError(null); // Clear any previous errors
      setRecords(blockchainRecords);
      
      // Ensure loading is false after successful silent refresh
      if (!isInitialLoad) {
        setLoading(false);
      }
      
    } catch (err) {
      console.error('❌ Failed to fetch blockchain records:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch blockchain data';
      
      // Handle rate limiting more gracefully
      if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
        console.log('⏱️ Rate limited - entering 5-minute cooldown period');
        setIsRateLimited(true);
        setError('Rate limited - cooling down for 5 minutes');
        
        // Clear rate limit flag after 5 minutes
        setTimeout(() => {
          setIsRateLimited(false);
          console.log('✅ Rate limit cooldown ended');
        }, 300000);
        
        // Don't clear existing records on rate limit
      } else {
        setIsRateLimited(false);
        setError(errorMessage);
        // Only clear records on non-rate-limit errors if this is initial load
        if (isInitialLoad) {
          setRecords([]);
        }
      }
      
      // Ensure loading is false even on error for silent refresh
      if (!isInitialLoad) {
        setLoading(false);
      }
      
    } finally {
      // Always set loading false for initial loads
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  const refetch = () => {
    // Respect rate limiting even for manual refresh
    if (isRateLimited) {
      console.log('⏱️ Manual refresh blocked - still in rate limit cooldown');
      setError('Rate limited - please wait before refreshing again');
      return;
    }
    
    console.log('🔄 Silent refresh: updating blockchain data without loading state');
    // Clear device info cache to ensure fresh data
    blockchainService.clearDeviceInfoCache();
    fetchData(false); // Silent refresh - don't show loading state
  };

  useEffect(() => {
    fetchData(true); // Initial load only - no more periodic polling
    console.log('📡 Blockchain data will now be refreshed only via countdown logic');
  }, []); // Empty dependency array - only runs once on mount

  return {
    records,
    loading,
    error,
    refetch
  };
}; 