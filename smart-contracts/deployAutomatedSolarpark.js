const { ethers } = require("ethers");
const { buildRequestCBOR } = require("@chainlink/functions-toolkit");
const fs = require("fs");
const path = require("path");

// Load environment variables from .env file
require("dotenv").config();

// Configuration - Update these values
const NETWORK_CONFIG = {
    // Avalanche Fuji testnet
    fuji: {
        rpcUrl: process.env.AVALANCHE_FUJI_RPC || "https://api.avax-test.network/ext/bc/C/rpc",
        router: "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0",
        donId: "0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000", // fun-avalanche-fuji-1
        subscriptionId: process.env.CHAINLINK_FUNCTIONS_SUBSCRIPTION_ID || "15652",
        gasLimit: 300000,   // Chainlink Functions maximum callback gas limit
        explorerUrl: "https://testnet.snowtrace.io"
    }
};

// WattWitness API Configuration
const WATTWITNESS_CONFIG = {
    // Update this with your ngrok URL when running
    apiUrl: process.env.WATTWITNESS_API_URL || "https://f434-37-168-28-41.ngrok-free.app",
    endpoint: "/api/v1/readings/pending"
};

async function deployAndConfigureAutomatedSolarpark() {
    try {
        console.log("🤖 Starting WattWitness Automated Solarpark Deployment with Auto-Encoding...\n");

        // Step 1: Read and validate environment
        const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
        if (!privateKey) {
            throw new Error("DEPLOYER_PRIVATE_KEY not found in environment");
        }

        const network = NETWORK_CONFIG.fuji;
        const provider = new ethers.JsonRpcProvider(network.rpcUrl);
        const signer = new ethers.Wallet(privateKey, provider);

        console.log("📋 Automated Deployment Configuration:");
        console.log("=====================================");
        console.log("Network: Avalanche Fuji Testnet");
        console.log("Deployer:", await signer.getAddress());
        console.log("Router:", network.router);
        console.log("DON ID:", network.donId);
        console.log("Subscription ID:", network.subscriptionId);
        console.log("WattWitness API:", WATTWITNESS_CONFIG.apiUrl + WATTWITNESS_CONFIG.endpoint);
        console.log("Automation Support: ENABLED");
        console.log("");

        // Step 2: Build CBOR request automatically
        console.log("🔧 Building CBOR Request for Automation...");
        
        // Read the JavaScript source code (using WattWitness API with compact response)
        const sourcePath = path.join(__dirname, "wattwitness-api-with-mock-response.js");
        if (!fs.existsSync(sourcePath)) {
            throw new Error(`Source file not found: ${sourcePath}`);
        }
        
        const source = fs.readFileSync(sourcePath, "utf8");
        console.log("✓ Source code loaded from mock-solar-data.js");

        // Build the CBOR request
        const args = [WATTWITNESS_CONFIG.apiUrl]; // Pass API URL as argument
        const codeLanguage = 0; // JavaScript
        const codeLocation = 0; // Inline

        const cborRequest = buildRequestCBOR({
            source: source,
            args: args,
            codeLanguage: codeLanguage,
            codeLocation: codeLocation
        });

        console.log("✓ CBOR request encoded successfully for automation");
        console.log("Request length:", cborRequest.length, "characters");
        console.log("");

        // Step 3: Deploy contract using Forge
        console.log("🏗️  Deploying AutomatedSolarpark Contract...");
        
        // Create temporary deployment script with embedded CBOR
        const deploymentScript = generateAutomatedSolidityDeploymentScript(cborRequest, network);
        const tempScriptPath = path.join(__dirname, "script", "DeployAutomatedSolarparkAuto.s.sol");
        
        fs.writeFileSync(tempScriptPath, deploymentScript);
        console.log("✓ Generated automated deployment script with embedded CBOR");

        // Step 4: Execute forge deployment
        const { spawn } = require("child_process");
        
        const forgeArgs = [
            "script",
            "script/DeployAutomatedSolarparkAuto.s.sol:DeployAutomatedSolarparkAuto",
            "--rpc-url", "fuji",
            "--broadcast",
            "--verify"
        ];

        console.log("Executing: forge", forgeArgs.join(" "));
        
        const forgeProcess = spawn("forge", forgeArgs, {
            cwd: __dirname,
            stdio: "inherit",
            env: { ...process.env }
        });

        forgeProcess.on("close", (code) => {
            // Clean up temporary file
            if (fs.existsSync(tempScriptPath)) {
                fs.unlinkSync(tempScriptPath);
            }

            if (code === 0) {
                console.log("\n🎉 Automated Solarpark Deployment Complete!");
                console.log("🔗 View contracts on Snowtrace:", network.explorerUrl);
                console.log("\n📝 Next Steps for Automation:");
                console.log("==============================");
                console.log("1. Add the deployed contract to your Functions subscription");
                console.log("2. Set up Chainlink Automation upkeep with time-based trigger");
                console.log("3. Call setAutomationCronContract() with your upkeep address");
                console.log("4. Test manual execution by calling sendRequestCBOR() as owner");
                console.log("5. Monitor Response events for successful automated data fetching");
                console.log("\n🤖 Automation Benefits:");
                console.log("========================");
                console.log("• Automatic periodic data fetching");
                console.log("• No manual intervention required");
                console.log("• Reliable data collection schedule");
                console.log("• Gas-optimized automated execution");
            } else {
                console.error("❌ Automated deployment failed with exit code:", code);
            }
        });

        forgeProcess.on("error", (error) => {
            console.error("❌ Forge execution error:", error.message);
        });

    } catch (error) {
        console.error("❌ Automated Deployment Error:", error.message);
        process.exit(1);
    }
}

