const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Diagnosing Chainlink Functions Request...");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Account:", deployer.address);
    
    // Contract address
    const CONTRACT_ADDRESS = process.env.CONSUMER_CONTRACT_ADDRESS || "0x05167616520aD6bd77B724D19681801D9Ba1EDb6";
    
    // Get contract instance
    const WattWitnessConsumer = await ethers.getContractFactory("WattWitnessConsumer");
    const consumer = WattWitnessConsumer.attach(CONTRACT_ADDRESS);
    
    // Check contract configuration
    console.log("\n🔧 Contract Configuration:");
    console.log("   Owner:", await consumer.owner());
    console.log("   Subscription ID:", (await consumer.subscriptionId()).toString());
    console.log("   DON ID:", await consumer.donId());
    console.log("   Gas Limit:", (await consumer.gasLimit()).toString());
    
    // Check subscription balance on Chainlink Functions
    console.log("\n💰 Checking subscription balance...");
    const routerAddress = "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0";
    const subscriptionId = await consumer.subscriptionId();
    
    // Get router contract to check subscription
    const routerABI = [
        "function getSubscription(uint64 subscriptionId) external view returns (address owner, uint96 balance, uint96 blockedBalance, uint96 proposedBalance, address[] memory consumers, uint8 flags, uint64 consumerCount, uint64 reqCount, uint64 flagsChangedAt, uint64 lastReqTime)",
        "function getConsumer(uint64 subscriptionId, address consumer) external view returns (address consumer, uint64 initiatedRequests, uint64 completedRequests, uint64 flags, uint64 flagsChangedAt)"
    ];
    
    const router = new ethers.Contract(routerAddress, routerABI, deployer);
    
    try {
        const subscription = await router.getSubscription(subscriptionId);
        console.log("   Subscription Owner:", subscription.owner);
        console.log("   Balance:", ethers.utils.formatEther(subscription.balance), "LINK");
        console.log("   Blocked Balance:", ethers.utils.formatEther(subscription.blockedBalance), "LINK");
        console.log("   Consumer Count:", subscription.consumerCount.toString());
        console.log("   Request Count:", subscription.reqCount.toString());
        
        // Check if our contract is a consumer
        const consumerInfo = await router.getConsumer(subscriptionId, CONTRACT_ADDRESS);
        console.log("   Our Contract is Consumer:", consumerInfo.consumer !== ethers.constants.AddressZero);
        console.log("   Initiated Requests:", consumerInfo.initiatedRequests.toString());
        console.log("   Completed Requests:", consumerInfo.completedRequests.toString());
        
    } catch (error) {
        console.log("   ❌ Could not check subscription:", error.message);
    }
    
    // Test with minimal request
    console.log("\n🧪 Testing with minimal request...");
    
    const minimalSource = `
        return Functions.encodeString("Hello World");
    `;
    
    const minimalArgs = [];
    
    try {
        console.log("📤 Sending minimal request...");
        
        const tx = await consumer.validateEnergyData(minimalSource, minimalArgs);
        console.log("✅ Transaction sent:", tx.hash);
        
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
        
        // Get the request ID
        const requestId = await consumer.lastRequestId();
        console.log("📋 Request ID:", requestId);
        
        console.log("\n🔍 Transaction Details:");
        console.log("   Gas Used:", receipt.gasUsed.toString());
        console.log("   Gas Price:", ethers.utils.formatUnits(receipt.effectiveGasPrice, "gwei"), "gwei");
        console.log("   Total Cost:", ethers.utils.formatEther(receipt.gasUsed.mul(receipt.effectiveGasPrice)), "AVAX");
        
        // Check if there are any events
        console.log("\n📋 Events in transaction:");
        for (const log of receipt.logs) {
            try {
                const parsedLog = consumer.interface.parseLog(log);
                console.log("   Event:", parsedLog.name, parsedLog.args);
            } catch (e) {
                // Not a contract event
            }
        }
        
        console.log("\n🔍 Potential Issues:");
        console.log("1. Check if subscription has sufficient LINK balance");
        console.log("2. Verify the contract is added as a consumer");
        console.log("3. Check if the DON is active and responding");
        console.log("4. Verify the request format matches Chainlink Functions requirements");
        
    } catch (error) {
        console.error("❌ Request failed:", error.message);
        
        // Check if it's a gas or balance issue
        const balance = await deployer.getBalance();
        console.log("💰 Account balance:", ethers.utils.formatEther(balance), "AVAX");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Diagnosis failed:", error);
        process.exit(1);
    }); 