// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {Script, console2} from "forge-std/Script.sol";
import {WattWitnessLoggerFactory} from "../src/WattWitnessLoggerFactory.sol";

/// @notice Deploys the WattWitnessLoggerFactory contract to Avalanche Fuji (or any network given router).
/// @dev Expects the following environment variables:
///      DEPLOYER_PRIVATE_KEY   – private key of deployer wallet
///      FUNCTIONS_ROUTER       – address of Chainlink Functions router (defaults to Fuji)
contract DeployLoggerFactory is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address router;
        // Allow override via env; default to Fuji router
        try vm.envAddress("FUNCTIONS_ROUTER") returns (address r) {
            router = r;
        } catch {
            router = 0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0; // Fuji
        }

        vm.startBroadcast(pk);

        WattWitnessLoggerFactory factory = new WattWitnessLoggerFactory(router);
        console2.log("LoggerFactory deployed at:", address(factory));

        vm.stopBroadcast();

        console2.log("\nAdd the following to your .env file:");
        console2.log("FACTORY_ADDRESS=" , address(factory));
    }
} 