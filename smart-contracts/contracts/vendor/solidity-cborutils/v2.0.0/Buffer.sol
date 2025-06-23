// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev A simple buffer implementation for manipulating byte arrays.
 */
library Buffer {
    struct buffer {
        bytes buf;
        uint256 capacity;
    }

    function init(buffer memory buf, uint256 capacity) internal pure {
        buf.capacity = capacity;
        buf.buf = new bytes(capacity);
    }

    function append(buffer memory buf, bytes memory data) internal pure {
        uint256 len = data.length;
        uint256 off = buf.buf.length;
        resize(buf, off + len);
        
        // Copy data to the buffer
        for (uint256 i = 0; i < len; i++) {
            buf.buf[off + i] = data[i];
        }
    }

    function resize(buffer memory buf, uint256 capacity) private pure {
        if (capacity > buf.capacity) {
            bytes memory oldbuf = buf.buf;
            uint256 newCapacity = capacity * 2;
            buf.buf = new bytes(newCapacity);
            buf.capacity = newCapacity;
            
            // Copy old data
            for (uint256 i = 0; i < oldbuf.length; i++) {
                buf.buf[i] = oldbuf[i];
            }
        }
    }

    function encodeString(buffer memory buf, string memory value) internal pure {
        append(buf, bytes(value));
    }

    function encodeBytes(buffer memory buf, bytes memory value) internal pure {
        append(buf, value);
    }

    function encodeUInt(buffer memory buf, uint256 value) internal pure {
        // Simple encoding for demonstration
        append(buf, abi.encodePacked(value));
    }

    function encodeInt(buffer memory buf, int256 value) internal pure {
        append(buf, abi.encodePacked(value));
    }

    function encodeBool(buffer memory buf, bool value) internal pure {
        append(buf, abi.encodePacked(value));
    }

    function encodeNull(buffer memory buf) internal pure {
        // No-op for demonstration
    }

    function encodeUndefined(buffer memory buf) internal pure {
        // No-op for demonstration
    }

    function startArray(buffer memory buf) internal pure {
        // Add array start marker (0x9F for indefinite-length array)
        append(buf, hex"9F");
    }

    function startMap(buffer memory buf) internal pure {
        // Add map start marker (0xBF for indefinite-length map)
        append(buf, hex"BF");
    }

    function endSequence(buffer memory buf) internal pure {
        // Add break marker (0xFF) to end indefinite-length sequence
        append(buf, hex"FF");
    }
} 