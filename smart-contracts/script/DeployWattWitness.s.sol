// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {Script, console2} from "forge-std/Script.sol";
import {AutomatedWattWitness} from "../src/AutomatedWattWitness.sol";
import {WattWitnessEventLogger} from "../src/WattWitnessEventLogger.sol";

/**
 * @title DeployWattWitness
 * @notice Deploys the complete WattWitness system with optimized merkle tree integration
 * @dev Run with: forge script script/DeployWattWitness.s.sol:DeployWattWitness --rpc-url fuji --broadcast --verify
 */
contract DeployWattWitness is Script {
    // Network configurations
    struct NetworkConfig {
        address router;
        bytes32 donId;
        uint64 subscriptionId;
        uint32 gasLimit;
    }

    // Network configurations
    function getNetworkConfig() internal view returns (NetworkConfig memory) {
        // Avalanche Fuji testnet configuration
        return NetworkConfig({
            router: 0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0, // Fuji Functions Router
            donId: 0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000, // fun-avalanche-fuji-1
            subscriptionId: uint64(vm.envUint("CHAINLINK_FUNCTIONS_SUBSCRIPTION_ID")), // Get from .env
            gasLimit: 300000 // Maximum callback gas limit
        });
    }

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        string memory sourceCode = vm.readFile("chainlink-functions/source-wattwit.js");
        
        NetworkConfig memory config = getNetworkConfig();
        
        console2.log("Deploying WattWitness System to Fuji Testnet");
        console2.log("===============================================");
        console2.log("Router address:", config.router);
        console2.log("DON ID:", vm.toString(abi.encodePacked(config.donId)));
        console2.log("Subscription ID:", config.subscriptionId);
        console2.log("Gas Limit:", config.gasLimit);
        console2.log("Source code loaded from: ./chainlink-functions/source-wattwit.js");

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Deploy WattWitnessEventLogger
        console2.log("\nDeploying WattWitnessEventLogger...");
        WattWitnessEventLogger eventLogger = new WattWitnessEventLogger();
        console2.log("WattWitnessEventLogger deployed at:", address(eventLogger));

        // Step 2: Deploy AutomatedWattWitness with EventLogger address
        console2.log("\nDeploying AutomatedWattWitness...");
        AutomatedWattWitness automatedWattWitness = new AutomatedWattWitness(
            config.router,
            address(eventLogger)
        );
        console2.log("AutomatedWattWitness deployed at:", address(automatedWattWitness));

        // Step 3: Configure AutomatedWattWitness
        console2.log("\nConfiguring AutomatedWattWitness...");
        automatedWattWitness.configure(
            config.subscriptionId,
            config.gasLimit,
            config.donId,
            sourceCode
        );
        console2.log("AutomatedWattWitness configured successfully");

        // Step 4: Set batch size for MVP (1 reading)
        automatedWattWitness.setMaxBatchSize(1);
        console2.log("MVP: Max batch size set to 1 reading");

        vm.stopBroadcast();

        console2.log("\nWattWitness System Deployment Complete!");
        console2.log("==========================================");
        console2.log("WattWitnessEventLogger:  ", address(eventLogger));
        console2.log("AutomatedWattWitness:    ", address(automatedWattWitness));
        console2.log("Owner:                   ", automatedWattWitness.owner());
        
        console2.log("\nSystem Features:");
        console2.log("==================");
        console2.log("- Merkle tree batch processing for unlimited scalability");
        console2.log("- Event-driven storage (13x more gas efficient)");
        console2.log("- 160-byte responses (62.5% of 256-byte limit)");
        console2.log("- Multi-endpoint API fallback with mock data");
        console2.log("- Instant access functions for smart contracts");
        console2.log("- Real-time event subscriptions for frontends");
        
        console2.log("\nNext Steps:");
        console2.log("==============");
        console2.log("1. Add AutomatedWattWitness to Functions subscription", config.subscriptionId);
        console2.log("2. Set up Chainlink Automation upkeep for automated data fetching");
        console2.log("3. Configure upkeep contract address in AutomatedWattWitness");
        console2.log("4. Test the system with manual data request");
        
        console2.log("\nQuick Commands:");
        console2.log("==================");
        console2.log("Add to subscription (using Functions UI):");
        console2.log("Contract address:", address(automatedWattWitness));
        console2.log("");
        console2.log("Manual test request:");
        console2.log("cast send", address(automatedWattWitness), "'requestWattWitnessData()' --private-key $DEPLOYER_PRIVATE_KEY --rpc-url $AVALANCHE_FUJI_RPC");
        console2.log("");
        console2.log("Check latest reading:");
        console2.log("cast call", address(automatedWattWitness), "'getLatestPower()' --rpc-url $AVALANCHE_FUJI_RPC");
        console2.log("");
        console2.log("Check system stats:");
        console2.log("cast call", address(automatedWattWitness), "'getStats()' --rpc-url $AVALANCHE_FUJI_RPC");
        console2.log("");
        console2.log("View on Snowtrace:");
        console2.log("https://testnet.snowtrace.io/address/", address(automatedWattWitness));
    }
} 