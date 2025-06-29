const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying Corrected AutomatedWattWitness Contract...");
    
    // Configuration
    const FUNCTIONS_ROUTER = "0x84c14d17e9d77140efd998be44a4cebf10729856"; // Avalanche Fuji
    const EVENT_LOGGER = "0x4FA62BAd2A449c5e20AD8C8B5D012bd6a6B86CE2"; // Gas-optimized EventLogger
    
    console.log("📋 Deployment Configuration:");
    console.log(`Functions Router: ${FUNCTIONS_ROUTER}`);
    console.log(`EventLogger: ${EVENT_LOGGER}`);
    
    // Deploy AutomatedWattWitness
    console.log("\n📦 Deploying AutomatedWattWitness...");
    const AutomatedWattWitness = await ethers.getContractFactory("AutomatedWattWitness");
    const automatedWattWitness = await AutomatedWattWitness.deploy(
        FUNCTIONS_ROUTER,
        EVENT_LOGGER
    );
    
    await automatedWattWitness.waitForDeployment();
    const automatedAddress = await automatedWattWitness.getAddress();
    
    console.log(`✅ AutomatedWattWitness deployed to: ${automatedAddress}`);
    
    // Configure the contract
    console.log("\n⚙️  Configuring contract...");
    const subscriptionId = 15652;
    const gasLimit = 300000;
    const donId = "0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000";
    
    // Read source code
    const fs = require('fs');
    const sourceCode = fs.readFileSync('./chainlink-functions/source-wattwit.js', 'utf8');
    
    const configureTx = await automatedWattWitness.configure(
        subscriptionId,
        gasLimit,
        donId,
        sourceCode
    );
    await configureTx.wait();
    
    console.log("✅ Contract configured successfully");
    
    // Verify EventLogger connection
    const eventLoggerAddress = await automatedWattWitness.eventLogger();
    console.log(`🔗 EventLogger connected: ${eventLoggerAddress}`);
    
    console.log("\n🎉 DEPLOYMENT COMPLETE!");
    console.log(`📋 Contract Address: ${automatedAddress}`);
    console.log(`🔗 EventLogger: ${eventLoggerAddress}`);
    console.log("\n📝 Next Steps:");
    console.log(`1. Add contract to Chainlink Functions subscription 15652`);
    console.log(`2. Test with: cast send ${automatedAddress} 'requestWattWitnessData()' --private-key $DEPLOYER_PRIVATE_KEY --rpc-url $AVALANCHE_FUJI_RPC`);
    
    return {
        automatedWattWitness: automatedAddress,
        eventLogger: eventLoggerAddress
    };
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 