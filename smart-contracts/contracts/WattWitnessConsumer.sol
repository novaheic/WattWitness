// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {FunctionsClient} from "./chainlink/functions/FunctionsClient.sol";
import {FunctionsRequest} from "./chainlink/functions/libraries/FunctionsRequest.sol";

/**
 * @title WattWitnessConsumer
 * @dev Chainlink Functions consumer for WattWitness energy data validation
 */
contract WattWitnessConsumer is FunctionsClient {
    using FunctionsRequest for FunctionsRequest.Request;
    
    address public owner;
    bytes32 public lastRequestId;
    bytes public lastResponse;
    bytes public lastError;
    
    // Chainlink Functions configuration
    uint64 public subscriptionId;
    uint32 public gasLimit = 300000;
    bytes32 public donId;
    
    event EnergyDataValidated(bytes32 indexed requestId, bytes response);
    event ValidationError(bytes32 indexed requestId, bytes error);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    constructor(
        address router,
        uint64 _subscriptionId,
        bytes32 _donId
    ) FunctionsClient(router) {
        owner = msg.sender;
        subscriptionId = _subscriptionId;
        donId = _donId;
    }
    
    /**
     * @dev Validate energy data using Chainlink Functions
     * @param source JavaScript source code for validation
     * @param args Arguments for the validation function
     */
    function validateEnergyData(
        string calldata source,
        string[] calldata args
    ) external onlyOwner {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        req.setArgs(args);
        
        lastRequestId = _sendRequest(req.encodeCBOR(), subscriptionId, gasLimit, donId);
    }
    
    /**
     * @dev Callback function for Chainlink Functions
     * @param requestId The request ID
     * @param response The response from the function
     * @param err Any error that occurred
     */
    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        lastRequestId = requestId;
        lastResponse = response;
        lastError = err;
        
        if (err.length > 0) {
            emit ValidationError(requestId, err);
        } else {
            emit EnergyDataValidated(requestId, response);
        }
    }
    
    /**
     * @dev Update gas limit
     * @param newGasLimit New gas limit
     */
    function updateGasLimit(uint32 newGasLimit) external onlyOwner {
        gasLimit = newGasLimit;
    }
    
    /**
     * @dev Get the last request details
     * @return requestId The last request ID
     * @return response The last response
     * @return error The last error
     */
    function getLastRequestDetails() external view returns (bytes32 requestId, bytes memory response, bytes memory error) {
        return (lastRequestId, lastResponse, lastError);
    }
}

