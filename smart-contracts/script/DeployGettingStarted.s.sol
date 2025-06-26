// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {GettingStartedFunctionsConsumer} from "../src/GettingStartedFunctionsConsumer.sol";

/**
 * @title DeployGettingStarted
 * @notice Script to deploy GettingStartedFunctionsConsumer to Avalanche Fuji
 * @dev Run with: forge script script/DeployGettingStarted.s.sol:DeployGettingStarted --rpc-url fuji --broadcast
 */
contract DeployGettingStarted is Script {
    function setUp() public {}

    function run() public {
        // Get the private key from environment
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the contract
        GettingStartedFunctionsConsumer functionsConsumer = new GettingStartedFunctionsConsumer();

        // Stop broadcasting
        vm.stopBroadcast();

        // Log the deployed contract address
        console.log("Deployed contract address:", address(functionsConsumer));
    }
} 