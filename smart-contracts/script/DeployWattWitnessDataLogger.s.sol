// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {Script, console2} from "forge-std/Script.sol";
import {WattWitnessDataLogger} from "../src/WattWitnessDataLogger.sol";

contract DeployCompressedWattWitness is Script {
    struct NetworkConfig {
        address router;
        bytes32 donId;
        uint64 subscriptionId;
        uint32 gasLimit;
    }

    function getNetworkConfig() internal view returns (NetworkConfig memory) {
        return NetworkConfig({
            router: 0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0, // Fuji Functions Router
            donId: 0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000, // fun-avalanche-fuji-1
            subscriptionId: uint64(vm.envUint("CHAINLINK_FUNCTIONS_SUBSCRIPTION_ID")),
            gasLimit: 300000 // Maximum allowed by Functions
        });
    }

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        NetworkConfig memory config = getNetworkConfig();
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy compressed client
        WattWitnessDataLogger compressedClient = new WattWitnessDataLogger(
            config.router,
            1, // installationId – update via env var if needed
            "Demo Installation", // installationName
            "FFFFFFFFFFFF", // shellyMac
            "", // esp32PublicKey
            block.timestamp,
            true
        );
        
        console2.log("WattWitnessDataLogger deployed at:", address(compressedClient));

        // Configure with Functions source
        string memory compressedSource = vm.readFile("chainlink-functions/source-wattwit-compressed.js");
        
        compressedClient.configure(
            config.subscriptionId,
            config.gasLimit,
            config.donId,
            compressedSource
        );
        
        console2.log("Configured with:");
        console2.log("  Subscription ID:", config.subscriptionId);
        console2.log("  Gas Limit:", config.gasLimit);
        console2.log("  DON ID:", vm.toString(config.donId));
        console2.log("  Max Batch Size:", compressedClient.maxBatchSize());

        // Set initial batch size (target 20 readings per batch)
        compressedClient.setMaxBatchSize(20);
        console2.log("  Initial batch size set to: 20 readings");

        vm.stopBroadcast();

        console2.log("\nDeployment Summary:");
        console2.log("===================");
        console2.log("Compressed Client:", address(compressedClient));
        console2.log("Compression Capacity: Up to 69 readings per batch");
        console2.log("Current Setting: 20 readings per batch");
        console2.log("Response Format: 256 bytes (99.6% utilization)");
        console2.log("Expected Gas Usage: ~250k (within 300k limit)");
        
        console2.log("\nNext Steps:");
        console2.log("1. Add", address(compressedClient), "as consumer to subscription", config.subscriptionId);
        console2.log("2. Test with: cast send", address(compressedClient), '"requestWattWitnessData()" --private-key $DEPLOYER_PRIVATE_KEY --rpc-url $AVALANCHE_FUJI_RPC');
        console2.log("3. Monitor events: ReadingDecompressed + CompressedBatchProcessed");
        console2.log("4. Scale up batch size gradually if gas allows (target 25+)");

        console2.log("\nContract deployed successfully!");
        console2.log("Verification will be handled by forge script --verify flag");
    }
} 