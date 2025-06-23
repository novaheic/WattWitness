require('dotenv').config();
const { ethers } = require('ethers');

async function updateSubscription() {
    const provider = new ethers.providers.JsonRpcProvider(process.env.FUJI_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    // Consumer contract ABI (including updateConfig function)
    const consumerABI = [
        "function updateConfig(uint64 _subscriptionId, uint32 _gasLimit, bytes32 _donId) external",
        "function subscriptionId() external view returns (uint64)",
        "function validateEnergyData(string calldata source, string[] calldata args) external returns (bytes32)"
    ];
    
    const consumerAddress = process.env.CONSUMER_CONTRACT_ADDRESS;
    const consumerContract = new ethers.Contract(consumerAddress, consumerABI, wallet);
    
    console.log('🔗 Updating Chainlink Functions subscription...');
    console.log(`👛 Wallet: ${wallet.address}`);
    console.log(`🔗 Consumer: ${consumerAddress}`);
    
    // Get current subscription ID
    try {
        const currentSubId = await consumerContract.subscriptionId();
        console.log(`📋 Current subscription ID: ${currentSubId.toString()}`);
    } catch (error) {
        console.log('❌ Could not get current subscription ID');
    }
    
    // You need to replace this with your actual subscription ID from functions.chain.link
    const subscriptionId = process.env.CHAINLINK_SUBSCRIPTION_ID || "15635";
    const gasLimit = 300000; // Default gas limit
    const donId = process.env.CHAINLINK_DON_ID || "0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000";
    
    console.log(`📋 Setting subscription ID to: ${subscriptionId}`);
    console.log(`⛽ Gas limit: ${gasLimit}`);
    console.log(`🔗 DON ID: ${donId}`);
    
    try {
        const tx = await consumerContract.updateConfig(subscriptionId, gasLimit, donId);
        console.log(`✅ Transaction submitted: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
        console.log(`🔗 View on explorer: https://testnet.snowtrace.io/tx/${tx.hash}`);
        
        // Verify the update
        const newSubId = await consumerContract.subscriptionId();
        console.log(`✅ Subscription ID updated to: ${newSubId.toString()}`);
        
    } catch (error) {
        console.error(`❌ Failed to update subscription: ${error.message}`);
    }
}

updateSubscription().catch(console.error); 