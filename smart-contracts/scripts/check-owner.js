require('dotenv').config();
const { ethers } = require('ethers');

async function checkOwner() {
    const provider = new ethers.providers.JsonRpcProvider(process.env.FUJI_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    // Consumer contract ABI
    const consumerABI = [
        "function owner() external view returns (address)",
        "function subscriptionId() external view returns (uint64)",
        "function donId() external view returns (bytes32)",
        "function gasLimit() external view returns (uint32)"
    ];
    
    const consumerAddress = process.env.CONSUMER_CONTRACT_ADDRESS;
    const consumerContract = new ethers.Contract(consumerAddress, consumerABI, wallet);
    
    console.log('🔍 Checking contract ownership and configuration...');
    console.log(`👛 Your wallet: ${wallet.address}`);
    console.log(`🔗 Consumer contract: ${consumerAddress}`);
    
    try {
        const owner = await consumerContract.owner();
        console.log(`👑 Contract owner: ${owner}`);
        
        if (owner.toLowerCase() === wallet.address.toLowerCase()) {
            console.log('✅ Your wallet IS the contract owner - you can call validateEnergyData');
        } else {
            console.log('❌ Your wallet is NOT the contract owner - you cannot call validateEnergyData');
            console.log('💡 You need to either:');
            console.log('   1. Transfer ownership to your wallet, or');
            console.log('   2. Remove the onlyOwner modifier from validateEnergyData');
        }
        
        // Check other config
        const subId = await consumerContract.subscriptionId();
        const donId = await consumerContract.donId();
        const gasLimit = await consumerContract.gasLimit();
        
        console.log(`\n📋 Contract Configuration:`);
        console.log(`   Subscription ID: ${subId.toString()}`);
        console.log(`   DON ID: ${donId}`);
        console.log(`   Gas Limit: ${gasLimit.toString()}`);
        
    } catch (error) {
        console.error(`❌ Error checking contract: ${error.message}`);
    }
}

checkOwner().catch(console.error); 