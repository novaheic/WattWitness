const { ethers } = require("hardhat");

async function main() {
    const routerAddress = "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0";
    const routerABI = [
        "function getSubscription(uint64 subscriptionId) external view returns (address owner, uint96 balance, uint96 blockedBalance, uint96 proposedBalance, address[] memory consumers, uint8 flags, uint64 consumerCount, uint64 reqCount, uint64 flagsChangedAt, uint64 lastReqTime)"
    ];
    const subscriptionId = 15639;

    const [deployer] = await ethers.getSigners();
    const router = new ethers.Contract(routerAddress, routerABI, deployer);

    try {
        console.log(`Checking state for subscription ID: ${subscriptionId}`);
        const sub = await router.getSubscription(subscriptionId);
        console.log("Subscription state:");
        console.log(`  Owner: ${sub.owner}`);
        console.log(`  Balance: ${ethers.utils.formatEther(sub.balance)} LINK`);
        console.log(`  Blocked Balance: ${ethers.utils.formatEther(sub.blockedBalance)} LINK`);
        console.log(`  Consumer Count: ${sub.consumerCount}`);
        console.log(`  Request Count: ${sub.reqCount}`);
        console.log(`  Consumers: ${sub.consumers}`);
        console.log(`  Flags: ${sub.flags}`);
        console.log(`  Flags Changed At: ${sub.flagsChangedAt}`);
        console.log(`  Last Request Time: ${sub.lastReqTime}`);
    } catch (e) {
        console.error("Failed to fetch subscription state:", e.message);
    }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); }); 