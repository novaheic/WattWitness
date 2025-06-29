// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "src/WattWitnessDataLogger.sol";

contract PowerReadingEmissionTest is Test {
    WattWitnessDataLogger internal logger;

    event PowerReading(
        uint32 indexed readingId,
        uint32 indexed timestamp,
        uint32 powerW,
        uint32 totalWh
    );

    function setUp() public {
        logger = new WattWitnessDataLogger(address(0)); // router not needed for unit test
    }

    // Helper to build a minimal valid 256-byte compressed response containing exactly one reading
    function _buildResponse() internal view returns (bytes memory) {
        bytes memory resp = new bytes(256);

        // 0-31 : fake merkle root (leave zeros)
        // 32-35 : firstReadingId (big-endian) => 1
        resp[32] = 0x00;
        resp[33] = 0x00;
        resp[34] = 0x00;
        resp[35] = 0x01;

        // 36-37 : readingCount = 1
        resp[36] = 0x00;
        resp[37] = 0x01;

        // 38-39 : timeInterval = 60 seconds
        resp[38] = 0x00;
        resp[39] = 0x3c;

        // 40-43 : basePower = 0x00000064 (100 W)
        resp[40] = 0x00;
        resp[41] = 0x00;
        resp[42] = 0x00;
        resp[43] = 0x64;

        // 44-47 : baseEnergy = 0x00002710 (10000 Wh)
        resp[44] = 0x00;
        resp[45] = 0x00;
        resp[46] = 0x27;
        resp[47] = 0x10;

        // 48 : powerDelta = 0 (signed 0)
        resp[48] = 0x00;

        // 49-50 : energyDelta = 0x000A (10 Wh)
        resp[49] = 0x00;
        resp[50] = 0x0a;

        return resp;
    }

    function testPowerReadingEmitted() public {
        bytes memory response = _buildResponse();

        // Expect exactly one PowerReading event with decoded values
        uint32 expectedId = 1;
        uint32 expectedTs = uint32(block.timestamp); // _decompressAndEmitBatchInline adds interval * index (0)
        uint32 expectedPower = 100;
        uint32 expectedEnergy = 10010; // 10000 + 10

        vm.expectEmit(true, true, true, true);
        emit PowerReading(expectedId, expectedTs, expectedPower, expectedEnergy);

        logger.decompressAndEmitBatch(bytes32(0), response);
    }
} 