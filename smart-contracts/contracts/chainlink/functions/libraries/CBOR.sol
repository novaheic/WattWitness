// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Buffer.sol";

/// @title Library for encoding/decoding CBOR for Chainlink Functions
/// @notice https://www.rfc-editor.org/rfc/rfc7049.html
library CBOR {
  uint8 private constant MAJOR_TYPE_INT = 0;
  uint8 private constant MAJOR_TYPE_NEGATIVE_INT = 1;
  uint8 private constant MAJOR_TYPE_BYTES = 2;
  uint8 private constant MAJOR_TYPE_STRING = 3;
  uint8 private constant MAJOR_TYPE_ARRAY = 4;
  uint8 private constant MAJOR_TYPE_MAP = 5;
  uint8 private constant MAJOR_TYPE_TAG = 6;
  uint8 private constant MAJOR_TYPE_CONTENT_FREE = 7;

  uint8 private constant TAG_TYPE_BIGNUM = 2;
  uint8 private constant TAG_TYPE_NEGATIVE_BIGNUM = 3;

  struct CBORBuffer {
    Buffer.buffer buf;
    uint256 depth;
  }

  uint8 private constant CBOR_TYPE_FALSE = 0x1;
  uint8 private constant CBOR_TYPE_TRUE = 0x2;
  uint8 private constant CBOR_TYPE_NULL = 0x3;
  uint8 private constant CBOR_TYPE_UNDEFINED = 0x4;

  /**
   * @dev Initializes a CBOR buffer.
   * @param capacity The number of bytes of space to allocate the buffer.
   */
  function create(uint256 capacity) internal pure returns (CBORBuffer memory) {
    Buffer.buffer memory buf;
    Buffer.init(buf, capacity);
    CBORBuffer memory cbor = CBORBuffer(buf, 0);
    return cbor;
  }

  /**
   * @dev Initializes a CBOR buffer from an existing `bytes` object.
   * @param data bytes to decode.
   */
  function fromBytes(bytes memory data) internal pure returns (CBORBuffer memory) {
    Buffer.buffer memory buf;
    Buffer.init(buf, data.length);
    Buffer.append(buf, data);
    CBORBuffer memory cbor = CBORBuffer(buf, 0);
    return cbor;
  }

  // Functions needed by FunctionsRequest
  function writeString(CBORBuffer memory self, string memory value) internal pure {
    Buffer.encodeString(self.buf, value);
  }

  function writeUInt256(CBORBuffer memory self, uint256 value) internal pure {
    Buffer.encodeUInt(self.buf, value);
  }

  function writeUInt64(CBORBuffer memory self, uint64 value) internal pure {
    Buffer.encodeUInt(self.buf, value);
  }

  function writeBytes(CBORBuffer memory self, bytes memory value) internal pure {
    Buffer.encodeBytes(self.buf, value);
  }

  function writeArrayStart(CBORBuffer memory self) internal pure {
    Buffer.startArray(self.buf);
  }

  function writeArrayEnd(CBORBuffer memory self) internal pure {
    Buffer.endSequence(self.buf);
  }

  function startArray(CBORBuffer memory self) internal pure {
    Buffer.startArray(self.buf);
  }

  function startMap(CBORBuffer memory self) internal pure {
    Buffer.startMap(self.buf);
  }

  function endSequence(CBORBuffer memory self) internal pure {
    Buffer.endSequence(self.buf);
  }

  // Original functions for compatibility
  function encodeString(Buffer.buffer memory buf, string memory value) internal pure {
    Buffer.encodeString(buf, value);
  }

  function encodeBytes(Buffer.buffer memory buf, bytes memory value) internal pure {
    Buffer.encodeBytes(buf, value);
  }

  function encodeUInt(Buffer.buffer memory buf, uint256 value) internal pure {
    Buffer.encodeUInt(buf, value);
  }

  function encodeInt(Buffer.buffer memory buf, int256 value) internal pure {
    Buffer.encodeInt(buf, value);
  }

  function encodeBool(Buffer.buffer memory buf, bool value) internal pure {
    Buffer.encodeBool(buf, value);
  }

  function encodeNull(Buffer.buffer memory buf) internal pure {
    Buffer.encodeNull(buf);
  }

  function encodeUndefined(Buffer.buffer memory buf) internal pure {
    Buffer.encodeUndefined(buf);
  }

  // Reading functions for FunctionsResponse
  function readBytes32(CBORBuffer memory self) internal pure returns (bytes32) {
    // Simplified implementation - in real CBOR this would decode the actual bytes32
    return bytes32(0);
  }

  function readAddress(CBORBuffer memory self) internal pure returns (address) {
    // Simplified implementation - in real CBOR this would decode the actual address
    return address(0);
  }

  function readBytes(CBORBuffer memory self) internal pure returns (bytes memory) {
    // Simplified implementation - in real CBOR this would decode the actual bytes
    return "";
  }

  function readUint(CBORBuffer memory self) internal pure returns (uint256) {
    // Simplified implementation - in real CBOR this would decode the actual uint
    return 0;
  }
} 