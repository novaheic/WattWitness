import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, PowerReading } from '../services/api';
import { blockchainService } from '../services/blockchain';

interface PendingTransaction {
  estimatedEnergyWh: number;
  readingCount: number;
  countdownSeconds: number;
  nextExpectedTime: Date | null;
  isOverdue: boolean;
}

export const usePendingTransaction = (installationId: number = 1) => {
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
  const [accumulatedEnergyWh, setAccumulatedEnergyWh] = useState<number>(0);
  const [dueNowSeconds, setDueNowSeconds] = useState<number>(0); // Track "Due now" period
  const [shouldRefreshBlockchain, setShouldRefreshBlockchain] = useState<boolean>(false);
  const [isInOverdueMode, setIsInOverdueMode] = useState<boolean>(false); // Track overdue state
  const [overdueCheckSeconds, setOverdueCheckSeconds] = useState<number>(0); // Track 10-second overdue checks
  const [forceTimingReset, setForceTimingReset] = useState<number>(0); // Force timing reset counter

  // Fetch ONLY the most recent 15 unprocessed readings from local API
  const { data: recentReadings = [], error: readingsError, isLoading: readingsLoading } = useQuery({
    queryKey: ['recentUnprocessedReadings', installationId],
    queryFn: async () => {
      const readings = await api.getRecentUnprocessedReadings(installationId, 8);
              console.log(`📥 API FETCH DEBUG: Got ${readings.length} recent unprocessed readings (last 3 minutes)`);
      if (readings.length > 0) {
        console.log(`📥 Recent readings sample:`, readings.slice(0, 3).map(r => ({
          timestamp: new Date(r.timestamp * 1000).toLocaleTimeString(),
          power_w: r.power_w,
          total_wh: r.total_wh,
          is_on_chain: r.is_on_chain
        })));
      }
      return readings;
    },
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    staleTime: 10 * 1000, // Consider stale after 10 seconds
  });

  // Get blockchain timing pattern to estimate next submission
  const { data: timingPattern, error: timingError, refetch: refetchTiming } = useQuery({
    queryKey: ['blockchainTiming'],
    queryFn: () => blockchainService.getTransactionTimingPattern(),
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    staleTime: 60 * 1000, // Consider stale after 1 minute
  });

  // Calculate energy from the 15 most recent readings
  useEffect(() => {
    if (recentReadings.length === 0) {
      setAccumulatedEnergyWh(0);
      return;
    }

    // We already have the 15 most recent readings sorted by timestamp (newest first)
    // Reverse them to get oldest first for calculation
    const sortedReadings = [...recentReadings].reverse(); // Now oldest first
    
    console.log(`🔄 CALCULATION START: Got ${recentReadings.length} recent readings`);
    
    if (sortedReadings.length < 2) {
      // Need at least 2 readings to calculate energy difference
      setAccumulatedEnergyWh(0);
      console.log(`🔄 Pending: Only ${sortedReadings.length} reading(s), need at least 2 for energy calculation`);
      return;
    }
    
    console.log(`🔄 STEP A: About to process ${sortedReadings.length} readings`);
    
    console.log(`🔄 STEP B: Raw sample readings:`, sortedReadings.slice(0, 3).map((r: PowerReading) => ({
      timestamp: r.timestamp,
      timestampDate: new Date(r.timestamp * 1000).toLocaleTimeString(),
      power_w: r.power_w,
      total_wh: r.total_wh,
      hasTimestamp: !!r.timestamp,
      hasPowerW: !!r.power_w,
      hasTotalWh: !!r.total_wh
    })));
    
    const firstReading = sortedReadings[0]; // Oldest of the recent readings
    const lastReading = sortedReadings[sortedReadings.length - 1]; // Newest reading
    
    console.log(`🔄 STEP C: First reading (oldest):`, {
      timestamp: firstReading?.timestamp,
      power_w: firstReading?.power_w,
      total_wh: firstReading?.total_wh
    });
    
    console.log(`🔄 STEP D: Last reading (newest):`, {
      timestamp: lastReading?.timestamp,
      power_w: lastReading?.power_w,
      total_wh: lastReading?.total_wh
    });
    
    // Energy from totalWh difference (newest - oldest)
    let energyFromTotalWh = lastReading.total_wh - firstReading.total_wh;
    
    console.log(`🔄 STEP E: Energy calculation:`, {
      firstTotalWh: firstReading.total_wh,
      lastTotalWh: lastReading.total_wh,
      difference: energyFromTotalWh
    });
    
    const timeSpanSeconds = lastReading.timestamp - firstReading.timestamp;
    const timeSpanMinutes = timeSpanSeconds / 60;
    
    // Simple calculation: just use the total_wh difference
    console.log(`🔍 SIMPLE ENERGY CALC FINAL:`, {
      recentCount: recentReadings.length,
      using: sortedReadings.length,
      firstTotalWh: firstReading.total_wh,
      lastTotalWh: lastReading.total_wh,
      energyWh: energyFromTotalWh,
      timeSpanMinutes: timeSpanMinutes.toFixed(1)
    });

    setAccumulatedEnergyWh(energyFromTotalWh);
    
    console.log(`🔄 Final pending energy: ${energyFromTotalWh.toFixed(4)}Wh (from ${sortedReadings.length} recent readings)`);
  }, [recentReadings]);

  // Set up countdown timer
  useEffect(() => {
    console.log(`🔄 Timing pattern useEffect triggered:`, {
      hasTimingPattern: !!timingPattern,
      nextExpectedTime: timingPattern?.nextExpectedTime?.toLocaleTimeString(),
      isOverdue: timingPattern?.isOverdue,
      currentOverdueMode: isInOverdueMode
    });
    
    if (!timingPattern) {
      console.log(`⚠️ No timing pattern available - resetting all timers`);
      setCountdownSeconds(0);
      setDueNowSeconds(0); // Reset due now period
      setIsInOverdueMode(false); // Clear overdue mode
      setOverdueCheckSeconds(0); // Clear overdue check timer
      return;
    }

    const now = new Date();
    const timeUntilNext = Math.max(0, Math.floor((timingPattern.nextExpectedTime.getTime() - now.getTime()) / 1000));
    
    // Reset timer and clear all special states when timing pattern updates
    const wasOverdue = isInOverdueMode;
    console.log(`⏰ Timer reset: ${timeUntilNext}s until next expected transaction (${timingPattern.nextExpectedTime.toLocaleTimeString()})`);
    if (wasOverdue) {
      console.log(`✅ Exiting overdue mode - new transaction found!`);
    }
    setCountdownSeconds(timeUntilNext);
    setDueNowSeconds(0); // Clear any ongoing "due now" period
    setIsInOverdueMode(false); // Clear overdue mode
    setOverdueCheckSeconds(0); // Clear overdue check timer
    setShouldRefreshBlockchain(false); // Clear any pending refresh trigger

    // Update countdown every second
    const interval = setInterval(() => {
      setCountdownSeconds(prev => {
        const newValue = Math.max(0, prev - 1);
        
        // When countdown reaches 0, start the "Due now" period
        if (newValue === 0 && prev > 0) {
          console.log(`⏰ Countdown reached 0, starting "Due now" period for 10 seconds`);
          setDueNowSeconds(10); // Start 10-second "Due now" period
        }
        
        return newValue;
      });
      
      // Handle "Due now" period countdown
      setDueNowSeconds(prev => {
        if (prev > 0) {
          const newDueNowValue = prev - 1;
          
          // When "Due now" period ends, trigger blockchain refresh
          if (newDueNowValue === 0 && prev > 0) {
            console.log(`⏰ "Due now" period ended, triggering blockchain refresh`);
            setShouldRefreshBlockchain(true);
            // Set overdue check timer for 10 seconds (will be activated if no new tx found)
            setOverdueCheckSeconds(10);
          }
          
          return newDueNowValue;
        }
        return 0;
      });
      
      // Handle overdue check countdown (10-second polls when overdue)
      setOverdueCheckSeconds(prev => {
        if (prev > 0) {
          const newOverdueValue = prev - 1;
          
          // When overdue check timer reaches 0, refresh blockchain and restart timer
          if (newOverdueValue === 0 && prev > 0) {
            if (isInOverdueMode) {
              console.log(`⏰ Overdue check: refreshing blockchain data...`);
              setShouldRefreshBlockchain(true);
              return 10; // Reset to 10 seconds for next check
            } else {
              // First time reaching 0 after "due now" - enter overdue mode
              console.log(`⏰ Entering overdue mode - will check every 10 seconds`);
              setIsInOverdueMode(true);
              setShouldRefreshBlockchain(true);
              return 10; // Start 10-second polling
            }
          }
          
          return newOverdueValue;
        }
        return 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timingPattern, recentReadings, isInOverdueMode, forceTimingReset]);

  // Function to force timing reset when new transaction detected
  const forceCountdownReset = () => {
    console.log(`🔄 Force countdown reset triggered`);
    setForceTimingReset(prev => prev + 1); // Increment to trigger useEffect
  };

  // Check if there's a pending transaction
  const hasPendingTransaction = recentReadings.length > 0;
  const isOverdue = timingPattern ? timingPattern.isOverdue : false;

  // Format countdown for display with smart states
  const formatCountdown = (): string => {
    // If in overdue mode (polling every 10 seconds)
    if (isInOverdueMode) {
      return "Overdue";
    }
    
    // If in "Due now" period (after countdown ended, before refresh)
    if (dueNowSeconds > 0) {
      return "Due now";
    }
    
    // If countdown is still running
    if (countdownSeconds > 0) {
      const minutes = Math.floor(countdownSeconds / 60);
      const remainingSeconds = countdownSeconds % 60;
      
      if (minutes > 0) {
        return `${minutes}m${remainingSeconds.toString().padStart(2, '0')}s`;
      } else {
        return `${remainingSeconds}s`;
      }
    }
    
    // Fallback - shouldn't normally reach here
    return "Due now";
  };



  const pendingTransaction: PendingTransaction = {
    estimatedEnergyWh: accumulatedEnergyWh,
    readingCount: recentReadings.length,
    countdownSeconds,
    nextExpectedTime: timingPattern?.nextExpectedTime || null,
    isOverdue
  };

  return {
    pendingTransaction,
    hasPendingTransaction,
    formatCountdown,
    isLoading: readingsLoading,
    error: readingsError || timingError,
    shouldRefreshBlockchain,
    setShouldRefreshBlockchain,
    refetchTiming, // Expose timing pattern refresh function
    forceCountdownReset, // Expose force reset function
    // Debug info
    recentReadings,
    timingPattern,
    isInOverdueMode, // Expose overdue state for debugging
    overdueCheckSeconds // Expose overdue timer for debugging
  };
}; 