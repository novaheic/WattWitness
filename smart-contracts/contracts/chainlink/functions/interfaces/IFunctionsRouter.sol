// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsResponse} from "../libraries/FunctionsResponse.sol";

/// @title Chainlink Functions Router interface.
interface IFunctionsRouter {
  /// @notice The identifier of the route to which the request is being sent.
  /// @dev Only the specified route can fulfill a request.
  /// @return id bytes32
  function getSupportedVersions() external view returns (string[] memory);

  /// @notice Initiates a Chainlink Functions request
  /// @param subscriptionId The subscription ID that will be charged to service the request
  /// @param data The CBOR encoded bytes data for a Functions request
  /// @param dataVersion The data version
  /// @param callbackGasLimit The amount of gas that will be available for the fulfillment callback
  /// @param donId An identifier used to determine which route to send the request along
  /// @return requestId The generated request ID for this request
  function sendRequest(
    uint64 subscriptionId,
    bytes calldata data,
    uint16 dataVersion,
    uint32 callbackGasLimit,
    bytes32 donId
  ) external returns (bytes32);

  /// @notice Sends a Chainlink Functions request to the proposed transmitter
  /// @param subscriptionId The subscription ID that will be charged to service the request
  /// @param data The CBOR encoded bytes data for a Functions request
  /// @param dataVersion The data version
  /// @param callbackGasLimit The amount of gas that will be available for the fulfillment callback
  /// @param donId An identifier used to determine which route to send the request along
  /// @return requestId The generated request ID for this request
  function sendRequestToProposed(
    uint64 subscriptionId,
    bytes calldata data,
    uint16 dataVersion,
    uint32 callbackGasLimit,
    bytes32 donId
  ) external returns (bytes32);

  /// @notice Fulfills a Chainlink Functions request
  /// @param response The response from the execution of the user's source code
  /// @param err The error from the execution of the user code or from the execution pipeline
  /// @param juelsPerGas The number of juels per gas used to calculate the payment amount
  /// @param costWithoutFulfillment The cost of the request without the fulfillment callback execution
  /// @param transmitter The address of the transmitter that fulfills the request
  /// @param requestId The request ID to fulfill
  /// @param callbackReturnData The return data from the fulfillment callback
  /// @param gasUsed The amount of gas used by the fulfillment callback
  /// @param status The fulfillment status
  function fulfill(
    bytes memory response,
    bytes memory err,
    uint96 juelsPerGas,
    uint96 costWithoutFulfillment,
    address transmitter,
    bytes32 requestId,
    bytes memory callbackReturnData,
    uint256 gasUsed,
    FunctionsResponse.FulfillResult status
  ) external;

  /// @notice Gets the current contract owner
  /// @return owner The current contract owner
  function owner() external view returns (address);

  /// @notice Gets the proposed contract owner
  /// @return proposed The proposed contract owner
  function proposed() external view returns (address);

  /// @notice Proposes a new contract owner
  /// @param newOwner The proposed new contract owner
  function proposeOwnershipTransfer(address newOwner) external;

  /// @notice Accepts the proposed contract owner
  function acceptOwnershipTransfer() external;

  /// @notice Gets the DON ID for a given route
  /// @param route The route to get the DON ID for
  /// @return donId The DON ID for the route
  function getContractById(bytes32 route) external view returns (address);

  /// @notice Gets the DON ID for a given route
  /// @param route The route to get the DON ID for
  /// @return donId The DON ID for the route
  function getProposedContractById(bytes32 route) external view returns (address);

  /// @notice Sets the DON ID for a given route
  /// @param route The route to set the DON ID for
  /// @param contractAddress The contract address for the route
  function setContractById(bytes32 route, address contractAddress) external;

  /// @notice Gets the DON ID for a given route
  /// @param route The route to get the DON ID for
  /// @return donId The DON ID for the route
  function getDonId(bytes32 route) external view returns (bytes32);

  /// @notice Sets the DON ID for a given route
  /// @param route The route to set the DON ID for
  /// @param donId The DON ID for the route
  function setDonId(bytes32 route, bytes32 donId) external;
} 