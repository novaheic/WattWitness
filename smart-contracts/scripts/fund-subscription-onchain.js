const { ethers } = require("hardhat");

async function main() {
    console.log("💰 Funding subscription 15635 on-chain...");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Account:", deployer.address);
    
    // Contract address
    const CONTRACT_ADDRESS = process.env.CONSUMER_CONTRACT_ADDRESS || "0x05167616520aD6bd77B724D19681801D9Ba1EDb6";
    
    // Router address for Avalanche Fuji
    const routerAddress = "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0";
    
    // Router ABI
    const routerABI = [
        "function fundSubscription(uint64 subscriptionId, uint96 amount) external",
        "function addConsumer(uint64 subscriptionId, address consumer) external",
        "function getSubscription(uint64 subscriptionId) external view returns (address owner, uint96 balance, uint96 blockedBalance, uint64 proposedBalance, address[] memory consumers, uint8 flags, uint64 consumerCount, uint64 reqCount, uint64 flagsChangedAt, uint64 lastReqTime)",
        "function getConsumer(uint64 subscriptionId, address consumer) external view returns (address consumer, uint64 initiatedRequests, uint64 completedRequests, uint64 flags, uint64 flagsChangedAt)",
        "function owner() external view returns (address)"
    ];
    
    const router = new ethers.Contract(routerAddress, routerABI, deployer);
    
    const subscriptionId = 15635;
    
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
                    await testRequest();
                    return;
                }
            } catch (e) {
                console.log("   ❌ Contract is NOT a consumer");
            }
            
        } catch (e) {
            console.log("❌ Subscription not found on blockchain router");
            console.log("   This means the subscription exists on the dashboard but not on-chain");
            console.log("   We'll try to fund it to create it on-chain...");
        }
        
        // Try to fund the subscription (this might create it if it doesn't exist)
        console.log("\n💰 Funding subscription on-chain...");
        const fundAmount = ethers.utils.parseEther("0.1"); // Fund with 0.1 LINK
        
        const fundTx = await router.fundSubscription(subscriptionId, fundAmount);
        console.log("✅ Fund transaction sent:", fundTx.hash);
        
        const fundReceipt = await fundTx.wait();
        console.log("✅ Fund transaction confirmed in block:", fundReceipt.blockNumber);
        
        // Check if subscription now exists
        console.log("\n🔍 Checking if subscription now exists...");
        try {
            const subscription = await router.getSubscription(subscriptionId);
            console.log("✅ Subscription now exists on blockchain!");
            console.log("   Owner:", subscription.owner);
            console.log("   Balance:", ethers.utils.formatEther(subscription.balance), "LINK");
            console.log("   Consumer Count:", subscription.consumerCount.toString());
            
            // Add our contract as a consumer
            console.log("\n📤 Adding contract as consumer...");
            const addConsumerTx = await router.addConsumer(subscriptionId, CONTRACT_ADDRESS);
            console.log("✅ Add consumer transaction sent:", addConsumerTx.hash);
            
            const addConsumerReceipt = await addConsumerTx.wait();
            console.log("✅ Add consumer transaction confirmed in block:", addConsumerReceipt.blockNumber);
            
            // Verify consumer was added
            console.log("\n🔍 Verifying consumer was added...");
            const consumerInfo = await router.getConsumer(subscriptionId, CONTRACT_ADDRESS);
            if (consumerInfo.consumer !== ethers.constants.AddressZero) {
                console.log("✅ Contract successfully added as consumer!");
                console.log("   Initiated Requests:", consumerInfo.initiatedRequests.toString());
                console.log("   Completed Requests:", consumerInfo.completedRequests.toString());
                
                // Test the request
                console.log("\n🧪 Testing Chainlink Functions request...");
                await testRequest();
            } else {
                console.log("❌ Failed to add consumer.");
            }
            
        } catch (e) {
            console.log("❌ Subscription still doesn't exist on blockchain after funding");
            console.log("   This means the subscription ID 15635 is only on the dashboard");
            console.log("   You need to create a new subscription on-chain");
        }
        
    } catch (error) {
        console.error("❌ Error:", error.message);
        
        if (error.message.includes("SubscriptionNotFound")) {
            console.log("\n💡 The subscription doesn't exist on-chain.");
            console.log("   You need to create a new subscription through the dashboard or on-chain.");
        }
    }
}

async function testRequest() {
    const CONTRACT_ADDRESS = process.env.CONSUMER_CONTRACT_ADDRESS || "0x05167616520aD6bd77B724D19681801D9Ba1EDb6";
    
    const WattWitnessConsumer = await ethers.getContractFactory("WattWitnessConsumer");
    const consumer = WattWitnessConsumer.attach(CONTRACT_ADDRESS);
    
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