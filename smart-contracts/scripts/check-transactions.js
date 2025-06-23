require('dotenv').config();
const { ethers } = require('ethers');

async function checkTransactions() {
    const provider = new ethers.providers.JsonRpcProvider(process.env.FUJI_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log('🔍 Checking recent transactions...');
    console.log(`👛 Wallet address: ${wallet.address}`);
    console.log(`🔗 Consumer contract: ${process.env.CONSUMER_CONTRACT_ADDRESS}`);
    
    // Get current block number
    const currentBlock = await provider.getBlockNumber();
    console.log(`📦 Current block: ${currentBlock}`);
    
    // Check last 10 blocks for transactions
    for (let i = 0; i < 10; i++) {
        const blockNumber = currentBlock - i;
        try {
            const block = await provider.getBlockWithTransactions(blockNumber);
            
            // Look for transactions from our wallet
            const ourTxs = block.transactions.filter(tx => 
                tx.from.toLowerCase() === wallet.address.toLowerCase()
            );
            
            if (ourTxs.length > 0) {
                console.log(`\n📦 Block ${blockNumber}:`);
                ourTxs.forEach(tx => {
                    console.log(`  🔗 TX: ${tx.hash}`);
                    console.log(`  📤 From: ${tx.from}`);
                    console.log(`  📥 To: ${tx.to}`);
                    console.log(`  💰 Value: ${ethers.utils.formatEther(tx.value)} AVAX`);
                    console.log(`  🔗 Explorer: https://testnet.snowtrace.io/tx/${tx.hash}`);
                });
            }
        } catch (error) {
            console.log(`❌ Error checking block ${blockNumber}: ${error.message}`);
        }
    }
}

checkTransactions().catch(console.error); 