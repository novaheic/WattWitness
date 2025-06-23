const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Checking Chainlink Functions subscription...");
    
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
    
    // Router addresses for different networks
    const routers = {
        "Avalanche Fuji": "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0",
        "Avalanche Mainnet": "0x7dcC867D8dC9386B2e3a3cF9e3C497f5F8Cd1e3D",
        "Ethereum Sepolia": "0xD0daae2231E9CB96b94C8512223533293C3693Bf",
        "Polygon Mumbai": "0x6E2dc0F9DB014aE19888F539E59285D2Ea04244C"
    };
    
    // Router ABI
    const routerABI = [
        "function getSubscription(uint64 subscriptionId) external view returns (address owner, uint96 balance, uint96 blockedBalance, uint96 proposedBalance, address[] memory consumers, uint8 flags, uint64 consumerCount, uint64 reqCount, uint64 flagsChangedAt, uint64 lastReqTime)",
        "function getConsumer(uint64 subscriptionId, address consumer) external view returns (address consumer, uint64 initiatedRequests, uint64 completedRequests, uint64 flags, uint64 flagsChangedAt)",
        "function createSubscription() external returns (uint64 subscriptionId)",
        "function addConsumer(uint64 subscriptionId, address consumer) external",
        "function owner() external view returns (address)"
    ];
    
    console.log("\n🔧 Testing different router addresses...");
    
    for (const [network, routerAddress] of Object.entries(routers)) {
        console.log(`\n📡 Testing ${network} router: ${routerAddress}`);
        
        try {
            const router = new ethers.Contract(routerAddress, routerABI, deployer);
            
            // Check if router exists
            const owner = await router.owner();
            console.log("   ✅ Router exists, owner:", owner);
            
            // Try to get subscription
            try {
                const subscription = await router.getSubscription(subscriptionId);
                console.log("   ✅ Subscription found!");
                console.log("      Owner:", subscription.owner);
                console.log("      Balance:", ethers.utils.formatEther(subscription.balance), "LINK");
                console.log("      Consumer Count:", subscription.consumerCount.toString());
                console.log("      Request Count:", subscription.reqCount.toString());
                
                // Check if our contract is a consumer
                try {
                    const consumerInfo = await router.getConsumer(subscriptionId, CONTRACT_ADDRESS);
                    if (consumerInfo.consumer !== ethers.constants.AddressZero) {
                        console.log("      ✅ Our contract is a consumer!");
                        console.log("         Initiated Requests:", consumerInfo.initiatedRequests.toString());
                        console.log("         Completed Requests:", consumerInfo.completedRequests.toString());
                    } else {
                        console.log("      ❌ Our contract is NOT a consumer");
                    }
                } catch (e) {
                    console.log("      ❌ Could not check consumer status:", e.message);
                }
                
                // This is the correct router
                console.log(`\n🎯 Found correct router for ${network}!`);
                console.log(`   Router Address: ${routerAddress}`);
                console.log(`   Subscription ID: ${subscriptionId}`);
                
                return;
                
            } catch (e) {
                console.log("   ❌ Subscription not found on this router");
            }
            
        } catch (e) {
            console.log("   ❌ Router not accessible:", e.message);
        }
    }
    
    console.log("\n❌ No working router found. You may need to:");
    console.log("1. Create a new subscription on the Chainlink Functions dashboard");
    console.log("2. Fund the subscription with LINK tokens");
    console.log("3. Update the subscription ID in your .env file");
    console.log("4. Add your contract as a consumer");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    }); 