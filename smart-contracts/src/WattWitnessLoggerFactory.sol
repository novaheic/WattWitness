// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./WattWitnessDataLogger.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

/**
 * @title WattWitnessLoggerFactory
 * @notice Deploys a new WattWitnessDataLogger contract per solar installation and keeps a registry mapping.
 */
contract WattWitnessLoggerFactory is ConfirmedOwner {
    // ======== Events ========
    event LoggerCreated(
        uint32 indexed installationId,
        address indexed logger,
        string name,
        string shellyMac
    );

    // ======== Immutable configuration ========
    address public immutable functionsRouter; // Chainlink Functions router address (Fuji)

    // ======== Registry mapping ========
    mapping(uint32 => address) public loggers; // installationId => logger contract

    constructor(address _router) ConfirmedOwner(msg.sender) {
        functionsRouter = _router;
    }

    /**
     * @notice Deploy a new logger for a solar installation
     * @dev Only owner (backend hot-wallet) may call.
     */
    function createLogger(
        uint32 installationId,
        string calldata name,
        string calldata shellyMac,
        string calldata publicKey,
        uint256 createdAt,
        bool isActive
    ) external onlyOwner returns (address logger) {
        require(loggers[installationId] == address(0), "Logger exists");

        WattWitnessDataLogger newLogger = new WattWitnessDataLogger(
            functionsRouter,
            installationId,
            name,
            shellyMac,
            publicKey,
            createdAt,
            isActive
        );

        loggers[installationId] = address(newLogger);
        emit LoggerCreated(installationId, address(newLogger), name, shellyMac);
        
        // Transfer ownership to the caller (typically the backend wallet)
        newLogger.transferOwnership(msg.sender);
        
        return address(newLogger);
    }

    /**
     * @notice Transfer ownership of a logger to a new owner
     * @dev Only factory owner can call this
     */
    function transferLoggerOwnership(uint32 installationId, address newOwner) external onlyOwner {
        address loggerAddr = loggers[installationId];
        require(loggerAddr != address(0), "Logger not found");
        
        WattWitnessDataLogger logger = WattWitnessDataLogger(loggerAddr);
        logger.transferOwnership(newOwner);
    }
} 