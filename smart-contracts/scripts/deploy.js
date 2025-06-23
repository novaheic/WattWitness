const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying WattWitness Smart Contract...");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying with account:", deployer.address);
    
    // Check balance
    const balance = await deployer.getBalance();
    console.log("💰 Account balance:", ethers.utils.formatEther(balance), "AVAX");
    
    // Deploy WattWitness contract
    const WattWitness = await ethers.getContractFactory("WattWitness");
    console.log("⏳ Deploying WattWitness contract...");
    
    const wattWitness = await WattWitness.deploy();
    await wattWitness.deployed();
    
    console.log("✅ WattWitness deployed to:", wattWitness.address);
    console.log("🔗 Transaction hash:", wattWitness.deployTransaction.hash);
    
    // Register the first device (installation ID 1)
    console.log("📝 Registering device with installation ID 1...");
    const registerTx = await wattWitness.registerDevice(1);
    await registerTx.wait();
    console.log("✅ Device registered successfully");
    
    // Verify the device is registered
    const isRegistered = await wattWitness.isDeviceRegistered(1);
    console.log("🔍 Device registration verified:", isRegistered);
    
    // Get network info
    const [networkName, chainId] = await wattWitness.getNetworkInfo();
    console.log("🌐 Network:", networkName, "Chain ID:", chainId.toString());
    
    console.log("\n🎉 Deployment Summary:");
    console.log("========================");
    console.log("Contract Address:", wattWitness.address);
    console.log("Owner Address:", deployer.address);
    console.log("Network:", networkName);
    console.log("Chain ID:", chainId.toString());
    console.log("Device 1 Registered:", isRegistered);
    
    console.log("\n📋 Next Steps:");
    console.log("1. Update your .env file with the new contract address");
    console.log("2. Update your integration service configuration");
    console.log("3. Test energy data submission");
    
    // Save deployment info
    const deploymentInfo = {
        contractAddress: wattWitness.address,
        ownerAddress: deployer.address,
        networkName: networkName,
        chainId: chainId.toString(),
        deploymentBlock: wattWitness.deployTransaction.blockNumber,
        deploymentHash: wattWitness.deployTransaction.hash
    };
    
    console.log("\n💾 Deployment Info (save this):");
    console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });

