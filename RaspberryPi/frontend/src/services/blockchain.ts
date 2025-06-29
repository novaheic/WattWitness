import { ethers } from 'ethers';
import { SOLARPARK_ABI } from '../contracts/SolarparkABI';
import { api } from './api';

const CONTRACT_ADDRESS = '0x7189D2b09691a8867056a228fb3e227e12E5B105';
// RPC endpoints with your Infura endpoint first (best limits)
const AVALANCHE_FUJI_RPC_OPTIONS = [
  'https://avalanche-fuji.infura.io/v3/5988071a0489487a9507da0ba450cc23', // Your Infura (best limits)
  'https://api.avax-test.network/ext/bc/C/rpc', // Official (2048 block limit)
  'https://rpc.ankr.com/avalanche_fuji', // Ankr (may have higher limits)
  'https://avalanche-fuji-c-chain.publicnode.com', // PublicNode
  'https://ava-testnet.public.blastapi.io/ext/bc/C/rpc' // Blast API
];

// const AVALANCHE_FUJI_RPC = AVALANCHE_FUJI_RPC_OPTIONS[0]; // Use your Infura endpoint

export interface ContractReading {
  readingId: number;
  powerW: number;
  totalWh: number;
  timestamp: number;
  blockNumber: number;
  txHash: string;
}

export interface BatchInfo {
  requestId: string;
  merkleRoot: string;
  totalReadings: number;
  totalBatches: number;
  responseLength: number;
}

export interface BlockchainRecord {
  timestamp: string;
  kWh: number;
  kWhDisplay?: string; // Optional display string with proper units (Wh/kWh)
  txHash: string;
  publicKey: string;
  readings: Array<{
    timestamp: string;
    power: number;
    totalKwh: number;
    signature: string;
  }>;
  blockNumber: number;
  confirmations: number;
}

// Request deduplication and caching
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  promise?: Promise<T>;
}

class BlockchainService {
  private provider!: ethers.providers.JsonRpcProvider;
  private contract!: ethers.Contract;

  private currentRPCIndex: number = 0; // Start with Infura
  private cachedDeviceInfo: any = null; // Cache device info to avoid repeated API calls
  
  // Request deduplication and caching
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly CACHE_TTL = 30 * 1000; // 30 seconds cache
  private readonly TIMING_CACHE_TTL = 2 * 60 * 1000; // 2 minutes for timing pattern
  private ongoingRequests: Map<string, Promise<any>> = new Map();

  constructor() {
    this.initializeProvider();
    
    // Make debug method available in browser console for development
    if (typeof window !== 'undefined') {
      (window as any).debugBlockchainEnergy = () => this.debugEnergyCalculation();
    }
  }

