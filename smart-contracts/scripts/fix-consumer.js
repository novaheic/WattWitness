const { ethers } = require("hardhat");

async function main() {
    console.log("🔧 Fixing Chainlink Functions consumer registration...");
    
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
        "function getConsumer(uint64 subscriptionId, address consumer) external view returns (address consumer, uint64 initiatedRequests, uint64 completedRequests, uint64 flags, uint64 flagsChangedAt)",
        "function owner() external view returns (address)"
    ];
    
    const router = new ethers.Contract(routerAddress, routerABI, deployer);
    
    try {
        console.log("\n🔍 Checking router access...");
        const routerOwner = await router.owner();
        console.log("✅ Router accessible, owner:", routerOwner);
        
        console.log("\n🔍 Checking subscription status...");
        try {
            const subscription = await router.getSubscription(subscriptionId);
            console.log("✅ Subscription found on blockchain!");
            console.log("   Owner:", subscription.owner);
            console.log("   Balance:", ethers.utils.formatEther(subscription.balance), "LINK");
            console.log("   Consumer Count:", subscription.consumerCount.toString());
            
            // Check if our contract is already a consumer
            try {
                const consumerInfo = await router.getConsumer(subscriptionId, CONTRACT_ADDRESS);
                if (consumerInfo.consumer !== ethers.constants.AddressZero) {
                    console.log("✅ Contract is already a consumer!");
                    console.log("   Initiated Requests:", consumerInfo.initiatedRequests.toString());
                    console.log("   Completed Requests:", consumerInfo.completedRequests.toString());
                    
                    // Test a request now
                    console.log("\n🧪 Testing Chainlink Functions request...");
                    await testRequest(consumer);
                    return;
                }
            } catch (e) {
                console.log("   ❌ Contract is NOT a consumer");
            }
            
        } catch (e) {
            console.log("❌ Subscription not found on blockchain router");
            console.log("   This means the subscription exists on the dashboard but not on-chain");
            console.log("   You need to create the subscription on-chain first");
            return;
        }
        
        console.log("\n📤 Adding contract as consumer...");
        
        // Add consumer
        const tx = await router.addConsumer(subscriptionId, CONTRACT_ADDRESS);
        console.log("✅ Transaction sent:", tx.hash);
        
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
        
        // Verify it was added
        console.log("\n🔍 Verifying consumer was added...");
        const newConsumerInfo = await router.getConsumer(subscriptionId, CONTRACT_ADDRESS);
        
        if (newConsumerInfo.consumer !== ethers.constants.AddressZero) {
            console.log("✅ Success! Contract is now a consumer.");
            console.log("   Initiated Requests:", newConsumerInfo.initiatedRequests.toString());
            console.log("   Completed Requests:", newConsumerInfo.completedRequests.toString());
            
            // Test a request now
            console.log("\n🧪 Testing Chainlink Functions request...");
            await testRequest(consumer);
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

async function testRequest(consumer) {
    const testSource = `
        return Functions.encodeString("Hello from WattWitness!");
    `;
    
    const testArgs = [];
    
    try {
        console.log("📤 Sending test request...");
        
        const tx = await consumer.validateEnergyData(testSource, testArgs);
        console.log("✅ Transaction sent:", tx.hash);
        
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
        
        if (receipt.status === 1) {
            console.log("🎉 SUCCESS! Request was processed successfully!");
            console.log("   Check the Chainlink Functions dashboard for the request status.");
        } else {
            console.log("❌ Transaction failed (status: 0)");
        }
        
        // Get the request ID
        const requestId = await consumer.lastRequestId();
        console.log("📋 Request ID:", requestId);
        
    } catch (error) {
        console.error("❌ Test request failed:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    }); 