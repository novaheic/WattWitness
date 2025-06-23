const { ethers } = require("hardhat");

async function main() {
    console.log("💰 Funding subscription 15639 and adding consumer...");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Account:", deployer.address);
    
    // New contract address
    const CONTRACT_ADDRESS = "0x7611b06a6C00BD46BD5C82a7426EFc70548eCe71";
    
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
    
    const subscriptionId = 15639;
    
    try {
        console.log("\n🔍 Checking subscription status...");
        const subscription = await router.getSubscription(subscriptionId);
        console.log("✅ Subscription found!");
        console.log("   Owner:", subscription.owner);
        console.log("   Balance:", ethers.utils.formatEther(subscription.balance), "LINK");
        console.log("   Consumer Count:", subscription.consumerCount.toString());
        
        // Fund the subscription if it has low balance
        if (subscription.balance.lt(ethers.utils.parseEther("0.1"))) {
            console.log("\n💰 Funding subscription...");
            const fundAmount = ethers.utils.parseEther("0.5"); // Fund with 0.5 LINK
            
            const fundTx = await router.fundSubscription(subscriptionId, fundAmount);
            console.log("✅ Fund transaction sent:", fundTx.hash);
            
            const fundReceipt = await fundTx.wait();
            console.log("✅ Fund transaction confirmed in block:", fundReceipt.blockNumber);
        } else {
            console.log("✅ Subscription already has sufficient balance");
        }
        
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
            
            console.log("\n🎉 SUCCESS! Your Chainlink Functions setup is now complete!");
            console.log("📋 Subscription ID:", subscriptionId.toString());
            console.log("📋 Contract Address:", CONTRACT_ADDRESS);
            console.log("📝 Update your .env file with the new values:");
            console.log(`   CHAINLINK_SUBSCRIPTION_ID=${subscriptionId.toString()}`);
            console.log(`   CONSUMER_CONTRACT_ADDRESS=${CONTRACT_ADDRESS}`);
            
        } else {
            console.log("❌ Failed to add consumer.");
        }
        
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

async function testRequest() {
    const CONTRACT_ADDRESS = "0x3C140c302226a0A91a14A5836fCB6b440EF66A31";
    
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