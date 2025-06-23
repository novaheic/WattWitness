async function main() {
  const blockNumber = await ethers.provider.getBlockNumber();
  console.log("Current block number on Sepolia:", blockNumber);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 