function generateAutomatedSolidityDeploymentScript(cborRequest, networkConfig) {
    const hexData = cborRequest.slice(2); // Remove 0x prefix
    
    return `// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {Script, console2} from "forge-std/Script.sol";
import {AutomatedSolarpark} from "../src/AutomatedSolarpark.sol";

/**
 * @title DeployAutomatedSolarparkAuto
 * @notice Auto-generated deployment script with embedded CBOR request for Chainlink Automation
 * @dev Generated by deployAutomatedSolarpark.js with WattWitness API configuration and automation support
 */
contract DeployAutomatedSolarparkAuto is Script {
    // Network configurations
    struct NetworkConfig {
        address router;
        bytes32 donId;
        uint64 subscriptionId;
        uint32 gasLimit;
    }

    // Auto-generated CBOR request with WattWitness API configuration for automation
    bytes constant WATTWITNESS_AUTOMATED_FETCH_REQUEST = hex"${hexData}";

    function getNetworkConfig() internal pure returns (NetworkConfig memory) {
        return NetworkConfig({
            router: ${networkConfig.router},
            donId: ${networkConfig.donId},
            subscriptionId: ${networkConfig.subscriptionId},
            gasLimit: ${networkConfig.gasLimit}
        });
    }

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        NetworkConfig memory config = getNetworkConfig();
        
        console2.log("Deploying WattWitness AutomatedSolarpark contract...");
        console2.log("Router address:", config.router);
        console2.log("DON ID:", vm.toString(abi.encodePacked(config.donId)));
        console2.log("Subscription ID:", config.subscriptionId);
        console2.log("Gas Limit:", config.gasLimit);
        console2.log("Automation Support: ENABLED");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy the AutomatedSolarpark contract
        AutomatedSolarpark automatedSolarpark = new AutomatedSolarpark(config.router);

        console2.log("AutomatedSolarpark deployed at:", address(automatedSolarpark));
        console2.log("Owner:", automatedSolarpark.owner());

        // Configure the contract with auto-generated CBOR request
        console2.log("Configuring contract with WattWitness API automated request...");
        
        automatedSolarpark.updateRequest(
            WATTWITNESS_AUTOMATED_FETCH_REQUEST,
            config.subscriptionId,
            config.gasLimit,
            config.donId
        );
        
        console2.log("Contract configured successfully for automation");

        vm.stopBroadcast();

        console2.log("\\nAutomated Deployment Summary:");
        console2.log("==============================");
        console2.log("Contract Address:", address(automatedSolarpark));
        console2.log("Network: Avalanche Fuji Testnet");
        console2.log("Router:", config.router);
        console2.log("Installation ID:", automatedSolarpark.getInstallationId());
        console2.log("Readings Count:", automatedSolarpark.getReadingsCount());
        console2.log("Automation Ready: YES");
        
        console2.log("\\nAutomation Configuration Details:");
        console2.log("===================================");
        console2.log("CBOR Request: Auto-encoded with WattWitness API for automation");
        console2.log("API Endpoint: Fetches pending readings automatically");
        console2.log("Subscription ID:", config.subscriptionId);
        console2.log("Gas Limit:", config.gasLimit);
        console2.log("Upkeep Contract: Not set (use setAutomationCronContract)");
        
        console2.log("\\nAutomation Setup Commands:");
        console2.log("============================");
        console2.log("Set upkeep contract:");
        console2.log("cast send", address(automatedSolarpark), "'setAutomationCronContract(address)' <UPKEEP_ADDRESS> --private-key $DEPLOYER_PRIVATE_KEY --rpc-url fuji");
        console2.log("\\nManual test:");
        console2.log("cast send", address(automatedSolarpark), "'sendRequestCBOR()' --private-key $DEPLOYER_PRIVATE_KEY --rpc-url fuji");
        console2.log("\\nCheck readings:");
        console2.log("cast call", address(automatedSolarpark), "'getReadingsCount()' --rpc-url fuji");
        console2.log("\\nMonitor automation events:");
        console2.log("cast logs --address", address(automatedSolarpark), "--rpc-url fuji");
    }
}`;
}

// Execute deployment if this script is run directly
if (require.main === module) {
    deployAndConfigureAutomatedSolarpark().catch(console.error);
}

module.exports = { deployAndConfigureAutomatedSolarpark }; 