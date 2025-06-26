// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {FunctionsConsumerExample} from "../src/FunctionsConsumerExample.sol";

/**
 * @title DeployFunctionsConsumerExample
 * @notice Script to deploy FunctionsConsumerExample to Avalanche Fuji
 * @dev Run with: forge script script/DeployFunctionsConsumerExample.s.sol:DeployFunctionsConsumerExample --rpc-url fuji --broadcast
 */
contract DeployFunctionsConsumerExample is Script {
    // Avalanche Fuji Functions Router address
    address constant FUJI_ROUTER = 0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0;

    function setUp() public {}

    function run() public {
        // Get the private key from environment
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the contract with the router address
        FunctionsConsumerExample functionsConsumer = new FunctionsConsumerExample(FUJI_ROUTER);

        // Stop broadcasting
        vm.stopBroadcast();

        // Log the deployed contract address
        console.log("FunctionsConsumerExample deployed to:", address(functionsConsumer));
        console.log("Router address:", FUJI_ROUTER);
    }
} 