const { ethers } = require("hardhat");

async function main() {
    console.log("🔗 Deploying WattWitness Chainlink Consumer...");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying with account:", deployer.address);
    console.log("💰 Account balance:", (await deployer.getBalance()).toString());
    
    // Chainlink Functions configuration from .env
    const ROUTER_ADDRESS = process.env.CHAINLINK_ROUTER || "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0";
    const SUBSCRIPTION_ID = process.env.CHAINLINK_SUBSCRIPTION_ID || "15639";
    const DON_ID = process.env.CHAINLINK_DON_ID || "0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000";
    
    console.log("🔧 Configuration:");
    console.log("   Router Address:", ROUTER_ADDRESS);
    console.log("   Subscription ID:", SUBSCRIPTION_ID);
    console.log("   DON ID:", DON_ID);
    
    // Deploy WattWitnessConsumer
    console.log("⏳ Deploying WattWitnessConsumer...");
    const WattWitnessConsumer = await ethers.getContractFactory("WattWitnessConsumer");
    const consumer = await WattWitnessConsumer.deploy(
        ROUTER_ADDRESS,
        SUBSCRIPTION_ID,
        DON_ID
    );
    
    await consumer.deployed();
    
    console.log("✅ WattWitnessConsumer deployed to:", consumer.address);
    console.log("🔗 Transaction hash:", consumer.deployTransaction.hash);
    
    console.log("\n🎉 Chainlink Consumer Deployment Summary:");
    console.log("==========================================");
    console.log("Consumer Address:", consumer.address);
    console.log("Router Address:", ROUTER_ADDRESS);
    console.log("Subscription ID:", SUBSCRIPTION_ID);
    console.log("DON ID:", DON_ID);
    console.log("Owner:", await consumer.owner());
    
    // Verify the deployment
    console.log("\n🔍 Verifying deployment...");
    console.log("   Owner:", await consumer.owner());
    console.log("   Router:", await consumer.i_router());
    console.log("   Subscription ID:", await consumer.subscriptionId());
    console.log("   DON ID:", await consumer.donId());
    console.log("   Gas Limit:", await consumer.gasLimit());
    
    console.log("\n📝 Add this to your .env file:");
    console.log(`CONSUMER_CONTRACT_ADDRESS=${consumer.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Consumer deployment failed:", error);
        process.exit(1);
    });

