// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import {WattWitnessLoggerFactory} from "../src/WattWitnessLoggerFactory.sol";
import {WattWitnessDataLogger} from "../src/WattWitnessDataLogger.sol";

contract LoggerFactoryTest is Test {
    WattWitnessLoggerFactory factory;
    address router = address(0x1234);

    function setUp() public {
        factory = new WattWitnessLoggerFactory(router);
    }

    function testCreateLogger() public {
        uint32 id = 1;
        string memory name = "Test Site";
        string memory mac = "ABCDEF123456";
        string memory pubKey = "deadbeef";
        uint256 createdAt = 1_696_000_000;
        bool active = true;

        address loggerAddr = factory.createLogger(
            id,
            name,
            mac,
            pubKey,
            createdAt,
            active
        );

        assertEq(factory.loggers(id), loggerAddr);

        WattWitnessDataLogger logger = WattWitnessDataLogger(loggerAddr);
        assertEq(logger.installationId(), id);
        assertEq(logger.installationName(), name);
        assertEq(logger.shellyMac(), mac);
        assertEq(logger.esp32PublicKey(), pubKey);
        assertEq(logger.createdAt(), createdAt);
        assertEq(logger.isActive(), active);
    }
} 