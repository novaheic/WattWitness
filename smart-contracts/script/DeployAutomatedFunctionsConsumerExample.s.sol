// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {AutomatedFunctionsConsumerExample} from "../src/AutomatedFunctionsConsumerExample.sol";

/**
 * @title DeployAutomatedFunctionsConsumerExample
 * @notice Script to deploy AutomatedFunctionsConsumerExample to Avalanche Fuji
 * @dev Run with: forge script script/DeployAutomatedFunctionsConsumerExample.s.sol:DeployAutomatedFunctionsConsumerExample --rpc-url fuji --broadcast
 */
contract DeployAutomatedFunctionsConsumerExample is Script {
    // Avalanche Fuji Functions Router address
    address constant FUJI_ROUTER = 0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0;

    function setUp() public {}

    function run() public {
        // Get the private key from environment
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the contract with the router address
        AutomatedFunctionsConsumerExample automatedConsumer = new AutomatedFunctionsConsumerExample(FUJI_ROUTER);

        // Stop broadcasting
        vm.stopBroadcast();

        // Log the deployed contract address
        console.log("AutomatedFunctionsConsumerExample deployed to:", address(automatedConsumer));
        console.log("Router address:", FUJI_ROUTER);
        console.log("");
        console.log("Next steps:");
        console.log("1. Add contract to your Chainlink Functions subscription");
        console.log("2. Set up Chainlink Automation upkeep for automated calls");
        console.log("3. Configure request parameters with updateRequest()");
        console.log("4. Set automation contract address with setAutomationCronContract()");
    }
} 