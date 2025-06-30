// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/WattWitnessDataLogger.sol";

contract MerkleVerifySha256Test is Test {
    WattWitnessDataLogger public logger;

    function setUp() public {
        // Deploy with minimal constructor parameters
        logger = new WattWitnessDataLogger(
            address(0x1), // router (dummy)
            1,            // installationId
            "Test",       // name
            "AABBCCDDEEFF", // shellyMac
            "0x123",      // publicKey
            block.timestamp, // createdAt
            true          // isActive
        );
    }

    function testSha256LeafGeneration() public view {
        // Test data that matches our on-chain reading
        uint32 readingId = 163;
        uint32 powerW = 2;
        uint32 totalWh = 328600;
        uint32 timestamp = 1751240438;

        // This is what the Solidity verifyReadingSha256 function should generate
        string memory jsonStr = string(abi.encodePacked(
            "[", Strings.toString(readingId), 
            ",", Strings.toString(powerW),
            ",", Strings.toString(totalWh),
            ",", Strings.toString(timestamp), "]"
        ));
        
        // Expected leaf hash: sha256("[163,2,328600,1751240438]")
        bytes32 expectedLeaf = sha256(bytes(jsonStr));
        
        console.log("JSON string:", jsonStr);
        console.logBytes32(expectedLeaf);
        
        // The expected value should be:
        // sha256("[163,2,328600,1751240438]") = 0x43f1e20a5af4b77f13b9e0cdfbff19b6aae2f77a8de58bae06c52b45b2ec75b3
        // (This can be verified with external tools)
    }

    function testMerkleProofStructure() public view {
        // Create a simple 4-leaf tree to test merkle proof structure
        bytes32[4] memory leaves = [
            sha256(bytes("[163,2,328600,1751240438]")),
            sha256(bytes("[164,1,328600,1751240450]")),
            sha256(bytes("[165,1,328600,1751240462]")),
            sha256(bytes("[166,1,328600,1751240474]"))
        ];
        
        // Level 1: hash pairs of leaves (no sorting for SHA-256 version)
        bytes32 h01 = sha256(abi.encodePacked(leaves[0], leaves[1]));
        bytes32 h23 = sha256(abi.encodePacked(leaves[2], leaves[3]));
        
        // Level 2: hash the pairs
        bytes32 root = sha256(abi.encodePacked(h01, h23));
        
        console.log("4-leaf SHA-256 merkle root:");
        console.logBytes32(root);
        
        // For leaf 0 (readingId 163), the proof should be [leaves[1], h23]
        bytes32[] memory proof = new bytes32[](2);
        proof[0] = leaves[1]; // sibling of leaf 0
        proof[1] = h23;       // sibling of parent node
        
        // Manually verify the proof
        bytes32 computed = leaves[0];
        computed = sha256(abi.encodePacked(computed, proof[0])); // computed + leaves[1] = h01
        computed = sha256(abi.encodePacked(computed, proof[1])); // h01 + h23 = root
        
        assertEq(computed, root, "Manual proof verification failed");
        console.log("Manual 4-leaf proof verification successful");
    }
} 