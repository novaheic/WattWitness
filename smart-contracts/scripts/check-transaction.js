const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Checking subscription creation transaction...");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Account:", deployer.address);
    
    // Transaction hash from the subscription creation
    const txHash = "0xf985331641bbedf2dd74dc778a80451c637c945e429f437e31375b70d05e2fc7";
    
    try {
        console.log("\n🔍 Getting transaction receipt...");
        const receipt = await ethers.provider.getTransactionReceipt(txHash);
        console.log("✅ Transaction found!");
        console.log("   Block Number:", receipt.blockNumber);
        console.log("   Status:", receipt.status === 1 ? "Success" : "Failed");
        console.log("   Gas Used:", receipt.gasUsed.toString());
        
        if (receipt.status === 0) {
            console.log("❌ Transaction failed!");
            return;
        }
        
        console.log("\n📋 Transaction Logs:");
        for (let i = 0; i < receipt.logs.length; i++) {
            const log = receipt.logs[i];
            console.log(`   Log ${i}:`, log);
            
            // Try to decode as a subscription creation event
            try {
                // Router address for Avalanche Fuji
                const routerAddress = "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0";
                
                if (log.address.toLowerCase() === routerAddress.toLowerCase()) {
                    console.log(`   ✅ This is a router event!`);
                    
                    // Try to decode the event
                    const routerABI = [
                        "event SubscriptionCreated(uint64 indexed subscriptionId, address indexed owner)"
                    ];
                    
                    const router = new ethers.Contract(routerAddress, routerABI, deployer);
                    const parsedLog = router.interface.parseLog(log);
                    
                    if (parsedLog.name === "SubscriptionCreated") {
                        console.log(`   🎉 Found subscription creation event!`);
                        console.log(`   📋 Subscription ID: ${parsedLog.args.subscriptionId.toString()}`);
                        console.log(`   👤 Owner: ${parsedLog.args.owner}`);
                        
                        // Test this subscription ID
                        await testSubscription(parsedLog.args.subscriptionId.toString());
                        return;
                    }
                }
            } catch (e) {
                // Not a subscription creation event
            }
        }
        
        console.log("\n❌ Could not find subscription creation event in logs");
        console.log("   Let's try to find the subscription by checking recent IDs...");
        
        await findSubscriptionByChecking();
        
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

async function testSubscription(subscriptionId) {
    console.log(`\n🧪 Testing subscription ${subscriptionId}...`);
    
    const routerAddress = "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0";
    const routerABI = [
        "function getSubscription(uint64 subscriptionId) external view returns (address owner, uint96 balance, uint96 blockedBalance, uint96 proposedBalance, address[] memory consumers, uint8 flags, uint64 consumerCount, uint64 reqCount, uint64 flagsChangedAt, uint64 lastReqTime)"
    ];
    
    const [deployer] = await ethers.getSigners();
    const router = new ethers.Contract(routerAddress, routerABI, deployer);
    
    try {
        const subscription = await router.getSubscription(subscriptionId);
        console.log("✅ Subscription found!");
        console.log("   Owner:", subscription.owner);
        console.log("   Balance:", ethers.utils.formatEther(subscription.balance), "LINK");
        console.log("   Consumer Count:", subscription.consumerCount.toString());
        
        console.log(`\n🎉 SUCCESS! Use subscription ID: ${subscriptionId}`);
        
    } catch (e) {
        console.log("❌ Subscription not found:", e.message);
    }
}

async function findSubscriptionByChecking() {
    console.log("\n🔍 Checking recent subscription IDs...");
    
    const routerAddress = "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0";
    const routerABI = [
        "function getSubscription(uint64 subscriptionId) external view returns (address owner, uint96 balance, uint96 blockedBalance, uint96 proposedBalance, address[] memory consumers, uint8 flags, uint64 consumerCount, uint64 reqCount, uint64 flagsChangedAt, uint64 lastReqTime)"
    ];
    
    const [deployer] = await ethers.getSigners();
    const router = new ethers.Contract(routerAddress, routerABI, deployer);
    
    // Check a range of subscription IDs
    for (let i = 15635; i <= 15645; i++) {
        try {
            const subscription = await router.getSubscription(i);
            if (subscription.owner === deployer.address) {
                console.log(`✅ Found your subscription: ${i}`);
                console.log("   Owner:", subscription.owner);
                console.log("   Balance:", ethers.utils.formatEther(subscription.balance), "LINK");
                console.log("   Consumer Count:", subscription.consumerCount.toString());
                
                console.log(`\n🎉 SUCCESS! Use subscription ID: ${i}`);
                return;
            }
        } catch (e) {
            // Subscription not found
        }
    }
    
    console.log("❌ Could not find your subscription in the expected range");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    }); 