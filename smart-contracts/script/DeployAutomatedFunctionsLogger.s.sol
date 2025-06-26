// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";
import "../src/AutomatedFunctionsLogger.sol";

contract DeployAutomatedFunctionsLogger is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        
        // Avalanche Fuji Functions Router
        address router = 0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0;
        
        vm.startBroadcast(deployerPrivateKey);
        
        AutomatedFunctionsLogger logger = new AutomatedFunctionsLogger(router);
        
        console.log("AutomatedFunctionsLogger deployed to:", address(logger));
        
        vm.stopBroadcast();
    }
} 