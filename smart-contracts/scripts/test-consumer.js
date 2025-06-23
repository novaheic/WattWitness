const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 Testing WattWitness Chainlink Consumer...");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Testing with account:", deployer.address);
    
    // Contract address from .env
    const CONTRACT_ADDRESS = process.env.CONSUMER_CONTRACT_ADDRESS || "0x05167616520aD6bd77B724D19681801D9Ba1EDb6";
    
    console.log("🔧 Contract Address:", CONTRACT_ADDRESS);
    
    // Get contract instance
    const WattWitnessConsumer = await ethers.getContractFactory("WattWitnessConsumer");
    const consumer = WattWitnessConsumer.attach(CONTRACT_ADDRESS);
    
    // Test basic contract functions
    console.log("\n🔍 Contract State:");
    console.log("   Owner:", await consumer.owner());
    console.log("   Subscription ID:", await consumer.subscriptionId());
    console.log("   DON ID:", await consumer.donId());
    console.log("   Gas Limit:", await consumer.gasLimit());
    console.log("   Last Request ID:", await consumer.lastRequestId());
    
    // Test Chainlink Functions request
    console.log("\n🚀 Testing Chainlink Functions Request...");
    
    const testSource = `
        // Simple test function
        const args = args || [];
        console.log("Received args:", args);
        
        // Return a simple response
        return Functions.encodeString("Hello from Chainlink Functions! Args: " + args.join(", "));
    `;
    
    const testArgs = ["test1", "test2", "123"];
    
    try {
        console.log("📤 Sending request with args:", testArgs);
        
        const tx = await consumer.validateEnergyData(testSource, testArgs);
        console.log("✅ Transaction sent:", tx.hash);
        
        // Wait for transaction to be mined
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
        
        // Get the last request details
        const [requestId, response, error] = await consumer.getLastRequestDetails();
        console.log("📋 Last Request Details:");
        console.log("   Request ID:", requestId);
        console.log("   Response:", response.length > 0 ? ethers.utils.toUtf8String(response) : "None");
        console.log("   Error:", error.length > 0 ? ethers.utils.toUtf8String(error) : "None");
        
    } catch (error) {
        console.error("❌ Request failed:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    }); 