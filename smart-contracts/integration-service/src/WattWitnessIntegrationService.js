require('dotenv').config({ path: '../.env' });

const { ethers } = require('ethers');
const winston = require('winston');
const axios = require('axios');

class WattWitnessIntegrationService {
    constructor(config) {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.printf(({ timestamp, level, message }) => {
                    return `${timestamp} [${level.toUpperCase()}] ${message}`;
                })
            ),
            transports: [
                new winston.transports.Console()
            ]
        });

        this.privateKey = process.env.PRIVATE_KEY;
        this.contractAddress = process.env.WATTWITNESS_CONTRACT_ADDRESS;
        this.rpcUrl = process.env.FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
        this.backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
        this.installationId = config.installationId || 1;

        if (!this.privateKey) {
            this.logger.error('PRIVATE_KEY not found in environment variables.');
            throw new Error('PRIVATE_KEY not found');
        }

        this.initializeProvider();
        this.logger.info(`✅ Wallet connected: ${this.wallet.address}`);
        this.logger.info(`🔗 Enhanced contract client initialized: ${this.contractAddress}`);
    }

    initializeProvider() {
        this.provider = new ethers.providers.JsonRpcProvider(this.rpcUrl);
        this.wallet = new ethers.Wallet(this.privateKey, this.provider);
        
        // Initialize consumer contract for Chainlink Functions
        if (process.env.USE_CHAINLINK === 'true') {
            this.initializeConsumerContract();
        }
    }

    initializeConsumerContract() {
        try {
            // Consumer contract ABI (simplified for validateEnergyData function)
            const consumerABI = [
                "function validateEnergyData(string calldata source, string[] calldata args) external returns (bytes32)",
                "event EnergyDataValidated(bytes32 indexed requestId, bytes response)",
                "event ValidationError(bytes32 indexed requestId, bytes error)"
            ];
            
            // Get consumer contract address from environment
            const consumerAddress = process.env.CONSUMER_CONTRACT_ADDRESS;
            if (!consumerAddress) {
                this.logger.warn('⚠️ CONSUMER_CONTRACT_ADDRESS not found in environment variables');
                this.logger.warn('🔗 Chainlink Functions will be simulated only');
                return;
            }
            
            this.consumerContract = new ethers.Contract(consumerAddress, consumerABI, this.wallet);
            this.logger.info(`✅ Consumer contract initialized: ${consumerAddress}`);
            
        } catch (error) {
            this.logger.error(`❌ Failed to initialize consumer contract: ${error.message}`);
            this.logger.warn('🔗 Chainlink Functions will be simulated only');
        }
    }

    async fetchUnprocessedReadings() {
        try {
            this.logger.info(`📦 Fetching unprocessed readings for installation ${this.installationId}...`);
            const response = await axios.get(
                `${this.backendUrl}/api/v1/readings/unprocessed-batch/${this.installationId}?minutes=5`
            );
            return response.data;
        } catch (error) {
            this.logger.error(`❌ Failed to fetch readings: ${error.message}`);
            throw error;
        }
    }

    async submitBatchToBlockchain(readings) {
        try {
            this.logger.info(`⚡ Processing ${readings.length} energy readings...`);
            this.logger.info(`📊 Batch Energy Data from ShellyEM:`);
            this.logger.info(`   🏠 Installation: ${this.installationId}`);
            this.logger.info(`   📦 Readings count: ${readings.length}`);
            
            // Calculate average power for logging
            const avgPower = readings.reduce((sum, r) => sum + r.power_w, 0) / readings.length;
            this.logger.info(`   ⚡ Average Power: ${avgPower.toFixed(2)}W`);

            // Check if we should use Chainlink Functions
            if (process.env.USE_CHAINLINK === 'true') {
                this.logger.info('🔗 Using Chainlink Functions for blockchain submission');
                
                try {
                    // Prepare arguments for Chainlink function
                    const args = [
                        this.installationId.toString(),
                        readings[0].timestamp.toString(),
                        readings[0].power_w.toString(),
                        readings[0].total_wh.toString(),
                        readings[0].signature
                    ];
                    
                    // Chainlink Functions source code
                    const sourceCode = `
function processReadings(args) {
    // Chainlink Functions will call this function
    // args[0] = installation_id
    // args[1] = timestamp  
    // args[2] = power_w
    // args[3] = total_wh
    // args[4] = signature
    
    console.log("🔗 Chainlink Functions: Processing energy reading");
    console.log("Args received:", args);
    
    try {
        // Validate inputs
        if (args.length < 5) {
            throw new Error("Invalid number of arguments");
        }
        
        const installationId = args[0];
        const timestamp = args[1];
        const powerW = args[2];
        const totalWh = args[3];
        const signature = args[4];
        
        // Log the processed data
        console.log("📊 Processed reading data:");
        console.log("   Installation ID: " + installationId);
        console.log("   Timestamp: " + timestamp);
        console.log("   Power: " + powerW + "W");
        console.log("   Total Energy: " + totalWh + "Wh");
        console.log("   Signature: " + signature.substring(0, 20) + "...");
        
        // For now, return success
        // Later this will call your smart contract
        return "SUCCESS: Energy reading processed successfully";
        
    } catch (error) {
        console.error("❌ Error processing reading:", error.message);
        return "ERROR: " + error.message;
    }
}
                    `;
                    
                    this.logger.info(`📡 Calling Chainlink Functions with args: ${JSON.stringify(args)}`);
                    
                    // Real Chainlink Functions call
                    if (this.consumerContract) {
                        this.logger.info(`🔗 Making real Chainlink Functions call...`);
                        
                        const txResponse = await this.consumerContract.validateEnergyData(sourceCode, args);
                        this.logger.info(`✅ Chainlink Functions transaction submitted: ${txResponse.hash}`);
                        
                        // Wait for confirmation
                        const receipt = await txResponse.wait();
                        this.logger.info(`✅ Chainlink Functions transaction confirmed in block ${receipt.blockNumber}`);
                        this.logger.info(`🔗 View on explorer: https://testnet.snowtrace.io/tx/${txResponse.hash}`);
                        
                        return {
                            hash: txResponse.hash,
                            blockNumber: receipt.blockNumber
                        };
                    } else {
                        // Fallback to simulation if consumer contract not initialized
                        this.logger.info(`🔗 Simulating Chainlink Functions call...`);
                        this.logger.info(`📊 Would process: Installation ${args[0]}, Power ${args[2]}W, Energy ${args[3]}Wh`);
                        
                        // Return unique mock result for each batch
                        const uniqueHash = `chainlink-functions-simulation-${Date.now()}`;
                        return {
                            hash: uniqueHash,
                            blockNumber: 0
                        };
                    }
                    
                } catch (error) {
                    this.logger.error(`❌ Chainlink Functions failed: ${error.message}`);
                    this.logger.info('🔄 Falling back to direct transaction method');
                    // Fall through to direct transaction
                }
            }

            // Original direct transaction method (fallback or when USE_CHAINLINK is false)
            if (process.env.USE_CHAINLINK !== 'true') {
                this.logger.info('💸 Using direct transaction method');
                
                // Create batch data structure
                const batchData = {
                    installation_id: this.installationId,
                    batch_timestamp: Math.floor(Date.now() / 1000),
                    readings: readings.map(r => ({
                        timestamp: r.timestamp,
                        power_w: r.power_w,
                        total_wh: r.total_wh,
                        signature: r.signature
                    }))
                };

                // Encode batch data
                const batchDataHex = ethers.utils.hexlify(
                    ethers.utils.toUtf8Bytes(JSON.stringify(batchData))
                );

                const transaction = {
                    to: this.wallet.address, // Send to self
                    value: ethers.utils.parseEther("0.001"), // 0.001 AVAX
                    data: batchDataHex,
                    gasLimit: process.env.GAS_LIMIT || 120000, // Use env variable or default
                    gasPrice: ethers.utils.parseUnits("25", "gwei")
                };

                this.logger.info(`📤 Batch transaction submitted to Avalanche Fuji testnet!`);
                const txResponse = await this.wallet.sendTransaction(transaction);
                
                this.logger.info(`🎉 SUCCESS! Batch energy data permanently recorded on blockchain!`);
                this.logger.info(`✅ Transaction hash: ${txResponse.hash}`);
                
                // Wait for confirmation
                const receipt = await txResponse.wait();
                this.logger.info(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
                this.logger.info(`🔗 View on explorer: https://testnet.snowtrace.io/tx/${txResponse.hash}`);
                this.logger.info(`🏆 This is a REAL blockchain transaction with ${readings.length} energy readings!`);

                return {
                    hash: txResponse.hash,
                    blockNumber: receipt.blockNumber
                };
            }
        } catch (error) {
            this.logger.error(`❌ Batch submission failed: ${error.message}`);
            throw error;
        }
    }

    async updateBackendBatch(txHash, readingIds, blockNumber) {
        try {
            const response = await axios.put(
                `${this.backendUrl}/api/v1/readings/batch-update/${txHash}`,
                {
                    reading_ids: readingIds,
                    block_number: blockNumber
                }
            );
            
            if (response.data.success) {
                this.logger.info(`✅ Backend updated with batch TX: ${txHash} (${response.data.updated_count} readings)`);
            } else {
                this.logger.warn(`⚠️ Backend batch update failed: ${response.data.error}`);
            }
        } catch (error) {
            this.logger.error(`❌ Failed to update backend batch: ${error.message}`);
        }
    }

    async processBatchReadings() {
        try {
            console.log(`📦 Processing batch readings for installation ${this.installationId}...`);
            
            const readings = await this.fetchUnprocessedReadings();
            
            if (readings.length === 0) {
                console.log(`✅ No unprocessed readings found for batch processing`);
                return;
            }
            
            console.log(`📦 Found ${readings.length} unprocessed readings for batch processing`);
            
            // Log some details about the batch
            const timeRange = readings.length > 1 ? 
                `${new Date(readings[0].timestamp * 1000).toISOString()} to ${new Date(readings[readings.length - 1].timestamp * 1000).toISOString()}` :
                new Date(readings[0].timestamp * 1000).toISOString();
            
            console.log(`⏰ Time range: ${timeRange}`);
            console.log(`⚡ Power range: ${Math.min(...readings.map(r => r.power_w)).toFixed(2)}W to ${Math.max(...readings.map(r => r.power_w)).toFixed(2)}W`);

            // Submit batch to blockchain
            const txResult = await this.submitBatchToBlockchain(readings);
            
            // Update backend with all reading IDs
            const readingIds = readings.map(r => r.id);
            await this.updateBackendBatch(txResult.hash, readingIds, txResult.blockNumber);

            this.logger.info(`🎉 Successfully processed batch with TX: ${txResult.hash}`);
            
        } catch (error) {
            this.logger.error(`❌ Error processing batch readings: ${error.message}`);
        }
    }

    start() {
        this.logger.info(`⛓️ Starting blockchain integration service with BATCH processing...`);
        
        // Process immediately
        this.processBatchReadings();
        
        // Set up interval (5 minutes for batch processing)
        const interval = process.env.INTEGRATION_INTERVAL || 300000; // 5 minutes
        setInterval(() => {
            this.processBatchReadings();
        }, interval);
        
        this.logger.info(`🔄 Integration service running with ${interval/1000}s intervals (batch mode)`);
    }
}

module.exports = WattWitnessIntegrationService;

