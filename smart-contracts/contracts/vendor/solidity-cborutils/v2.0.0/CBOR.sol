// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Buffer.sol";

/**
 * @dev A library for populating CBOR encoded payloads.
 */
library CBOR {
    struct CBORBuffer {
        Buffer.buffer buf;
        uint256 depth;
    }

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
} 