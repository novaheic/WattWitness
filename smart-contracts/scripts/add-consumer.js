const { ethers } = require("hardhat");

async function main() {
    console.log("🔧 Adding WattWitnessConsumer as Chainlink Functions consumer...");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Account:", deployer.address);
    
    // Contract address
    const CONTRACT_ADDRESS = process.env.CONSUMER_CONTRACT_ADDRESS || "0x05167616520aD6bd77B724D19681801D9Ba1EDb6";
    
    // Get contract instance
    const WattWitnessConsumer = await ethers.getContractFactory("WattWitnessConsumer");
    const consumer = WattWitnessConsumer.attach(CONTRACT_ADDRESS);
    
    // Get subscription ID
    const subscriptionId = await consumer.subscriptionId();
    console.log("📋 Subscription ID:", subscriptionId.toString());
    
    // Router address for Avalanche Fuji
    const routerAddress = "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0";
    
    // Router ABI for adding consumers
    const routerABI = [
        "function addConsumer(uint64 subscriptionId, address consumer) external",
        "function removeConsumer(uint64 subscriptionId, address consumer) external",
        "function getSubscription(uint64 subscriptionId) external view returns (address owner, uint96 balance, uint96 blockedBalance, uint64 proposedBalance, address[] memory consumers, uint8 flags, uint64 consumerCount, uint64 reqCount, uint64 flagsChangedAt, uint64 lastReqTime)",
        "function getConsumer(uint64 subscriptionId, address consumer) external view returns (address consumer, uint64 initiatedRequests, uint64 completedRequests, uint64 flags, uint64 flagsChangedAt)"
    ];
    
    const router = new ethers.Contract(routerAddress, routerABI, deployer);
    
    try {
        // Check if contract is already a consumer
        console.log("\n🔍 Checking if contract is already a consumer...");
        const consumerInfo = await router.getConsumer(subscriptionId, CONTRACT_ADDRESS);
        
        if (consumerInfo.consumer !== ethers.constants.AddressZero) {
            console.log("✅ Contract is already a consumer!");
            console.log("   Initiated Requests:", consumerInfo.initiatedRequests.toString());
            console.log("   Completed Requests:", consumerInfo.completedRequests.toString());
            return;
        }
        
        console.log("❌ Contract is NOT a consumer. Adding it now...");
        
        // Add consumer
        const tx = await router.addConsumer(subscriptionId, CONTRACT_ADDRESS);
        console.log("📤 Transaction sent:", tx.hash);
        
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
        
        // Verify it was added
        console.log("\n🔍 Verifying consumer was added...");
        const newConsumerInfo = await router.getConsumer(subscriptionId, CONTRACT_ADDRESS);
        
        if (newConsumerInfo.consumer !== ethers.constants.AddressZero) {
            console.log("✅ Success! Contract is now a consumer.");
            console.log("   Initiated Requests:", newConsumerInfo.initiatedRequests.toString());
            console.log("   Completed Requests:", newConsumerInfo.completedRequests.toString());
        } else {
            console.log("❌ Failed to add consumer.");
        }
        
    } catch (error) {
        console.error("❌ Error:", error.message);
        
        if (error.message.includes("OnlyCallableFromRouter")) {
            console.log("\n💡 This error means the router contract is not the correct one for this network.");
            console.log("   Please check the router address for Avalanche Fuji testnet.");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    }); 