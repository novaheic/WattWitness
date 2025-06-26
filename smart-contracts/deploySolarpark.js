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

async function deployAndConfigureSolarpark() {
    try {
        console.log("🚀 Starting WattWitness Solarpark Deployment with Auto-Encoding...\n");

        // Step 1: Read and validate environment
        const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
        if (!privateKey) {
            throw new Error("DEPLOYER_PRIVATE_KEY not found in environment");
        }

        const network = NETWORK_CONFIG.fuji;
        const provider = new ethers.providers.JsonRpcProvider(network.rpcUrl);
        const signer = new ethers.Wallet(privateKey, provider);

        console.log("📋 Deployment Configuration:");
        console.log("==========================");
        console.log("Network: Avalanche Fuji Testnet");
        console.log("Deployer:", await signer.getAddress());
        console.log("Router:", network.router);
        console.log("DON ID:", network.donId);
        console.log("Subscription ID:", network.subscriptionId);
        console.log("WattWitness API:", WATTWITNESS_CONFIG.apiUrl + WATTWITNESS_CONFIG.endpoint);
        console.log("");

        // Step 2: Build CBOR request automatically
        console.log("🔧 Building CBOR Request...");
        
        // Read the JavaScript source code (using mock solar data)
        const sourcePath = path.join(__dirname, "mock-solar-data.js");
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

        console.log("✓ CBOR request encoded successfully");
        console.log("Request length:", cborRequest.length, "characters");
        console.log("");

        // Step 3: Deploy contract using Forge
        console.log("🏗️  Deploying Solarpark Contract...");
        
        // Create temporary deployment script with embedded CBOR
        const deploymentScript = generateSolidityDeploymentScript(cborRequest, network);
        const tempScriptPath = path.join(__dirname, "script", "DeploySolarparkAuto.s.sol");
        
        fs.writeFileSync(tempScriptPath, deploymentScript);
        console.log("✓ Generated deployment script with embedded CBOR");

        // Step 4: Execute forge deployment
        const { spawn } = require("child_process");
        
        const forgeArgs = [
            "script",
            "script/DeploySolarparkAuto.s.sol:DeploySolarparkAuto",
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
                console.log("\n🎉 Deployment Complete!");
                console.log("🔗 View contracts on Snowtrace:", network.explorerUrl);
                console.log("\n📝 Next Steps:");
                console.log("1. Add the deployed contract to your Functions subscription");
                console.log("2. Test the function by calling sendRequestCBOR()");
                console.log("3. Set up Chainlink Automation for periodic execution");
                console.log("4. Monitor events for successful data fetching");
            } else {
                console.error("❌ Deployment failed with exit code:", code);
            }
        });

        forgeProcess.on("error", (error) => {
            console.error("❌ Forge execution error:", error.message);
        });

    } catch (error) {
        console.error("❌ Deployment Error:", error.message);
        process.exit(1);
    }
}

function generateSolidityDeploymentScript(cborRequest, networkConfig) {
    const hexData = cborRequest.slice(2); // Remove 0x prefix
    
    return `// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {Script, console2} from "forge-std/Script.sol";
import {Solarpark} from "../src/Solarpark.sol";

/**
 * @title DeploySolarparkAuto
 * @notice Auto-generated deployment script with embedded CBOR request
 * @dev Generated by deploySolarpark.js with WattWitness API configuration
 */
contract DeploySolarparkAuto is Script {
    // Network configurations
    struct NetworkConfig {
        address router;
        bytes32 donId;
        uint64 subscriptionId;
        uint32 gasLimit;
    }

    // Auto-generated CBOR request with WattWitness API configuration
    bytes constant WATTWITNESS_FETCH_REQUEST = hex"${hexData}";

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
        
        console2.log("Deploying WattWitness Solarpark contract...");
        console2.log("Router address:", config.router);
        console2.log("DON ID:", vm.toString(abi.encodePacked(config.donId)));
        console2.log("Subscription ID:", config.subscriptionId);
        console2.log("Gas Limit:", config.gasLimit);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy the Solarpark contract
        Solarpark solarpark = new Solarpark(config.router);

        console2.log("Solarpark deployed at:", address(solarpark));
        console2.log("Owner:", solarpark.owner());

        // Configure the contract with auto-generated CBOR request
        console2.log("Configuring contract with WattWitness API request...");
        
        solarpark.updateRequest(
            WATTWITNESS_FETCH_REQUEST,
            config.subscriptionId,
            config.gasLimit,
            config.donId
        );
        
        console2.log("Contract configured successfully");

        vm.stopBroadcast();

        console2.log("\\nDeployment Summary:");
        console2.log("======================");
        console2.log("Contract Address:", address(solarpark));
        console2.log("Network: Avalanche Fuji Testnet");
        console2.log("Router:", config.router);
        console2.log("Installation ID:", solarpark.getInstallationId());
        console2.log("Readings Count:", solarpark.getReadingsCount());
        
        console2.log("\\nConfiguration Details:");
        console2.log("========================");
        console2.log("CBOR Request: Auto-encoded with WattWitness API");
        console2.log("API Endpoint: Fetches pending readings from WattWitness");
        console2.log("Subscription ID:", config.subscriptionId);
        console2.log("Gas Limit:", config.gasLimit);
        
        console2.log("\\nQuick Test Commands:");
        console2.log("======================");
        console2.log("Test function:");
        console2.log("cast send", address(solarpark), "'sendRequestCBOR()' --private-key $DEPLOYER_PRIVATE_KEY --rpc-url fuji");
        console2.log("\\nCheck readings:");
        console2.log("cast call", address(solarpark), "'getReadingsCount()' --rpc-url fuji");
        console2.log("\\nMonitor events:");
        console2.log("cast logs --address", address(solarpark), "--rpc-url fuji");
    }
}`;
}

// Execute deployment if this script is run directly
if (require.main === module) {
    deployAndConfigureSolarpark().catch(console.error);
}

module.exports = { deployAndConfigureSolarpark }; 