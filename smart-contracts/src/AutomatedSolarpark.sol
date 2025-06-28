// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {FunctionsClient} from "chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

/**
 * @title AutomatedSolarpark - WattWitness Solar Park Data Logger with Chainlink Automation
 * @author Tranquil-Flow
 * @notice This contract fetches and stores power readings from WattWitness API using Chainlink Functions and Automation
 * @notice You may need to add a Forwarder for additional security.
 * @notice NOT FOR PRODUCTION USE - This is a demonstration contract
 */
contract AutomatedSolarpark is FunctionsClient, ConfirmedOwner {
    uint256 public installationId = 1;   // Default installation ID TODO: Update from factory

    // Chainlink Functions and Automation config
    address public upkeepContract;
    bytes public request;
    uint64 public subscriptionId;
    uint32 public gasLimit;
    bytes32 public donID;
    bytes32 public s_lastRequestId;
    
    // Power reading data
    struct PowerReading {
        uint256 readingId;      // API reading ID for verification
        uint256 powerW;         // power_w value (fixed-point with 3 decimals)
        uint256 totalEnergyWh;  // total_wh value (fixed-point with 3 decimals)
        uint256 timestamp;      // Unix timestamp
        bytes signature;        // Cryptographic signature
    }
    
    PowerReading[] public powerReadings;
    
    bytes public s_lastResponse;
    bytes public s_lastError;

    error NotAllowedCaller(
        address caller,
        address owner,
        address automationRegistry
    );
    
    error UnexpectedRequestID(bytes32 requestId);

    event Response(
        bytes32 indexed requestId, 
        bytes response, 
        bytes err, 
        uint256 timestamp, 
        uint256 newReadingsCount
    );

    /// @param router The router address for Chainlink Functions for the deployed chain
    constructor(
        address router
    ) FunctionsClient(router) ConfirmedOwner(msg.sender) {}

    /**
     * @notice Reverts if called by anyone other than the contract owner or automation registry.
     */
    modifier onlyAllowed() {
        if (msg.sender != owner() && msg.sender != upkeepContract)
            revert NotAllowedCaller(msg.sender, owner(), upkeepContract);
        _;
    }

    // ========== Automation Setup Functions ==========

    /// @notice Set the Chainlink Automation cron contract
    /// @param _upkeepContract The address of the automation cron contract
    function setAutomationCronContract(
        address _upkeepContract
    ) external onlyOwner {
        upkeepContract = _upkeepContract;
    }

    /// @notice Update the request settings
    /// @dev Only callable by the owner of the contract
    /// @param _request The new encoded CBOR request to be set. The request is encoded offchain
    /// @param _subscriptionId The new subscription ID to be set
    /// @param _gasLimit The new gas limit to be set
    /// @param _donID The new job ID to be set
    function updateRequest(
        bytes memory _request,
        uint64 _subscriptionId,
        uint32 _gasLimit,
        bytes32 _donID
    ) external onlyOwner {
        request = _request;
        subscriptionId = _subscriptionId;
        gasLimit = _gasLimit;
        donID = _donID;
    }

    // ========== Solar Park Specific Functions ==========

    /// @notice Set the installation ID for API calls
    /// @param _installationId The installation ID to fetch readings for
    // TODO: Call in deployment process from factory call
    function setInstallationId(uint256 _installationId) external onlyOwner {
        installationId = _installationId;
    }

    // ========== Chainlink Functions ==========

    /**
     * @notice Send a pre-encoded CBOR request to fetch power readings
     * @dev This function will be called by Chainlink Automation
     * @return requestId The ID of the sent request
     */
    function sendRequestCBOR()
        external
        onlyAllowed
        returns (bytes32 requestId)
    {
        s_lastRequestId = _sendRequest(
            request,
            subscriptionId,
            gasLimit,
            donID
        );
        return s_lastRequestId;
    }

    /**
     * @notice Process the response from Chainlink Functions
     * @param requestId The request ID, returned by sendRequest()
     * @param response Aggregated response from the user code (uint256 Bitcoin price)
     * @param err Aggregated error from the user code or from the execution pipeline
     * Either response or error parameter will be set, but never both
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (s_lastRequestId != requestId) {
            revert UnexpectedRequestID(requestId);
        }
        
        // Update latest values (same as tutorial pattern)
        s_lastResponse = response;
        s_lastError = err;
        
        // Generate mock solar data when Bitcoin price is successfully received
        if (err.length == 0 && response.length > 0) {
            // Decode uint256 Bitcoin price (tutorial response format)
            uint256 bitcoinPrice = abi.decode(response, (uint256));
            
            // Generate realistic mock solar data using Bitcoin price as entropy
            uint256 priceEntropy = bitcoinPrice % 1000; // Use last 3 digits for variation
            uint256 mockPower = 1000 + priceEntropy; // 1000-2000W range based on Bitcoin price
            uint256 mockEnergy = 15000 + (priceEntropy * 20); // 15-35kWh range
            
            // Store mock solar reading
            powerReadings.push(PowerReading({
                readingId: powerReadings.length + 1, 
                powerW: mockPower, 
                totalEnergyWh: mockEnergy, 
                timestamp: block.timestamp,
                signature: abi.encodePacked("BITCOIN_TRIGGERED_", bitcoinPrice) // Include Bitcoin price for debugging
            }));
        }
        
        // Emit response event with solar reading count
        emit Response(
            requestId, 
            response, 
            err, 
            block.timestamp, 
            powerReadings.length
        );
    }

    // ========== View Functions ==========
    
    /// @notice Get the total number of readings stored
    /// @return count The total number of power readings
    function getReadingsCount() external view returns (uint256 count) {
        return powerReadings.length;
    }
    
    /// @notice Get a specific reading by index
    /// @param index The index of the reading (0 = first reading)
    /// @return reading The complete power reading struct
    function getReadingAtIndex(uint256 index) external view returns (PowerReading memory reading) {
        require(index < powerReadings.length, "Index out of bounds");
        return powerReadings[index];
    }
    
    /// @notice Get the latest N readings
    /// @param count The number of recent readings to retrieve
    /// @return readings Array of power reading structs
    function getLatestReadings(uint256 count) external view returns (PowerReading[] memory readings) {
        uint256 totalReadings = powerReadings.length;
        uint256 returnCount = count > totalReadings ? totalReadings : count;
        
        readings = new PowerReading[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            uint256 index = totalReadings - returnCount + i;
            readings[i] = powerReadings[index];
        }
        
        return readings;
    }
    
    /// @notice Get current installation ID
    /// @return The installation ID being used for API calls
    function getInstallationId() external view returns (uint256) {
        return installationId;
    }
} 