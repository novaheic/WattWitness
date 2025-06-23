const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 Testing WattWitness Chainlink Consumer (with response monitoring)...");
    
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
    
    // Test Chainlink Functions request
    console.log("\n🚀 Testing Chainlink Functions Request...");
    
    const testSource = `
        // Simple test function for WattWitness
        const args = args || [];
        console.log("WattWitness test - Received args:", args);
        
        // Simulate energy data validation
        const timestamp = Date.now();
        const powerReading = args[0] || "1000";
        const deviceId = args[1] || "ESP32_TEST";
        
        // Return validation result
        const result = {
            timestamp: timestamp,
            powerReading: powerReading,
            deviceId: deviceId,
            validated: true,
            message: "Energy data validated successfully"
        };
        
        return Functions.encodeString(JSON.stringify(result));
    `;
    
    const testArgs = ["1500", "ESP32_EC64C9C05E97", "test_reading"];
    
    try {
        console.log("📤 Sending request with args:", testArgs);
        
        // Listen for events before sending the request
        consumer.on("EnergyDataValidated", (requestId, response) => {
            console.log("✅ EnergyDataValidated event received:");
            console.log("   Request ID:", requestId);
            console.log("   Response:", ethers.utils.toUtf8String(response));
        });
        
        consumer.on("ValidationError", (requestId, error) => {
            console.log("❌ ValidationError event received:");
            console.log("   Request ID:", requestId);
            console.log("   Error:", ethers.utils.toUtf8String(error));
        });
        
        const tx = await consumer.validateEnergyData(testSource, testArgs);
        console.log("✅ Transaction sent:", tx.hash);
        
        // Wait for transaction to be mined
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
        
        // Get the request ID from the transaction
        const requestId = await consumer.lastRequestId();
        console.log("📋 Request ID:", requestId);
        
        console.log("\n⏳ Waiting for Chainlink Functions response...");
        console.log("   This may take 1-2 minutes for the DON to process the request.");
        console.log("   You can check the Chainlink Functions dashboard for status.");
        
        // Wait a bit and then check for response
        setTimeout(async () => {
            try {
                const [lastRequestId, response, error] = await consumer.getLastRequestDetails();
                console.log("\n📋 Updated Request Details:");
                console.log("   Request ID:", lastRequestId);
                console.log("   Response:", response.length > 0 ? ethers.utils.toUtf8String(response) : "None");
                console.log("   Error:", error.length > 0 ? ethers.utils.toUtf8String(error) : "None");
            } catch (err) {
                console.log("   Still waiting for response...");
            }
        }, 30000); // Wait 30 seconds
        
    } catch (error) {
        console.error("❌ Request failed:", error.message);
    }
}

main()
    .then(() => {
        console.log("\n🎉 Test completed! Check the Chainlink Functions dashboard for request status.");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    }); 