  private initializeProvider() {
    const rpcUrl = AVALANCHE_FUJI_RPC_OPTIONS[this.currentRPCIndex];
    console.log(`🔗 Initializing with RPC: ${rpcUrl}`);
    
    // Create provider with NO AUTOMATIC RETRIES to prevent retry storms
    this.provider = new ethers.providers.JsonRpcProvider({
      url: rpcUrl,
      timeout: 30000, // 30 second timeout
    });
    
    // Disable automatic retries completely
    this.provider._networkPromise = this.provider._networkPromise.then(network => {
      // Override the perform method to disable retries
      const originalPerform = this.provider.perform.bind(this.provider);
      this.provider.perform = async (method: string, params: any) => {
        try {
          return await originalPerform(method, params);
        } catch (error: any) {
          // Don't retry on 429 errors - fail fast
          if (error.code === 'SERVER_ERROR' && error.status === 429) {
            console.warn('⚠️ Rate limited - not retrying to prevent spam');
            throw new Error('Rate limited - cooling down');
          }
          throw error;
        }
      };
      return network;
    });
    
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, SOLARPARK_ABI, this.provider);
  }

  // Cache helper methods
  private getCacheKey(method: string, ...args: any[]): string {
    return `${method}-${JSON.stringify(args)}`;
  }

  private getCachedData<T>(key: string, ttl: number = this.CACHE_TTL): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const age = Date.now() - entry.timestamp;
    if (age > ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Request deduplication wrapper
  private async deduplicateRequest<T>(key: string, requestFn: () => Promise<T>, ttl: number = this.CACHE_TTL): Promise<T> {
    // Check cache first
    const cached = this.getCachedData<T>(key, ttl);
    if (cached) {
      console.log(`💾 Using cached data for: ${key}`);
      return cached;
    }

    // Check for ongoing request
    const ongoing = this.ongoingRequests.get(key);
    if (ongoing) {
      console.log(`⏳ Waiting for ongoing request: ${key}`);
      return ongoing as Promise<T>;
    }

    // Make new request
    console.log(`🔄 Making new request: ${key}`);
    const promise = requestFn().finally(() => {
      this.ongoingRequests.delete(key);
    });

    this.ongoingRequests.set(key, promise);

    try {
      const result = await promise;
      this.setCachedData(key, result);
      return result;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  }

  // Switch to a different RPC provider
  switchRPCProvider(index: number): void {
    if (index >= 0 && index < AVALANCHE_FUJI_RPC_OPTIONS.length) {
      this.currentRPCIndex = index;
      console.log(`🔄 Switching to RPC ${index + 1}: ${AVALANCHE_FUJI_RPC_OPTIONS[index]}`);
      // Clear cache when switching providers
      this.cache.clear();
      this.ongoingRequests.clear();
      this.initializeProvider();
    }
  }

  // Get device info including the real ATECC608A public key
  private async getDeviceInfo(): Promise<any> {
    if (this.cachedDeviceInfo) {
      return this.cachedDeviceInfo;
    }

    try {
      // Get the first installation (assuming single installation setup)
      const installations = await api.getInstallations();
      if (installations.length === 0) {
        throw new Error('No installations found');
      }

      const installation = installations[0]; // Use first installation
      const deviceInfo = await api.getDeviceInfo(installation.id);
      
      console.log('📱 Device info fetched for blockchain records:', {
        deviceName: deviceInfo.deviceName,
        publicKey: deviceInfo.publicKey.substring(0, 20) + '...' // Log truncated for security
      });

      this.cachedDeviceInfo = deviceInfo;
      return deviceInfo;
    } catch (error) {
      console.error('❌ Failed to fetch device info:', error);
      // Return fallback data
      return {
        deviceName: 'WattWitness Device',
        publicKey: 'Device public key unavailable',
        macAddress: 'Unknown'
      };
    }
  }

  // Clear cached device info (useful for refreshing data)
  clearDeviceInfoCache(): void {
    this.cachedDeviceInfo = null;
    this.cache.clear(); // Also clear blockchain cache
    this.ongoingRequests.clear();
    console.log('🗑️ All caches cleared');
  }

  // Test connection and get basic info
  async testConnection(): Promise<{
    connected: boolean;
    network: string;
    readingsCount: number;
    contractExists: boolean;
    error?: string;
  }> {
    try {
      console.log('🔗 Testing connection to Avalanche Fuji...');
      const network = await this.provider.getNetwork();
      console.log('✅ Network connected:', network.name, 'chainId:', network.chainId);
      
      // Check if contract exists by getting its bytecode
      console.log('🔍 Checking if contract exists at:', CONTRACT_ADDRESS);
      const code = await this.provider.getCode(CONTRACT_ADDRESS);
      const contractExists = code !== '0x';
      console.log('📝 Contract bytecode length:', code.length, 'exists:', contractExists);
      
      if (!contractExists) {
        return {
          connected: true,
          network: network.name,
          readingsCount: 0,
          contractExists: false,
          error: 'Contract not deployed at this address'
        };
      }

      // Try calling the correct function name
      console.log('📞 Attempting to call totalReadingsProcessed()...');
      try {
        const readingsCount = await this.contract.totalReadingsProcessed();
        console.log('✅ totalReadingsProcessed() successful:', readingsCount);
        
        return {
          connected: true,
          network: network.name,
          readingsCount: readingsCount, // uint32 is automatically converted to JS number
          contractExists: true
        };
      } catch (contractError) {
        console.error('❌ Contract call failed:', contractError);
        
        // Try to get more details about the error
        const errorMessage = contractError instanceof Error ? contractError.message : 'Unknown contract error';
        
        return {
          connected: true,
          network: network.name,
          readingsCount: 0,
          contractExists: true,
          error: `Contract call failed: ${errorMessage}`
        };
      }
      
    } catch (error) {
      console.error('❌ Blockchain connection test failed:', error);
      return {
        connected: false,
        network: 'unknown',
        readingsCount: 0,
        contractExists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get latest batch info
  async getLatestBatchInfo(): Promise<BatchInfo | null> {
    try {
      console.log('📊 Fetching latest batch info...');
      const batchInfo = await this.contract.getLatestBatchInfo();
      console.log('✅ Batch info fetched:', batchInfo);
      
      return {
        requestId: batchInfo.requestId,
        merkleRoot: batchInfo.merkleRoot,
        totalReadings: batchInfo.totalReadings, // uint32 -> JS number
        totalBatches: batchInfo.totalBatches.toNumber(), // uint256 -> BigNumber -> JS number
        responseLength: batchInfo.responseLength.toNumber() // uint256 -> BigNumber -> JS number
      };
    } catch (error) {
      console.error('❌ Failed to fetch batch info:', error);
      return null;
    }
  }

  // Test different RPC providers for block limits
  async testRPCProviders(): Promise<void> {
    console.log('🔍 Testing different RPC providers for block limits...');
    
    for (let i = 0; i < AVALANCHE_FUJI_RPC_OPTIONS.length; i++) {
      const rpcUrl = AVALANCHE_FUJI_RPC_OPTIONS[i];
      console.log(`\n🧪 Testing RPC ${i + 1}: ${rpcUrl}`);
      
      try {
        const testProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const currentBlock = await testProvider.getBlockNumber();
        console.log(`✅ Connected to ${rpcUrl}, current block: ${currentBlock}`);
        
        // Test with increasingly larger block ranges (Infura should handle much more)
        const testRanges = [2000, 5000, 10000, 20000, 50000, 100000];
        
        for (const range of testRanges) {
          try {
            const fromBlock = Math.max(0, currentBlock - range);
            const logs = await testProvider.getLogs({
              address: CONTRACT_ADDRESS,
              fromBlock: fromBlock,
              toBlock: currentBlock
            });
            console.log(`✅ ${rpcUrl} - ${range} blocks: ${logs.length} events`);
          } catch (error) {
            console.log(`❌ ${rpcUrl} - ${range} blocks: Failed`);
            break; // Stop testing larger ranges for this provider
          }
        }
      } catch (error) {
        console.log(`❌ ${rpcUrl}: Connection failed`);
      }
    }
  }

  // Debug method to check all events from the contract
  async debugContractEvents(): Promise<void> {
    try {
      console.log('🔧 Debugging contract events...');
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 5000); // Larger range with Infura
      
      // Get ALL events from this contract (no filter)
      const allEvents = await this.provider.getLogs({
        address: CONTRACT_ADDRESS,
        fromBlock: fromBlock,
        toBlock: currentBlock
      });
      
      console.log(`📋 Found ${allEvents.length} total events from contract in last 2000 blocks`);
      
      if (allEvents.length > 0) {
        const topics = [...new Set(allEvents.map(e => e.topics[0]))];
        console.log('🏷️ Unique event topic hashes found:', topics);
        
        // Check our expected topic hashes
        const powerReadingTopic = this.contract.interface.getEventTopic('PowerReading');
        const batchProcessedTopic = this.contract.interface.getEventTopic('BatchProcessed');
        
        console.log('🎯 Expected PowerReading topic:', powerReadingTopic);
        console.log('🎯 Expected BatchProcessed topic:', batchProcessedTopic);
        
        console.log('✅ PowerReading topic match:', topics.includes(powerReadingTopic));
        console.log('✅ BatchProcessed topic match:', topics.includes(batchProcessedTopic));
      }
    } catch (error) {
      console.error('❌ Failed to debug contract events:', error);
    }
  }

  // Get PowerReading events from older blocks if recent search fails
  async getPowerReadingEventsOlderBlocks(count: number = 50): Promise<ContractReading[]> {
    try {
      console.log(`🕰️ Searching older blocks for PowerReading events...`);
      
      const currentBlock = await this.provider.getBlockNumber();
      // Search in chunks of 2000 blocks, going back much further
      const searchRanges = [
        { from: currentBlock - 4000, to: currentBlock - 2000 },
        { from: currentBlock - 6000, to: currentBlock - 4000 },
        { from: currentBlock - 8000, to: currentBlock - 6000 },
        { from: currentBlock - 10000, to: currentBlock - 8000 },
        { from: currentBlock - 15000, to: currentBlock - 10000 },
        { from: currentBlock - 20000, to: currentBlock - 15000 },
        { from: currentBlock - 30000, to: currentBlock - 20000 }
      ];
      
      for (const range of searchRanges) {
        const fromBlock = Math.max(0, range.from);
        const toBlock = Math.max(0, range.to);
        
        console.log(`🔍 Searching blocks ${fromBlock} to ${toBlock}`);
        
        const filter = this.contract.filters.PowerReading();
        const events = await this.contract.queryFilter(filter, fromBlock, toBlock);
        
        if (events.length > 0) {
          console.log(`✅ Found ${events.length} PowerReading events in older blocks (${fromBlock}-${toBlock})`);
          
          const readings = events
            .slice(-count)
            .map((event: any) => ({
              readingId: event.args.readingId,
              powerW: event.args.powerW,
              totalWh: event.args.totalWh,
              timestamp: event.args.timestamp,
              blockNumber: event.blockNumber,
              txHash: event.transactionHash
            }))
            .reverse();
          
          return readings;
        }
      }
      
      console.log('❌ No PowerReading events found in older blocks either');
      return [];
    } catch (error) {
      console.error('❌ Failed to fetch PowerReading events from older blocks:', error);
      return [];
    }
  }

  // Get PowerReading events (the actual reading data) - with deduplication
  async getPowerReadingEvents(count: number = 50): Promise<ContractReading[]> {
    const cacheKey = this.getCacheKey('getPowerReadingEvents', count);
    
    return this.deduplicateRequest(cacheKey, async () => {
      try {
        console.log(`📚 Fetching latest ${count} PowerReading events...`);
        
        // Get current block (Infura should have much higher limits than public RPCs)
        const currentBlock = await this.provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 5000); // Reduced to 5k blocks for more recent events
        
        console.log(`⏰ Current block: ${currentBlock}`);
        
        console.log(`🔍 Searching blocks ${fromBlock} to ${currentBlock} (${currentBlock - fromBlock} blocks)`);
        
        // Query PowerReading events
        const filter = this.contract.filters.PowerReading();
        const events = await this.contract.queryFilter(filter, fromBlock, currentBlock);
        
        console.log(`✅ Found ${events.length} PowerReading events`);
        
        // If no PowerReading events, try to find BatchProcessed events for debugging
        if (events.length === 0) {
          console.log('🔍 No PowerReading events found, checking for BatchProcessed events...');
          const batchFilter = this.contract.filters.BatchProcessed();
          const batchEvents = await this.contract.queryFilter(batchFilter, fromBlock, currentBlock);
          console.log(`📦 Found ${batchEvents.length} BatchProcessed events in the same range`);
          
          if (batchEvents.length > 0) {
            console.log('📦 Recent BatchProcessed events:', batchEvents.map(e => ({
              blockNumber: e.blockNumber,
              txHash: e.transactionHash,
              firstReadingId: e.args?.firstReadingId,
              readingCount: e.args?.readingCount
            })));
          }
        }
        
               // Convert events to readings and take the latest ones
         const readings = events
           .slice(-count) // Take last N events
           .map((event: any) => ({
             readingId: event.args.readingId, // uint32 -> JS number
             powerW: event.args.powerW, // uint32 -> JS number
             totalWh: event.args.totalWh, // uint32 -> JS number
             timestamp: event.args.timestamp, // uint32 -> JS number
             blockNumber: event.blockNumber,
             txHash: event.transactionHash
           }))
          .reverse(); // Most recent first
        
        console.log('📊 Processed readings:', readings.length);
        return readings;
      } catch (error) {
        console.error('❌ Failed to fetch PowerReading events:', error);
        return [];
      }
    }, this.CACHE_TTL);
  }

  // Watch for BatchProcessed events (when new batches are processed)
  watchBatchProcessedEvents(callback: (event: any) => void): () => void {
    const eventFilter = this.contract.filters.BatchProcessed();
    
    const handleEvent = async (requestId: string, merkleRoot: string, firstReadingId: number, readingCount: number, gasUsed: ethers.BigNumber, event: any) => {
      console.log('🎯 New BatchProcessed event:', {
        requestId,
        merkleRoot,
        firstReadingId, // uint32 -> JS number
        readingCount, // uint16 -> JS number
        txHash: event.transactionHash
      });
      
      callback({
        requestId,
        merkleRoot,
        firstReadingId,
        readingCount,
        gasUsed: gasUsed.toNumber(), // uint256 -> BigNumber -> JS number
        txHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    };

    this.contract.on(eventFilter, handleEvent);
    
    // Return cleanup function
    return () => {
      this.contract.off(eventFilter, handleEvent);
    };
  }

  // Watch for PowerReading events (individual readings)
  watchPowerReadingEvents(callback: (event: any) => void): () => void {
    const eventFilter = this.contract.filters.PowerReading();
    
    const handleEvent = async (readingId: number, timestamp: number, powerW: number, totalWh: number, event: any) => {
      console.log('⚡ New PowerReading event:', {
        readingId, // uint32 -> JS number
        timestamp, // uint32 -> JS number
        powerW, // uint32 -> JS number
        totalWh, // uint32 -> JS number
        txHash: event.transactionHash
      });
      
      callback({
        readingId,
        timestamp,
        powerW,
        totalWh,
        txHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    };

    this.contract.on(eventFilter, handleEvent);
    
    return () => {
      this.contract.off(eventFilter, handleEvent);
    };
  }

  // Alternative function to check contract without calling specific functions
  async getContractInfo(): Promise<{
    address: string;
    bytecodeLength: number;
    exists: boolean;
    networkId: number;
  }> {
    try {
      const network = await this.provider.getNetwork();
      const code = await this.provider.getCode(CONTRACT_ADDRESS);
      
      return {
        address: CONTRACT_ADDRESS,
        bytecodeLength: code.length,
        exists: code !== '0x',
        networkId: network.chainId
      };
    } catch (error) {
      console.error('Failed to get contract info:', error);
      throw error;
    }
  }

  // Get transaction details
  async getTransactionDetails(txHash: string) {
    try {
      // const tx = await this.provider.getTransaction(txHash);
      const receipt = await this.provider.getTransactionReceipt(txHash);
      const block = await this.provider.getBlock(receipt.blockNumber);
      
      return {
        hash: txHash,
        blockNumber: receipt.blockNumber,
        blockTimestamp: block.timestamp,
        confirmations: receipt.confirmations,
        status: receipt.status
      };
    } catch (error) {
      console.error('Failed to get transaction details:', error);
      return null;
    }
  }

  // Get formatted data for LatestRecords component
  // Get recent transactions with deduplication
  async getRecentTransactions(): Promise<BlockchainRecord[]> {
    const cacheKey = this.getCacheKey('getRecentTransactions');
    
    return this.deduplicateRequest(cacheKey, async () => {
      try {
        // Get more PowerReading events from larger block range to find more transactions
        const readings = await this.getPowerReadingEvents(100); // Increased from 50 to 100
      
      console.log(`🔍 DEBUG: Raw readings fetched: ${readings.length}`);
      
      if (readings.length === 0) {
        console.log('❌ DEBUG: No readings found, returning empty array');
        return [];
      }

      // Log first few readings for debugging
      console.log('🔍 DEBUG: First 5 readings:', readings.slice(0, 5).map(r => ({
        readingId: r.readingId,
        txHash: r.txHash,
        blockNumber: r.blockNumber,
        timestamp: new Date(r.timestamp * 1000).toISOString()
      })));

      // Get device info to use the real ATECC608A public key
      const deviceInfo = await this.getDeviceInfo();
      
      // Group readings by transaction hash (readings from same batch)
      const recordMap = new Map<string, ContractReading[]>();
      readings.forEach(reading => {
        if (!recordMap.has(reading.txHash)) {
          recordMap.set(reading.txHash, []);
        }
        recordMap.get(reading.txHash)!.push(reading);
      });
      
      console.log(`🔍 DEBUG: Unique transaction hashes: ${recordMap.size}`);
      console.log('🔍 DEBUG: Transactions with reading counts and timing:', 
        Array.from(recordMap.entries()).map(([txHash, readings]) => {
          const firstReading = readings[0];
          const lastReading = readings[readings.length - 1];
          const timeSpanMinutes = firstReading && lastReading ? 
            (lastReading.timestamp - firstReading.timestamp) / 60 : 0;
          
          return {
            txHash: txHash.substring(0, 10) + '...',
            readingCount: readings.length,
            blockNumber: firstReading?.blockNumber,
            firstTimestamp: firstReading ? new Date(firstReading.timestamp * 1000).toISOString() : 'N/A',
            lastTimestamp: lastReading ? new Date(lastReading.timestamp * 1000).toISOString() : 'N/A',
            timeSpanMinutes: timeSpanMinutes.toFixed(1),
            expectedReadings: Math.ceil(timeSpanMinutes * 3), // 20 seconds = 3 per minute
          };
        })
      );
      
      // Show if we should expect more transactions
      const totalReadings = readings.length;
      const expectedTransactions = Math.ceil(totalReadings / 15); // 15 readings per 5-minute batch
      console.log(`📊 Analysis: Got ${totalReadings} readings across ${recordMap.size} transactions`);
      console.log(`📊 Expected: ~${expectedTransactions} transactions if 15 readings per 5-minute batch`);
      console.log(`📊 Suggestion: ${recordMap.size < expectedTransactions ? 'Need to search more recent blocks' : 'Data looks correct'}`);
      
      // Get unique block numbers to fetch timestamps efficiently
      const uniqueBlockNumbers = [...new Set(Array.from(recordMap.values()).flat().map(r => r.blockNumber))];
      console.log(`🔍 DEBUG: Fetching block timestamps for ${uniqueBlockNumbers.length} unique blocks`);
      
      // Fetch all block timestamps at once
      const blockTimestamps = new Map<number, number>();
      for (const blockNumber of uniqueBlockNumbers) {
        try {
          const block = await this.provider.getBlock(blockNumber);
          blockTimestamps.set(blockNumber, block.timestamp);
          console.log(`⏰ Block ${blockNumber} timestamp: ${block.timestamp} (${new Date(block.timestamp * 1000).toISOString()})`);
        } catch (error) {
          console.warn(`⚠️ Failed to fetch block ${blockNumber} timestamp:`, error);
        }
      }

      // Convert to BlockchainRecord format - using block timestamps instead of event timestamps
      const records: BlockchainRecord[] = [];
      for (const [txHash, batchReadings] of recordMap.entries()) {
        if (batchReadings.length === 0) continue;
        
        // Calculate energy ADDED during this transaction (difference between first and last reading)
        const firstReading = batchReadings.reduce((earliest, reading) => 
          reading.timestamp < earliest.timestamp ? reading : earliest
        );
        const lastReading = batchReadings.reduce((latest, reading) => 
          reading.timestamp > latest.timestamp ? reading : latest
        );
        
        let energyAddedWh = lastReading.totalWh - firstReading.totalWh; // Keep in Wh for now
        
        console.log(`🔍 DEBUG Energy Calculation:`);
        console.log(`  First reading: ${firstReading.totalWh}Wh at ${new Date(firstReading.timestamp * 1000).toISOString()}`);
        console.log(`  Last reading:  ${lastReading.totalWh}Wh at ${new Date(lastReading.timestamp * 1000).toISOString()}`);
        console.log(`  Difference: ${energyAddedWh}Wh`);
        console.log(`  Power readings:`, batchReadings.map(r => `${r.powerW}W`).join(', '));
        
        // If totalWh didn't change but we have power readings, estimate energy from power data
        if (energyAddedWh === 0 && batchReadings.some(r => r.powerW > 0)) {
          console.log(`📊 totalWh unchanged (${firstReading.totalWh}Wh), estimating from power readings...`);
          
          // Calculate average power and time duration
          const averagePowerW = batchReadings.reduce((sum, r) => sum + r.powerW, 0) / batchReadings.length;
          const timeSpanSeconds = lastReading.timestamp - firstReading.timestamp;
          const timeSpanHours = timeSpanSeconds / 3600;
          
          // Estimate energy = average power * time duration
          energyAddedWh = averagePowerW * timeSpanHours;
          
          console.log(`📊 Power estimate: ${averagePowerW.toFixed(3)}W avg × ${timeSpanHours.toFixed(4)}h = ${energyAddedWh.toFixed(3)}Wh estimated`);
        } else if (energyAddedWh === 0) {
          console.log(`❌ No energy change and no power readings detected`);
        }
        
        // Auto-adjust units based on magnitude
        let energyValue: number;
        let energyUnit: string;
        let energyDisplay: string;
        
        console.log(`🔍 DEBUG Unit Selection: energyAddedWh = ${energyAddedWh.toFixed(4)}Wh`);
        
        if (energyAddedWh >= 1000) {
          energyValue = energyAddedWh / 1000;
          energyUnit = 'kWh';
          energyDisplay = `+${energyValue.toFixed(2)}${energyUnit}`;
        } else if (energyAddedWh > 0.001) { // Show Wh for values > 0.001Wh
          energyValue = energyAddedWh;
          energyUnit = 'Wh';
          energyDisplay = `+${energyValue.toFixed(2)}${energyUnit}`;
        } else if (energyAddedWh > 0) { // Show very small values in mWh (milliwatt-hours)
          energyValue = energyAddedWh * 1000;
          energyUnit = 'mWh';
          energyDisplay = `+${energyValue.toFixed(1)}${energyUnit}`;
        } else {
          energyValue = 0;
          energyUnit = 'Wh';
          energyDisplay = `+0${energyUnit}`;
        }
        
        console.log(`🔍 DEBUG Final display: ${energyDisplay} (energyValue=${energyValue}, energyUnit=${energyUnit})`);
        console.log(`⚡ TX ${txHash.substring(0, 8)}: ${firstReading.totalWh}Wh → ${lastReading.totalWh}Wh = ${energyDisplay} ${energyAddedWh === (lastReading.totalWh - firstReading.totalWh) ? 'added' : 'estimated'}`);
        
        // Get the actual block timestamp (not the event timestamp)
        const blockNumber = batchReadings[0].blockNumber;
        const blockTimestamp = blockTimestamps.get(blockNumber);
        
        if (!blockTimestamp) {
          console.warn(`⚠️ No block timestamp found for block ${blockNumber}, skipping`);
          continue;
        }
        
        // Store kWh value properly based on unit
        let kWhValue: number;
        if (energyUnit === 'kWh') {
          kWhValue = energyValue;
        } else if (energyUnit === 'Wh') {
          kWhValue = energyValue / 1000;
        } else if (energyUnit === 'mWh') {
          kWhValue = energyValue / 1000000; // Convert mWh to kWh
        } else {
          kWhValue = 0;
        }
        
        console.log(`🔍 DEBUG Storage: kWh=${kWhValue.toFixed(6)}, kWhDisplay="${energyDisplay}"`);
        
        records.push({
          timestamp: new Date(blockTimestamp * 1000).toISOString().slice(0, 19).replace('T', ' ') + ' UTC',
          kWh: kWhValue,
          kWhDisplay: energyDisplay, // Store the display string with proper units
          txHash: txHash,
          publicKey: deviceInfo.publicKey, // Use real ATECC608A public key
          readings: batchReadings.map(reading => ({
            timestamp: new Date(reading.timestamp * 1000).toISOString().slice(0, 19).replace('T', ' '),
            power: reading.powerW / 1000, // Convert W to kW
            totalKwh: reading.totalWh / 1000, // Convert Wh to kWh
            signature: `${reading.readingId}: ${reading.powerW}W @ ${new Date(reading.timestamp * 1000).toLocaleTimeString()}` // More descriptive signature
          })),
          blockNumber: blockNumber,
          confirmations: 12 // Assume confirmed to avoid extra API calls
        });
      }
      
      // Sort by block number (most recent first)
      records.sort((a, b) => b.blockNumber - a.blockNumber);
      
      console.log(`🔍 DEBUG: Final records created: ${records.length}`);
      console.log('🔍 DEBUG: Records summary:', records.map(r => ({
        timestamp: r.timestamp,
        energyAdded: `+${r.kWh}kWh`,
        txHash: r.txHash.substring(0, 10) + '...',
        readingCount: r.readings.length,
        blockNumber: r.blockNumber
      })));
      
      const finalRecords = records.slice(0, 10); // Return latest 10 transaction records
      console.log(`🔍 DEBUG: Returning ${finalRecords.length} records to dashboard`);
      
      return finalRecords;
    } catch (error) {
      console.error('Failed to get recent transactions:', error);
      
      // Check for rate limiting errors and throw with specific message
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('429') || 
            errorMessage.includes('too many requests') || 
            errorMessage.includes('rate limit') ||
            (error as any)?.code === 429) {
          throw new Error('429 Rate limited - too many requests to blockchain RPC');
        }
      }
      
      throw error;
    }
    }, this.CACHE_TTL);
  }

  // Quick debug method for energy calculation issues
  async debugEnergyCalculation(): Promise<void> {
    console.log('🔍 === DEBUGGING ENERGY CALCULATION ===');
    
    try {
      const transactions = await this.getRecentTransactions();
      console.log(`📊 Found ${transactions.length} transactions`);
      
      transactions.forEach((tx, i) => {
        console.log(`\n📦 Transaction ${i + 1}:`);
        console.log(`  Timestamp: ${tx.timestamp}`);
        console.log(`  kWh: ${tx.kWh.toFixed(6)}`);
        console.log(`  kWhDisplay: "${tx.kWhDisplay}"`);
        console.log(`  Readings: ${tx.readings.length}`);
        
        tx.readings.forEach((reading, j) => {
          console.log(`    Reading ${j + 1}: ${reading.power.toFixed(3)}kW, Total: ${reading.totalKwh.toFixed(3)}kWh`);
        });
      });
      
    } catch (error) {
      console.error('❌ Energy debug failed:', error);
    }
    
    console.log('🔍 === END ENERGY DEBUG ===\n');
  }

  // Debug method to troubleshoot missing events
  async debugMissingEvents(): Promise<void> {
    try {
      console.log('🐛 === DEBUGGING MISSING EVENTS ===');
      
      // 1. Check current block and provider status
      const currentBlock = await this.provider.getBlockNumber();
      const network = await this.provider.getNetwork();
      console.log(`📡 Provider: ${this.provider.connection.url}`);
      console.log(`🌐 Network: ${network.name} (${network.chainId})`);
      console.log(`📊 Current block: ${currentBlock}`);
      
      // 2. Check multiple block ranges for PowerReading events
      const ranges = [
        { name: 'Last 100 blocks', from: currentBlock - 100, to: currentBlock },
        { name: 'Last 1000 blocks', from: currentBlock - 1000, to: currentBlock },
        { name: 'Last 5000 blocks', from: currentBlock - 5000, to: currentBlock },
        { name: 'Last 10000 blocks', from: currentBlock - 10000, to: currentBlock }
      ];
      
      for (const range of ranges) {
        const fromBlock = Math.max(0, range.from);
        console.log(`🔍 Searching ${range.name}: blocks ${fromBlock} to ${range.to}`);
        
        try {
          const filter = this.contract.filters.PowerReading();
          const events = await this.contract.queryFilter(filter, fromBlock, range.to);
          console.log(`✅ Found ${events.length} PowerReading events in ${range.name}`);
          
                     if (events.length > 0) {
             const latestEvent = events[events.length - 1];
             console.log(`📅 Latest event: Block ${latestEvent.blockNumber}, TX: ${latestEvent.transactionHash}`);
             if (latestEvent.args) {
               console.log(`⚡ Event data:`, {
                 readingId: latestEvent.args.readingId,
                 powerW: latestEvent.args.powerW,
                 totalWh: latestEvent.args.totalWh,
                 timestamp: latestEvent.args.timestamp,
                 readableTime: new Date(latestEvent.args.timestamp * 1000).toISOString()
               });
             }
           }
        } catch (error) {
          console.log(`❌ Error searching ${range.name}:`, error);
        }
      }
      
      // 3. Check BatchProcessed events for comparison
      console.log('\n📦 Checking BatchProcessed events...');
      try {
        const batchFilter = this.contract.filters.BatchProcessed();
        const batchEvents = await this.contract.queryFilter(batchFilter, currentBlock - 5000, currentBlock);
        console.log(`📦 Found ${batchEvents.length} BatchProcessed events in last 5000 blocks`);
        
        if (batchEvents.length > 0) {
          batchEvents.forEach((event, i) => {
            console.log(`📦 Batch ${i + 1}:`, {
              blockNumber: event.blockNumber,
              txHash: event.transactionHash,
              firstReadingId: event.args?.firstReadingId,
              readingCount: event.args?.readingCount,
              merkleRoot: event.args?.merkleRoot
            });
          });
        }
      } catch (error) {
        console.log('❌ Error fetching BatchProcessed events:', error);
      }
      
      // 4. Check contract state directly
      console.log('\n🏗️ Checking contract state...');
      try {
        const totalReadings = await this.contract.totalReadingsProcessed();
        console.log(`📊 Total readings processed by contract: ${totalReadings}`);
        
        const latestBatch = await this.contract.getLatestBatchInfo();
        console.log(`📦 Latest batch info:`, {
          requestId: latestBatch.requestId,
          totalReadings: latestBatch.totalReadings.toString(),
          totalBatches: latestBatch.totalBatches.toString(),
          responseLength: latestBatch.responseLength.toString()
        });
      } catch (error) {
        console.log('❌ Error checking contract state:', error);
      }
      
      console.log('🐛 === END DEBUGGING ===\n');
      
    } catch (error) {
      console.error('❌ Debug method failed:', error);
    }
  }

  // Analyze transaction timing patterns to predict next transaction - with deduplication and longer cache
  async getTransactionTimingPattern(): Promise<{
    lastTransactionTime: Date;
    averageIntervalMinutes: number;
    nextExpectedTime: Date;
    minutesUntilNext: number;
    isOverdue: boolean;
  } | null> {
    const cacheKey = this.getCacheKey('getTransactionTimingPattern');
    
    return this.deduplicateRequest(cacheKey, async () => {
      try {
        console.log('📅 Analyzing transaction timing pattern...');
        
        // Get recent BatchProcessed events to analyze timing
        const currentBlock = await this.provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 10000);
        
        const batchFilter = this.contract.filters.BatchProcessed();
        const batchEvents = await this.contract.queryFilter(batchFilter, fromBlock, currentBlock);
        
        if (batchEvents.length < 2) {
          console.log('❌ Not enough batch events to analyze timing pattern');
          return null;
        }
        
        // Get block timestamps for timing analysis
        const eventTimestamps: Date[] = [];
        for (const event of batchEvents.slice(-5)) { // Analyze last 5 events
          const block = await this.provider.getBlock(event.blockNumber);
          eventTimestamps.push(new Date(block.timestamp * 1000));
        }
        
        // Calculate intervals between transactions
        const intervals: number[] = [];
        for (let i = 1; i < eventTimestamps.length; i++) {
          const intervalMs = eventTimestamps[i].getTime() - eventTimestamps[i-1].getTime();
          intervals.push(intervalMs / (1000 * 60)); // Convert to minutes
        }
        
        const averageIntervalMinutes = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        const lastTransactionTime = eventTimestamps[eventTimestamps.length - 1];
        
        // Predict next transaction time
        const nextExpectedTime = new Date(lastTransactionTime.getTime() + (averageIntervalMinutes * 60 * 1000));
        const now = new Date();
        const minutesUntilNext = (nextExpectedTime.getTime() - now.getTime()) / (1000 * 60);
        const isOverdue = minutesUntilNext < 0;
        
        console.log('📊 Transaction timing analysis:', {
          lastTransaction: lastTransactionTime.toISOString(),
          averageInterval: `${averageIntervalMinutes.toFixed(1)} minutes`,
          nextExpected: nextExpectedTime.toISOString(),
          minutesUntilNext: minutesUntilNext.toFixed(1),
          isOverdue
        });
        
        return {
          lastTransactionTime,
          averageIntervalMinutes,
          nextExpectedTime,
          minutesUntilNext,
          isOverdue
        };
        
      } catch (error) {
        console.error('❌ Failed to analyze transaction timing:', error);
        return null;
      }
    }, this.TIMING_CACHE_TTL); // Use longer cache time (2 minutes)
  }

  // Debug method to compare event timestamps vs block timestamps
  async debugTimestampDiscrepancy(): Promise<void> {
    try {
      console.log('🕰️ === DEBUGGING TIMESTAMP DISCREPANCY ===');
      
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 2000);
      
      // Get recent PowerReading events
      const filter = this.contract.filters.PowerReading();
      const events = await this.contract.queryFilter(filter, fromBlock, currentBlock);
      
      if (events.length === 0) {
        console.log('❌ No PowerReading events found for timestamp comparison');
        return;
      }
      
      console.log(`🔍 Analyzing ${Math.min(5, events.length)} most recent events...`);
      
      // Check last 5 events
      const recentEvents = events.slice(-5);
      
      for (const event of recentEvents) {
        // Get block info
        const block = await this.provider.getBlock(event.blockNumber);
        
        // Compare timestamps
        const eventTimestamp = event.args?.timestamp; // From PowerReading event
        const blockTimestamp = block.timestamp; // From block
        
        const eventTime = new Date(eventTimestamp * 1000);
        const blockTime = new Date(blockTimestamp * 1000);
        const diffMinutes = (eventTime.getTime() - blockTime.getTime()) / (1000 * 60);
        
        console.log(`📊 Block ${event.blockNumber}:`);
        console.log(`  TX Hash: ${event.transactionHash}`);
        console.log(`  Event timestamp: ${eventTimestamp} (${eventTime.toISOString()})`);
        console.log(`  Block timestamp: ${blockTimestamp} (${blockTime.toISOString()})`);
        console.log(`  Difference: ${diffMinutes.toFixed(2)} minutes ${diffMinutes > 0 ? 'ahead' : 'behind'}`);
        console.log(`  Event time formatted: ${eventTime.toISOString().slice(0, 19).replace('T', ' ')} UTC`);
        console.log(`  Block time formatted: ${blockTime.toISOString().slice(0, 19).replace('T', ' ')} UTC`);
        console.log('  ---');
      }
      
      // Show current time for reference
      const now = new Date();
      console.log(`⏰ Current frontend time: ${now.toISOString().slice(0, 19).replace('T', ' ')} UTC`);
      console.log(`⏰ Current unix timestamp: ${Math.floor(now.getTime() / 1000)}`);
      
      console.log('🕰️ === END TIMESTAMP DEBUGGING ===\n');
      
    } catch (error) {
      console.error('❌ Timestamp debug failed:', error);
    }
  }
}

export const blockchainService = new BlockchainService(); 