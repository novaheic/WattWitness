#!/usr/bin/env node
/* verify-reading-sha256.js ---------------------------------------------
   Verification tool using the new SHA-256 compatible verifyReadingSha256
   function. This script matches the Chainlink Functions encoding exactly.
---------------------------------------------------------------------------*/

const { ethers } = require("ethers");
const crypto = require("crypto");
const dotenv = require("dotenv");
const minimist = require("minimist");

dotenv.config();

const args = minimist(process.argv.slice(2), {
  string: ["logger", "readingId", "rpc", "fromBlock", "toBlock"],
});

if (!args.logger || !args.readingId) {
  console.error("\nUsage: node script/verify-reading-sha256.js --logger <address> --readingId <id> [--rpc <url>]\n");
  process.exit(1);
}

const RPC_URL =
  args.rpc ||
  process.env.AVALANCHE_FUJI_RPC ||
  "https://avalanche-fuji-c-chain.publicnode.com";

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const loggerAddr = ethers.utils.getAddress(args.logger);
const readingId = ethers.BigNumber.from(args.readingId).toNumber();

// Minimal ABI (events + both verification functions)
const ABI = [
  "event BatchProcessed(bytes32 indexed requestId, bytes32 indexed merkleRoot, uint32 indexed firstReadingId, uint16 readingCount, uint256 gasUsed)",
  "event PowerReading(uint32 indexed readingId, uint32 indexed timestamp, uint32 powerW, uint32 totalWh)",
  "function verifyReading(uint32,uint32,uint32,uint32,bytes32,bytes32[]) view returns (bool)",
  "function verifyReadingSha256(uint32,uint32,uint32,uint32,bytes32,bytes32[]) view returns (bool)",
];
const iface = new ethers.utils.Interface(ABI);

