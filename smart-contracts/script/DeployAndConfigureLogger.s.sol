// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";
import "../src/AutomatedFunctionsLogger.sol";

contract DeployAndConfigureLogger is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        
        // Avalanche Fuji configuration
        address router = 0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0;
        uint64 subscriptionId = vm.envUint("CHAINLINK_FUNCTIONS_SUBSCRIPTION_ID");
        uint32 gasLimit = 300000;
        bytes32 donID = 0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000;
        
        // Working CBOR request (from the original working contract)
        bytes memory requestCBOR = hex"0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000001806c636f64654c6f636174696f6ec25820000000000000000000000000000000000000000000000000000000000000000000686c616e6775616765c25820000000000000000000000000000000000000000000000000000000000000000066736f7572636579010d636f6e7374206368617261637465724964203d20617267735b305d3b20636f6e737420617069526573706f6e7365203d2061776169742046756e6374696f6e732e6d616b654874747052657175657374287b2075726c3a206068747470733a2f2f73776170692e696e666f2f6170692f70656f706c652f247b63686172616374657249647d2f60207d293b2069662028617069526573706f6e73652e6572726f7229207b207468726f77204572726f72282752657175657374206661696c656427293b207d20636f6e7374207b2064617461207d203d20617069526573706f6e73653b2072657475726e2046756e6374696f6e732e656e636f6465537472696e6728646174612e6e616d65293b64617267739f6131ff00000000";
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the logger contract
        AutomatedFunctionsLogger logger = new AutomatedFunctionsLogger(router);
        
        console.log("AutomatedFunctionsLogger deployed to:", address(logger));
        
        // Configure the Functions request with working CBOR data
        logger.updateRequest(requestCBOR, subscriptionId, gasLimit, donID);
        console.log("Request configuration updated with working CBOR data");
        
        console.log("=== CONFIGURATION COMPLETE ===");
        console.log("Contract:", address(logger));
        console.log("Subscription ID:", subscriptionId);
        console.log("Gas Limit:", gasLimit);
        console.log("");
        console.log("NEXT STEPS:");
        console.log("1. Add contract to Functions subscription 15652");
        console.log("2. Create automation upkeep for this contract");
        console.log("3. Call setAutomationCronContract(upkeepAddress) with your upkeep address");
        console.log("Ready for automation setup!");
        
        vm.stopBroadcast();
    }
} 