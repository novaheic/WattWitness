// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import {WattWitnessEventLogger} from "./WattWitnessEventLogger.sol";

/**
 * @title AutomatedWattWitness
 * @notice Chainlink Functions integration for WattWitness solar data
 * @dev Fetches solar readings via Chainlink Functions and stores them via WattWitnessEventLogger
 * 
 * Key Features:
 * - 160-byte optimized responses (62.5% of 256-byte limit)
 * - Merkle tree batch processing for unlimited scalability
 * - Multi-endpoint API failover with mock data backup
 * - Automation-ready with upkeep integration
 * - Event-driven storage via WattWitnessEventLogger
 */
contract AutomatedWattWitness is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    // ============ STORAGE ============
    
    // Chainlink Functions configuration
    uint64 public subscriptionId;
    uint32 public gasLimit;
    bytes32 public donId;
    string public sourceCode;
    
    // Request tracking
    mapping(bytes32 => bool) public validRequestIds;
    bytes32 public latestRequestId;
    
    // Automation
    address public upkeepContract;
    uint256 public maxBatchSize = 1; // MVP: 1 reading per call
    
    // Integration
    WattWitnessEventLogger public immutable eventLogger;
    
    // ============ EVENTS ============
    
    /**
     * @notice Emitted when a Functions request is sent
     * @param requestId The ID of the request
     * @param timestamp When the request was sent
     */
    event RequestSent(bytes32 indexed requestId, uint256 timestamp);
    
    /**
     * @notice Emitted when a Functions response is received
     * @param requestId The ID of the request
     * @param readingId The solar reading ID processed
     * @param powerW Power output in watts
     * @param totalWh Total energy in watt-hours
     * @param merkleRoot Merkle root for batch verification
     */
    event ResponseReceived(
        bytes32 indexed requestId,
        uint256 readingId,
        uint256 powerW,
        uint256 totalWh,
        bytes32 merkleRoot
    );
    
    /**
     * @notice Emitted when an error occurs
     * @param requestId The ID of the request
     * @param error Error details
     */
    event ErrorOccurred(bytes32 indexed requestId, string error);
    
    // ============ CONSTRUCTOR ============
    
    /**
     * @notice Initialize the contract
     * @param router Chainlink Functions router address
     * @param eventLoggerAddress WattWitnessEventLogger contract address
     */
    constructor(
        address router,
        address eventLoggerAddress
    ) FunctionsClient(router) ConfirmedOwner(msg.sender) {
        eventLogger = WattWitnessEventLogger(eventLoggerAddress);
    }
    
    // ============ CONFIGURATION ============
    
    /**
     * @notice Configure Chainlink Functions parameters
     * @param _subscriptionId Functions subscription ID
     * @param _gasLimit Callback gas limit
     * @param _donId DON ID for the network
     * @param _sourceCode JavaScript source code
     */
    function configure(
        uint64 _subscriptionId,
        uint32 _gasLimit,
        bytes32 _donId,
        string calldata _sourceCode
    ) external onlyOwner {
        subscriptionId = _subscriptionId;
        gasLimit = _gasLimit;
        donId = _donId;
        sourceCode = _sourceCode;
    }
    
    /**
     * @notice Set the upkeep contract address for automation
     * @param _upkeepContract Address of the Chainlink Automation upkeep
     */
    function setUpkeepContract(address _upkeepContract) external onlyOwner {
        upkeepContract = _upkeepContract;
    }
    
    /**
     * @notice Set maximum batch size for processing
     * @param _maxBatchSize Maximum number of readings per batch
     */
    function setMaxBatchSize(uint256 _maxBatchSize) external onlyOwner {
        require(_maxBatchSize > 0 && _maxBatchSize <= 50, "Invalid batch size");
        maxBatchSize = _maxBatchSize;
    }
    
    // ============ REQUEST FUNCTIONS ============
    
    /**
     * @notice Request WattWitness solar data
     * @dev Can be called by owner or upkeep contract
     */
    function requestWattWitnessData() external onlyAllowed returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(sourceCode);
        
        requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donId
        );
        
        validRequestIds[requestId] = true;
        latestRequestId = requestId;
        
        emit RequestSent(requestId, block.timestamp);
        
        return requestId;
    }
    
    /**
     * @notice Fulfill the Functions request - GAS OPTIMIZED
     * @param requestId The request ID
     * @param response The response data (160 bytes)
     * @param err Any error that occurred
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        require(validRequestIds[requestId], "Invalid request ID");
        
        if (err.length > 0) {
            emit ErrorOccurred(requestId, string(err));
            return;
        }
        
        if (response.length != 160) {
            emit ErrorOccurred(requestId, "Invalid response length");
            return;
        }
        
        // Parse 160-byte response efficiently
        // Format: merkleRoot (32b) + readingId (32b) + powerW (32b) + totalWh (32b) + timestamp (32b)
        bytes32 merkleRoot;
        uint256 readingId;
        uint256 powerW;
        uint256 totalWh;
        uint256 readingTimestamp;
        
        assembly {
            // Load merkle root (first 32 bytes)
            merkleRoot := mload(add(response, 32))
            
            // Load reading data (next 4 * 32 bytes, but only use last 4 bytes of each)
            readingId := and(mload(add(response, 64)), 0xFFFFFFFF)
            powerW := and(mload(add(response, 96)), 0xFFFFFFFF)
            totalWh := and(mload(add(response, 128)), 0xFFFFFFFF)
            readingTimestamp := and(mload(add(response, 160)), 0xFFFFFFFF)
        }
        
        // Store via EventLogger with gas optimization
        try eventLogger.storeReading(
            readingId,
            powerW,
            totalWh,
            readingTimestamp,
            merkleRoot,
            1 // MVP: Always 1 reading per batch
        ) {
            // Success - emit response event
            emit ResponseReceived(requestId, readingId, powerW, totalWh, merkleRoot);
        } catch {
            // If EventLogger fails, emit error but don't revert the entire transaction
            emit ErrorOccurred(requestId, "EventLogger storage failed");
        }
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Get the latest power reading
     * @return powerW Latest power output in watts
     */
    function getLatestPower() external view returns (uint256 powerW) {
        return eventLogger.getLatestPower();
    }
    
    /**
     * @notice Get the latest total energy
     * @return totalWh Latest total energy in watt-hours
     */
    function getLatestTotalEnergy() external view returns (uint256 totalWh) {
        return eventLogger.getLatestTotalEnergy();
    }
    
    /**
     * @notice Get the complete latest reading
     * @return id Reading identifier
     * @return powerW Power output in watts
     * @return totalWh Total energy in watt-hours
     * @return timestamp Unix timestamp
     * @return merkleRoot Merkle root for verification
     */
    function getLatestReading() external view returns (
        uint256 id,
        uint256 powerW,
        uint256 totalWh,
        uint256 timestamp,
        bytes32 merkleRoot
    ) {
        return eventLogger.getLatestReading();
    }
    
    /**
     * @notice Get system statistics
     * @return totalBatches Total number of processed batches
     * @return totalReadings Total number of processed readings
     * @return latestTimestamp_ Timestamp of the latest reading
     */
    function getStats() external view returns (
        uint256 totalBatches,
        uint256 totalReadings,
        uint256 latestTimestamp_
    ) {
        return eventLogger.getStats();
    }
    
    /**
     * @notice Get configuration details
     * @return subscriptionId_ Functions subscription ID
     * @return gasLimit_ Callback gas limit
     * @return donId_ DON ID
     * @return maxBatchSize_ Maximum batch size
     * @return upkeepContract_ Upkeep contract address
     */
    function getConfig() external view returns (
        uint64 subscriptionId_,
        uint32 gasLimit_,
        bytes32 donId_,
        uint256 maxBatchSize_,
        address upkeepContract_
    ) {
        return (subscriptionId, gasLimit, donId, maxBatchSize, upkeepContract);
    }
    
    // ============ ACCESS CONTROL ============
    
    /**
     * @notice Modifier to allow owner or upkeep contract
     */
    modifier onlyAllowed() {
        require(
            msg.sender == owner() || msg.sender == upkeepContract,
            "Only owner or upkeep contract allowed"
        );
        _;
    }
} 