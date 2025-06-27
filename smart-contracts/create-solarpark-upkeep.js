const { ethers } = require("ethers")
require('dotenv').config()

const createSolarparkUpkeep = async () => {
  console.log("🤖 AutomatedSolarpark Upkeep Creation Guide")
  console.log("==========================================")
  
  // Load deployment info
  const deploymentInfo = require('./deployed-automated-solarpark.json')
  const contractAddress = deploymentInfo.contractAddress
  
  console.log(`📍 Contract: ${contractAddress}`)
  console.log(`🌐 Network: Avalanche Fuji`)
  console.log(`🔍 Explorer: https://testnet.snowtrace.io/address/${contractAddress}`)
  
  console.log("\n📋 Upkeep Configuration:")
  console.log("================================")
  
  console.log("🎯 Target contract: " + contractAddress)
  console.log("🔧 Target function: sendRequestCBOR()")
  console.log("⏰ Recommended interval: 5 minutes (300 seconds)")
  console.log("⛽ Recommended gas limit: 1,000,000")
  console.log("💰 Recommended funding: 5+ LINK")
  
  console.log("\n📝 Step-by-step Instructions:")
  console.log("================================")
  console.log("1. Go to: https://automation.chain.link/avalanche-fuji")
  console.log("2. Click 'Register new Upkeep'")
  console.log("3. Select 'Time-based' trigger")
  console.log("4. Enter contract address: " + contractAddress)
  console.log("5. Set function: sendRequestCBOR()")
  console.log("6. Set interval: 300 seconds (5 minutes)")
  console.log("7. Set gas limit: 1,000,000")
  console.log("8. Fund with 5+ LINK")
  console.log("9. Copy the upkeep address after creation")
  
  console.log("\n🔧 After Upkeep Creation:")
  console.log("================================")
  console.log("Run: node setup-automated-solarpark.js set-upkeep [UPKEEP_ADDRESS]")
  console.log("This will configure the contract to accept calls from the upkeep")
  
  console.log("\n📊 Expected Results:")
  console.log("================================")
  console.log("✅ Every 5 minutes: Bitcoin price fetched")
  console.log("✅ Mock solar data generated: 1000-2000W range")
  console.log("✅ PowerReading stored with timestamp")
  console.log("✅ 288 readings per day")
  
  console.log("\n🔍 Monitoring:")
  console.log("================================")
  console.log("Check readings: node setup-automated-solarpark.js check")
  console.log("View on explorer: https://testnet.snowtrace.io/address/" + contractAddress)
  console.log("Functions dashboard: https://functions.chain.link/avalanche-fuji/15652")
  
  return contractAddress
}

createSolarparkUpkeep().catch((e) => {
  console.error("❌ Error:", e.message)
  process.exit(1)
}) 