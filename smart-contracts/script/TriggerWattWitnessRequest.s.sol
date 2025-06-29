// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {Script, console2} from "forge-std/Script.sol";

interface ICompressedClient {
    function requestWattWitnessData() external returns (bytes32);
}

/**
 * @title TriggerCompressedRequest
 * @notice One-off helper script: sends a requestWattWitnessData() tx from DEPLOYER_PRIVATE_KEY
 *         to the deployed WattWitnessDataLogger contract (address read from COMPRESSED_CLIENT env var).
 *         Usage:
 *           export DEPLOYER_PRIVATE_KEY=<hex>
 *           export COMPRESSED_CLIENT=0x...
 *           forge script script/TriggerCompressedRequest.s.sol:TriggerCompressedRequest --rpc-url fuji --broadcast
 */
contract TriggerCompressedRequest is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address client = vm.envAddress("COMPRESSED_CLIENT");

        vm.startBroadcast(pk);
        ICompressedClient(client).requestWattWitnessData();
        vm.stopBroadcast();

        console2.log("requestWattWitnessData() sent to:", client);
        // Request ID logged in Chainlink Functions events; bytes32 logging not supported in console2
    }
} 