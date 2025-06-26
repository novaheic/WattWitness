// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {Script, console2} from "forge-std/Script.sol";
import {Solarpark} from "../src/Solarpark.sol";

/**
 * @title DeploySolarpark
 * @notice This script deploys the Solarpark contract for WattWitness solar park data logging
 * @dev Run with: forge script script/DeploySolarpark.s.sol:DeploySolarpark --rpc-url <RPC_URL> --private-key <PRIVATE_KEY> --broadcast
 */
contract DeploySolarpark is Script {
    // Network configurations
    struct NetworkConfig {
        address router;
        bytes32 donId;
        uint64 subscriptionId;
        uint32 gasLimit;
    }

    // Simple Fetch Readings CBOR Request (generated from corrected simple-fetch-readings.js)
    // This fetches pending readings from WattWitness API at /api/v1/readings/pending
    bytes constant SIMPLE_FETCH_REQUEST = hex"a464617267738175687474703a2f2f6c6f63616c686f73743a3830303066736f757263657905cf2f2f2053696d706c6520576174745769746e6573732052656164696e6720466574636865720a2f2f20466574636865732070656e64696e672072656164696e67732066726f6d20576174745769746e6573732041504920666f72206f6e2d636861696e2073746f726167650a0a2f2f20436f6e66696775726174696f6e2066726f6d20617267730a636f6e7374204150495f424153455f55524c203d20617267735b305d207c7c2022687474703a2f2f6c6f63616c686f73743a38303030223b0a0a636f6e736f6c652e6c6f6728604665746368696e672070656e64696e672072656164696e67732066726f6d20247b4150495f424153455f55524c7d60293b0a0a747279207b0a202020202f2f2046657463682070656e64696e672072656164696e67732066726f6d20576174745769746e657373204150490a20202020636f6e73742061706955726c203d2060247b4150495f424153455f55524c7d2f6170692f76312f72656164696e67732f70656e64696e67603b0a202020200a20202020636f6e736f6c652e6c6f6728604d616b696e67207265717565737420746f3a20247b61706955726c7d60293b0a202020200a20202020636f6e737420726573706f6e7365203d2061776169742046756e6374696f6e732e6d616b654874747052657175657374287b0a202020202020202075726c3a2061706955726c2c0a20202020202020206d6574686f643a2022474554222c0a2020202020202020686561646572733a207b0a20202020202020202020202022436f6e74656e742d54797065223a20226170706c69636174696f6e2f6a736f6e220a20202020202020207d0a202020207d293b0a0a20202020636f6e736f6c652e6c6f6728604854545020526573706f6e7365207374617475733a20247b726573706f6e73652e7374617475737d60293b0a202020200a202020206966202821726573706f6e73652e6461746129207b0a20202020202020207468726f77206e6577204572726f7228224e6f20646174612072656365697665642066726f6d2070656e64696e672072656164696e67732041504922293b0a202020207d0a0a20202020636f6e73742070656e64696e6744617461203d20726573706f6e73652e646174613b0a20202020636f6e736f6c652e6c6f672860526563656976656420247b70656e64696e67446174612e636f756e747d2070656e64696e672072656164696e677360293b0a0a202020202f2f20436865636b2069662074686572652061726520616e792070656e64696e672072656164696e67730a202020206966202870656e64696e67446174612e636f756e74203d3d3d203029207b0a2020202020202020636f6e736f6c652e6c6f6728224e6f2070656e64696e672072656164696e677320666f756e6422293b0a202020202020202072657475726e2046756e6374696f6e732e656e636f6465537472696e6728224e4f5f50454e44494e475f52454144494e475322293b0a202020207d0a0a202020202f2f2052657475726e207468652072656164696e67732064617461206173204a534f4e20737472696e6720666f722074686520636f6e747261637420746f2070617273650a20202020636f6e736f6c652e6c6f67286052657475726e696e6720247b70656e64696e67446174612e636f756e747d2072656164696e677320666f72206f6e2d636861696e2073746f7261676560293b0a202020200a2020202072657475726e2046756e6374696f6e732e656e636f6465537472696e67284a534f4e2e737472696e676966792870656e64696e674461746129293b0a0a7d20636174636820286572726f7229207b0a20202020636f6e736f6c652e6572726f7228224572726f72206665746368696e672070656e64696e672072656164696e67733a222c206572726f722e6d657373616765293b0a202020207468726f77206e6577204572726f7228604661696c656420746f2066657463682070656e64696e672072656164696e67733a20247b6572726f722e6d6573736167657d60293b0a7d206c636f64654c616e6775616765006c636f64654c6f636174696f6e00";

    // Network configurations - update these based on the network you're deploying to
    function getNetworkConfig() internal view returns (NetworkConfig memory) {
        // Avalanche Fuji testnet configuration
        return NetworkConfig({
            router: 0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0, // Fuji Functions Router
            donId: 0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000, // fun-avalanche-fuji-1
            subscriptionId: uint64(vm.envUint("CHAINLINK_FUNCTIONS_SUBSCRIPTION_ID")), // Get from .env
            gasLimit: 300000
        });
    }

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        
        NetworkConfig memory config = getNetworkConfig();
        
        console2.log("Deploying Solarpark contract...");
        console2.log("Router address:", config.router);
        console2.log("DON ID:", vm.toString(abi.encodePacked(config.donId)));
        console2.log("Subscription ID:", config.subscriptionId);
        console2.log("Gas Limit:", config.gasLimit);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy the Solarpark contract
        Solarpark solarpark = new Solarpark(config.router);

        console2.log("Solarpark deployed at:", address(solarpark));
        console2.log("Owner:", solarpark.owner());

        // Configure the contract with optimistic CBOR request
        console2.log("Configuring contract with optimistic CBOR request...");
        
        solarpark.updateRequest(
            SIMPLE_FETCH_REQUEST, // Pre-encoded simple fetch request
            config.subscriptionId,
            config.gasLimit,
            config.donId
        );
        
        console2.log("Contract configured successfully with simple fetch request");

        vm.stopBroadcast();

        console2.log("\nDeployment Summary:");
        console2.log("==================");
        console2.log("Contract Address:", address(solarpark));
        console2.log("Router:", config.router);
        console2.log("DON ID:", vm.toString(abi.encodePacked(config.donId)));
        console2.log("Installation ID:", solarpark.getInstallationId());
        
        console2.log("\nSimple Fetch Configuration:");
        console2.log("==========================");
        console2.log("CBOR Request: Pre-configured with corrected simple-fetch-readings.js");
        console2.log("API Workflow: GET /api/v1/readings/pending -> Return data for on-chain storage");
        console2.log("Subscription ID:", config.subscriptionId);
        console2.log("Gas Limit:", config.gasLimit);
        
        console2.log("\nNext Steps:");
        console2.log("===========");
        console2.log("1. Make sure WattWitness API is running at the configured URL");
        console2.log("2. Add this contract as a consumer to subscription", config.subscriptionId);
        console2.log("3. Test the simple fetch workflow by calling sendRequestCBOR()");
        console2.log("4. Set up automation to call sendRequestCBOR() periodically");
        console2.log("5. Monitor ReadingsProcessed events for successful runs");
        
        console2.log("\nTest Commands:");
        console2.log("=============");
        console2.log("Test function call:");
        console2.log("cast send", address(solarpark), "'sendRequestCBOR()' --private-key $DEPLOYER_PRIVATE_KEY --rpc-url $AVALANCHE_FUJI_RPC");
        console2.log("\nCheck readings count:");
        console2.log("cast call", address(solarpark), "'getReadingsCount()'");
    }
}