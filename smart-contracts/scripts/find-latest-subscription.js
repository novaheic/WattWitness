const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Finding the latest subscription ID...");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Account:", deployer.address);
    
    // Router address for Avalanche Fuji
    const routerAddress = "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0";
    
    // Router ABI
    const routerABI = [
        "function getSubscription(uint64 subscriptionId) external view returns (address owner, uint96 balance, uint96 blockedBalance, uint96 proposedBalance, address[] memory consumers, uint8 flags, uint64 consumerCount, uint64 reqCount, uint64 flagsChangedAt, uint64 lastReqTime)",
        "function owner() external view returns (address)"
    ];
    
    const router = new ethers.Contract(routerAddress, routerABI, deployer);
    
    try {
        console.log("\n🔍 Checking router access...");
        const routerOwner = await router.owner();
        console.log("✅ Router accessible, owner:", routerOwner);
        
        console.log("\n🔍 Finding the latest subscription...");
        
        // Try subscription IDs around the expected range
        // Since we just created one, it should be higher than 15635
        const testIds = [15635, 15636, 15637, 15638, 15639, 15640];
        
        for (const testId of testIds) {
            try {
                console.log(`   Testing subscription ID: ${testId}`);
                const subscription = await router.getSubscription(testId);
                
                if (subscription.owner === deployer.address) {
                    console.log(`✅ Found your subscription: ${testId}`);
                    console.log("   Owner:", subscription.owner);
                    console.log("   Balance:", ethers.utils.formatEther(subscription.balance), "LINK");
                    console.log("   Consumer Count:", subscription.consumerCount.toString());
                    
                    // Deploy new contract with this subscription ID
                    await deployContractWithSubscription(testId, deployer);
                    return;
                } else {
                    console.log(`   Subscription ${testId} exists but owned by: ${subscription.owner}`);
                }
            } catch (e) {
                console.log(`   Subscription ${testId} not found`);
            }
        }
        
        console.log("\n❌ Could not find your subscription. Let's create a new one...");
        await createNewSubscription(deployer);
        
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

async function deployContractWithSubscription(subscriptionId, deployer) {
    console.log(`\n📤 Deploying new contract with subscription ID: ${subscriptionId}`);
    
    const routerAddress = "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0";
    const donId = "0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000";
    
    const WattWitnessConsumer = await ethers.getContractFactory("WattWitnessConsumer");
    
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
    const routerABI = ["function addConsumer(uint64 subscriptionId, address consumer) external"];
    const router = new ethers.Contract(routerAddress, routerABI, deployer);
    
    const addConsumerTx = await router.addConsumer(subscriptionId, consumer.address);
    console.log("✅ Add consumer transaction sent:", addConsumerTx.hash);
    
    const addConsumerReceipt = await addConsumerTx.wait();
    console.log("✅ Add consumer transaction confirmed in block:", addConsumerReceipt.blockNumber);
    
    // Test the request
    console.log("\n🧪 Testing Chainlink Functions request...");
    await testRequest(consumer);
    
    console.log("\n🎉 SUCCESS! Your Chainlink Functions setup is now complete!");
    console.log("📋 Subscription ID:", subscriptionId.toString());
    console.log("📋 Contract Address:", consumer.address);
    console.log("📝 Update your .env file with the new values:");
    console.log(`   CHAINLINK_SUBSCRIPTION_ID=${subscriptionId.toString()}`);
    console.log(`   CONSUMER_CONTRACT_ADDRESS=${consumer.address}`);
}

async function createNewSubscription(deployer) {
    console.log("\n📤 Creating new subscription...");
    
    const routerAddress = "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0";
    const routerABI = ["function createSubscription() external returns (uint64 subscriptionId)"];
    const router = new ethers.Contract(routerAddress, routerABI, deployer);
    
    const tx = await router.createSubscription();
    console.log("✅ Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    
    // Try to get the subscription ID from the return value
    const subscriptionId = await router.callStatic.createSubscription();
    console.log("📋 New Subscription ID:", subscriptionId.toString());
    
    await deployContractWithSubscription(subscriptionId, deployer);
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