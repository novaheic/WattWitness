const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    console.log("🔗 Deploying WattWitness Chainlink Consumer...");
    
    // Setup provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(process.env.FUJI_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log("📝 Deploying with account:", wallet.address);
    
    // Consumer contract bytecode and ABI (simplified)
    const consumerBytecode = "0x..."; // We'll need the actual bytecode
    const consumerABI = [
        "constructor(address router, uint64 subscriptionId, bytes32 donId)",
        "function validateEnergyData(string calldata source, string[] calldata args) external returns (bytes32)"
    ];
    
    // Chainlink Functions configuration
    const ROUTER_ADDRESS = "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0";
    const SUBSCRIPTION_ID = 15615; // From your .env
    const DON_ID = "0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000";
    
    console.log("⏳ Deploying WattWitnessConsumer...");
    
    // Create contract factory
    const ConsumerFactory = new ethers.ContractFactory(consumerABI, consumerBytecode, wallet);
    
    // Deploy
    const consumer = await ConsumerFactory.deploy(ROUTER_ADDRESS, SUBSCRIPTION_ID, DON_ID);
    await consumer.deployed();
    
    console.log("✅ WattWitnessConsumer deployed to:", consumer.address);
    console.log("🔗 Transaction hash:", consumer.deployTransaction.hash);
    
    console.log("\n🎉 Chainlink Consumer Deployment Summary:");
    console.log("==========================================");
    console.log("Consumer Address:", consumer.address);
    console.log("Router Address:", ROUTER_ADDRESS);
    console.log("Subscription ID:", SUBSCRIPTION_ID);
    console.log("DON ID:", DON_ID);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Consumer deployment failed:", error);
        process.exit(1);
    }); 