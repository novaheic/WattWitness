// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {FunctionsClient} from "chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

/**
 * @title Functions contract with response logging for Automation.
 * @notice This contract logs all API responses in an array for historical tracking.
 * @notice Enhanced version that maintains a complete history of all function calls.
 * @notice NOT FOR PRODUCTION USE
 */
contract AutomatedFunctionsLogger is FunctionsClient, ConfirmedOwner {
    address public upkeepContract;
    bytes public request;
    uint64 public subscriptionId;
    uint32 public gasLimit;
    bytes32 public donID;
    bytes32 public s_lastRequestId;
    
    // Enhanced storage: Arrays to log all responses and errors
    bytes[] public s_responseHistory;
    bytes[] public s_errorHistory;
    bytes32[] public s_requestIdHistory;
    uint256[] public s_timestampHistory;
    
    // Keep latest for quick access
    bytes public s_lastResponse;
    bytes public s_lastError;

    error NotAllowedCaller(
        address caller,
        address owner,
        address automationRegistry
    );
    error UnexpectedRequestID(bytes32 requestId);

    event Response(bytes32 indexed requestId, bytes response, bytes err, uint256 timestamp, uint256 totalResponses);

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

    /**
     * @notice Send a pre-encoded CBOR request
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
     * @notice Store result/error in history arrays and update latest values
     * @param requestId The request ID, returned by sendRequest()
     * @param response Aggregated response from the user code
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
        
        // Update latest values
        s_lastResponse = response;
        s_lastError = err;
        
        // Add to history arrays
        s_responseHistory.push(response);
        s_errorHistory.push(err);
        s_requestIdHistory.push(requestId);
        s_timestampHistory.push(block.timestamp);
        
        emit Response(requestId, response, err, block.timestamp, s_responseHistory.length);
    }

    // === View Functions for Response History ===
    
    /**
     * @notice Get the total number of responses logged
     * @return count The total number of API calls made
     */
    function getResponseCount() external view returns (uint256 count) {
        return s_responseHistory.length;
    }
    
    /**
     * @notice Get a specific response by index
     * @param index The index of the response (0 = first response)
     * @return response The response data at that index
     * @return error The error data at that index
     * @return requestId The request ID at that index
     * @return timestamp The timestamp when the response was received
     */
    function getResponseAtIndex(uint256 index) external view returns (
        bytes memory response,
        bytes memory error,
        bytes32 requestId,
        uint256 timestamp
    ) {
        require(index < s_responseHistory.length, "Index out of bounds");
        return (
            s_responseHistory[index],
            s_errorHistory[index],
            s_requestIdHistory[index],
            s_timestampHistory[index]
        );
    }
    
    /**
     * @notice Get the latest N responses
     * @param count The number of recent responses to retrieve
     * @return responses Array of recent response data
     * @return errors Array of recent error data
     * @return requestIds Array of recent request IDs
     * @return timestamps Array of recent timestamps
     */
    function getLatestResponses(uint256 count) external view returns (
        bytes[] memory responses,
        bytes[] memory errors,
        bytes32[] memory requestIds,
        uint256[] memory timestamps
    ) {
        uint256 totalResponses = s_responseHistory.length;
        uint256 returnCount = count > totalResponses ? totalResponses : count;
        
        responses = new bytes[](returnCount);
        errors = new bytes[](returnCount);
        requestIds = new bytes32[](returnCount);
        timestamps = new uint256[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            uint256 index = totalResponses - returnCount + i;
            responses[i] = s_responseHistory[index];
            errors[i] = s_errorHistory[index];
            requestIds[i] = s_requestIdHistory[index];
            timestamps[i] = s_timestampHistory[index];
        }
        
        return (responses, errors, requestIds, timestamps);
    }
    
    /**
     * @notice Get all response history (use with caution for large arrays)
     * @return responses All response data
     * @return errors All error data
     * @return requestIds All request IDs
     * @return timestamps All timestamps
     */
    function getAllResponses() external view returns (
        bytes[] memory responses,
        bytes[] memory errors,
        bytes32[] memory requestIds,
        uint256[] memory timestamps
    ) {
        return (s_responseHistory, s_errorHistory, s_requestIdHistory, s_timestampHistory);
    }
} 