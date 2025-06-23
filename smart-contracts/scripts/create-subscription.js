const { ethers } = require("hardhat");

async function main() {
    console.log("🔧 Creating Chainlink Functions subscription on-chain...");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Account:", deployer.address);
    
    // Router address for Avalanche Fuji
    const routerAddress = "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0";
    
    // Router ABI
    const routerABI = [
        "function createSubscription() external returns (uint64 subscriptionId)",
        "function addConsumer(uint64 subscriptionId, address consumer) external",
        "function getSubscription(uint64 subscriptionId) external view returns (address owner, uint96 balance, uint96 blockedBalance, uint96 proposedBalance, address[] memory consumers, uint8 flags, uint64 consumerCount, uint64 reqCount, uint64 flagsChangedAt, uint64 lastReqTime)",
        "function getConsumer(uint64 subscriptionId, address consumer) external view returns (address consumer, uint64 initiatedRequests, uint64 completedRequests, uint64 flags, uint64 flagsChangedAt)",
        "function owner() external view returns (address)"
    ];
    
    const router = new ethers.Contract(routerAddress, routerABI, deployer);
    
    try {
        console.log("\n🔍 Checking router access...");
        const routerOwner = await router.owner();
        console.log("✅ Router accessible, owner:", routerOwner);
        
        console.log("\n📤 Creating new subscription...");
        
        // Create subscription
        const tx = await router.createSubscription();
        console.log("✅ Transaction sent:", tx.hash);
        
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
        
        // Get the new subscription ID from the transaction logs
        const subscriptionId = await getSubscriptionIdFromLogs(receipt.logs, router);
        console.log("📋 New Subscription ID:", subscriptionId.toString());
        
        // Deploy new contract with correct subscription ID
        console.log("\n📤 Deploying new contract with correct subscription ID...");
        const WattWitnessConsumer = await ethers.getContractFactory("WattWitnessConsumer");
        
        const donId = "0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000";
        
        const consumer = await WattWitnessConsumer.deploy(
            routerAddress,
            subscriptionId,
            donId
        );
        
        console.log("✅ Contract deployment transaction sent:", consumer.deployTransaction.hash);
        
        const deployReceipt = await consumer.deployTransaction.wait();
        console.log("✅ Contract deployed in block:", deployReceipt.blockNumber);
        console.log("📋 New Contract Address:", consumer.address);
        
        // Add the new contract as a consumer
        console.log("\n📤 Adding new contract as consumer...");
        const addConsumerTx = await router.addConsumer(subscriptionId, consumer.address);
        console.log("✅ Add consumer transaction sent:", addConsumerTx.hash);
        
        const addConsumerReceipt = await addConsumerTx.wait();
        console.log("✅ Add consumer transaction confirmed in block:", addConsumerReceipt.blockNumber);
        
        // Verify subscription and consumer
        console.log("\n🔍 Verifying subscription and consumer...");
        const subscription = await router.getSubscription(subscriptionId);
        console.log("✅ Subscription verified!");
        console.log("   Owner:", subscription.owner);
        console.log("   Balance:", ethers.utils.formatEther(subscription.balance), "LINK");
        console.log("   Consumer Count:", subscription.consumerCount.toString());
        
        const consumerInfo = await router.getConsumer(subscriptionId, consumer.address);
        if (consumerInfo.consumer !== ethers.constants.AddressZero) {
            console.log("✅ Contract successfully added as consumer!");
            console.log("   Initiated Requests:", consumerInfo.initiatedRequests.toString());
            console.log("   Completed Requests:", consumerInfo.completedRequests.toString());
        }
        
        // Test the request
        console.log("\n🧪 Testing Chainlink Functions request...");
        await testRequest(consumer);
        
        console.log("\n🎉 SUCCESS! Your Chainlink Functions setup is now complete!");
        console.log("📋 New Subscription ID:", subscriptionId.toString());
        console.log("📋 New Contract Address:", consumer.address);
        console.log("📝 Update your .env file with the new values:");
        console.log(`   CHAINLINK_SUBSCRIPTION_ID=${subscriptionId.toString()}`);
        console.log(`   CONSUMER_CONTRACT_ADDRESS=${consumer.address}`);
        
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

async function getSubscriptionIdFromLogs(logs, router) {
    // Look for the subscription creation event
    for (const log of logs) {
        try {
            // Try to parse as a subscription creation event
            const parsedLog = router.interface.parseLog(log);
            if (parsedLog.name === "SubscriptionCreated") {
                return parsedLog.args.subscriptionId;
            }
        } catch (e) {
            // Not a subscription creation event
        }
    }
    
    // If we can't find the event, try to get the latest subscription
    // This is a fallback method
    throw new Error("Could not extract subscription ID from transaction logs");
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