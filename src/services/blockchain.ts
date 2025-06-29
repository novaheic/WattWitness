import { ethers } from 'ethers';
import { SOLARPARK_ABI } from '../contracts/SolarparkABI';

const CONTRACT_ADDRESS = '0x7189D2b09691a8867056a228fb3e227e12E5B105';
const AVALANCHE_FUJI_RPC = 'https://api.avax-test.network/ext/bc/C/rpc';

export interface ContractReading {
  readingId: string;
  powerW: string;
  totalEnergyWh: string;
  timestamp: number;
  signature: string;
}

export interface BlockchainRecord {
  timestamp: string;
  kWh: number;
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

class BlockchainService {
  private provider: ethers.providers.JsonRpcProvider;
  private contract: ethers.Contract;
  private eventListeners: Map<string, any> = new Map();

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(AVALANCHE_FUJI_RPC);
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, SOLARPARK_ABI, this.provider);
  }

  // Test connection and get basic info
  async testConnection(): Promise<{
    connected: boolean;
    network: string;
    readingsCount: number;
  }> {
    try {
      const network = await this.provider.getNetwork();
      const readingsCount = await this.contract.getReadingsCount();
      
      return {
        connected: true,
        network: network.name,
        readingsCount: readingsCount.toNumber()
      };
    } catch (error) {
      console.error('Blockchain connection test failed:', error);
      return {
        connected: false,
        network: 'unknown',
        readingsCount: 0
      };
    }
  }

  // Get latest readings from contract
  async getLatestReadings(count: number = 10): Promise<ContractReading[]> {
    try {
      const readings = await this.contract.getLatestReadings(count);
      
      return readings.map((reading: any) => ({
        readingId: reading.readingId.toString(),
        powerW: reading.powerW.toString(),
        totalEnergyWh: reading.totalEnergyWh.toString(),
        timestamp: reading.timestamp.toNumber(),
        signature: reading.signature
      }));
    } catch (error) {
      console.error('Failed to fetch latest readings:', error);
      return [];
    }
  }

  // Watch for Response events
  watchResponseEvents(callback: (event: any) => void): () => void {
    const eventFilter = this.contract.filters.Response();
    
    const handleEvent = async (requestId: string, response: string, err: string, timestamp: ethers.BigNumber, newReadingsCount: ethers.BigNumber, event: any) => {
      console.log('New Response event:', {
        requestId,
        timestamp: timestamp.toNumber(),
        newReadingsCount: newReadingsCount.toNumber(),
        txHash: event.transactionHash
      });
      
      callback({
        requestId,
        response,
        err,
        timestamp: timestamp.toNumber(),
        newReadingsCount: newReadingsCount.toNumber(),
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

  // Get transaction details
  async getTransactionDetails(txHash: string) {
    try {
      const tx = await this.provider.getTransaction(txHash);
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
  async getRecentTransactions(): Promise<BlockchainRecord[]> {
    try {
      const readings = await this.getLatestReadings(10);
      
      if (readings.length === 0) {
        return [];
      }
      
      // For now, we'll group readings and create mock transaction records
      // In reality, you'd need to track actual transaction hashes from events
      const records: BlockchainRecord[] = [];
      
      // Group readings into batches (simulating what would come from events)
      for (let i = 0; i < readings.length; i += 3) {
        const batch = readings.slice(i, i + 3);
        if (batch.length === 0) continue;
        
        const totalEnergy = batch.reduce((sum, reading) => 
          sum + (parseFloat(reading.totalEnergyWh) / 1000), 0); // Convert Wh to kWh
        
        records.push({
          timestamp: new Date(batch[0].timestamp * 1000).toISOString().replace('T', ' ').replace('Z', ' UTC'),
          kWh: parseFloat(totalEnergy.toFixed(2)),
          txHash: `0x${Math.random().toString(16).substr(2, 40)}`, // Mock for now - real tx hash comes from events
          publicKey: CONTRACT_ADDRESS,
          readings: batch.map(reading => ({
            timestamp: new Date(reading.timestamp * 1000).toISOString().slice(0, 19).replace('T', ' '),
            power: parseFloat(reading.powerW) / 1000, // Convert W to kW
            totalKwh: parseFloat(reading.totalEnergyWh) / 1000, // Convert Wh to kWh
            signature: reading.signature
          })),
          blockNumber: 0, // Will be filled from events
          confirmations: 12 // Mock confirmed status
        });
      }
      
      return records;
    } catch (error) {
      console.error('Failed to get recent transactions:', error);
      return [];
    }
  }
}

export const blockchainService = new BlockchainService(); 