(async () => {
  console.log(`🔗 Using RPC: ${RPC_URL}`);

  // 1️⃣ Locate batch containing readingId
  const batchTopic = iface.getEventTopic("BatchProcessed");
  const readingTopic = ethers.utils.hexZeroPad(ethers.utils.hexlify(readingId), 32);

  const filter = {
    address: loggerAddr,
    topics: [batchTopic, null, null, readingTopic],
    fromBlock: args.fromBlock ? parseInt(args.fromBlock) : 0,
    toBlock: args.toBlock ? parseInt(args.toBlock) : "latest",
  };

  let batchLogs;
  try {
    batchLogs = await provider.getLogs(filter);
  } catch (e) {
    if (e.body && e.body.includes("up to a 500 block range")) {
      console.log("ℹ️  RPC limits log range --> scanning in 500-block chunks…");
      batchLogs = [];
      const latest = args.toBlock ? parseInt(args.toBlock) : await provider.getBlockNumber();
      const startBlock = args.fromBlock ? parseInt(args.fromBlock) : 0;
      for (let from = latest; from >= startBlock && batchLogs.length === 0; from -= 500) {
        const to = from;
        const fromBlk = Math.max(startBlock, to - 499);
        try {
          const partial = await provider.getLogs({ ...filter, fromBlock: fromBlk, toBlock: to });
          if (partial.length) batchLogs = partial;
        } catch (_) {
          /* ignore window errors */
        }
      }
    } else {
      throw e;
    }
  }

  if (batchLogs.length === 0) {
    console.error("❌ No BatchProcessed event found covering reading", readingId);
    process.exit(1);
  }
  
  const batchLog = batchLogs[batchLogs.length - 1]; // latest one
  const { merkleRoot, firstReadingId, readingCount } = iface.decodeEventLog(
    "BatchProcessed",
    batchLog.data,
    batchLog.topics
  );
  console.log(`Batch found ➜ firstReadingId=${firstReadingId} count=${readingCount}`);
  console.log(`On-chain merkle root: ${merkleRoot}`);

  // 2️⃣ Pull all PowerReading events from same tx receipt
  const receipt = await provider.getTransactionReceipt(batchLog.transactionHash);
  const powerTopic = iface.getEventTopic("PowerReading");
  const readingEvents = receipt.logs
    .filter((l) => l.address.toLowerCase() === loggerAddr.toLowerCase() && l.topics[0] === powerTopic)
    .map((l) => iface.decodeEventLog("PowerReading", l.data, l.topics));

  if (readingEvents.length === 0) {
    console.error("❌ No PowerReading events found in tx – cannot build tree");
    process.exit(1);
  }

  // Sort readings by ID (preserve original order, no leaf sorting)
  readingEvents.sort((a, b) => (a.readingId < b.readingId ? -1 : 1));

  // Helper hash pair using SHA-256 (to match Chainlink Functions)
  const hashPair = (a, b) => {
    const combined = Buffer.concat([
      Buffer.from(a.slice(2), 'hex'),
      Buffer.from(b.slice(2), 'hex')
    ]);
    const hash = crypto.createHash('sha256').update(combined).digest();
    return '0x' + hash.toString('hex');
  };

  // Build leaves using SHA-256 (to match Chainlink Functions)
  const leaves = readingEvents.map((r) => {
    const leafStr = JSON.stringify([r.readingId, r.powerW, r.totalWh, r.timestamp]);
    const hash = crypto.createHash('sha256').update(leafStr).digest();
    return '0x' + hash.toString('hex');
  });

  console.log(`\n📜 Generated ${leaves.length} leaves using SHA-256 JSON encoding`);

  // Build layers (no leaf sorting - preserve order from readings)
  const layers = [leaves];
  while (layers[layers.length - 1].length > 1) {
    const prev = layers[layers.length - 1];
    const next = [];
    for (let i = 0; i < prev.length; i += 2) {
      const left = prev[i];
      const right = i + 1 < prev.length ? prev[i + 1] : prev[i];
      next.push(hashPair(left, right));
    }
    layers.push(next);
  }
  const recomputedRoot = layers.at(-1)[0];
  
  console.log(`SHA-256 computed root:  ${recomputedRoot}`);
  console.log(`On-chain root:          ${merkleRoot}`);
  
  if (recomputedRoot === merkleRoot) {
    console.log("✅ Roots match! SHA-256 verification should work.");
  } else {
    console.log("❌ Roots don't match. There may be a subtle encoding difference.");
  }

  // 3️⃣ Build proof for the reading
  const index = readingEvents.findIndex((e) => e.readingId === readingId);
  if (index === -1) {
    console.error("❌ Reading not found in event list");
    process.exit(1);
  }
  
  const proof = [];
  let idx = index;
  for (let level = 0; level < layers.length - 1; level++) {
    const layer = layers[level];
    const siblingIdx = idx ^ 1;
    const siblingHash = siblingIdx < layer.length ? layer[siblingIdx] : layer[idx];
    proof.push(siblingHash);
    idx = Math.floor(idx / 2);
  }

  console.log(`\n🔍 Proof for reading ${readingId}:`);
  console.log(JSON.stringify(proof, null, 2));

  // 4️⃣ Test both contract verification functions
  const reading = readingEvents[index];
  const contract = new ethers.Contract(loggerAddr, ABI, provider);
  
  console.log(`\n🧪 Testing reading [${reading.readingId}, ${reading.powerW}, ${reading.totalWh}, ${reading.timestamp}]`);

  // Test legacy keccak256 function
  try {
    const validKeccak = await contract.verifyReading(
      reading.readingId,
      reading.powerW,
      reading.totalWh,
      reading.timestamp,
      merkleRoot,
      proof
    );
    console.log(`Legacy verifyReading():     ${validKeccak ? "✅ Valid" : "❌ Invalid"}`);
  } catch (error) {
    console.error("❌ Legacy verifyReading() failed:", error.message);
  }

  // Test new SHA-256 function
  try {
    const validSha256 = await contract.verifyReadingSha256(
      reading.readingId,
      reading.powerW,
      reading.totalWh,
      reading.timestamp,
      merkleRoot,
      proof
    );
    console.log(`New verifyReadingSha256():  ${validSha256 ? "✅ Valid" : "❌ Invalid"}`);
    
    if (validSha256) {
      console.log("\n🎉 SUCCESS! The new SHA-256 verification function works!");
      console.log("✅ Reading verification is now compatible with Chainlink Functions merkle trees");
    } else if (recomputedRoot === merkleRoot) {
      console.log("\n⚠️  Roots match but verification failed. Checking proof generation...");
      // Additional debugging could go here
    }
  } catch (error) {
    console.error("❌ SHA-256 verifyReadingSha256() failed:", error.message);
  }

  console.log("\n📝 Summary:");
  console.log(`   Reading ID: ${reading.readingId}`);
  console.log(`   Batch size: ${readingEvents.length} readings`);
  console.log(`   Proof size: ${proof.length} elements`);
  console.log(`   Root match: ${recomputedRoot === merkleRoot ? "✅" : "❌"}`);
  console.log(`   Method: SHA-256 leaf hashing + SHA-256 tree construction`);
})(); 