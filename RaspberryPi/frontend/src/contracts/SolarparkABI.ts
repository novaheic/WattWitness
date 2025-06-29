export const SOLARPARK_ABI = [
  {
    "inputs": [],
    "name": "totalReadingsProcessed",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLatestBatchInfo",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "requestId",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "merkleRoot",
        "type": "bytes32"
      },
      {
        "internalType": "uint32",
        "name": "totalReadings",
        "type": "uint32"
      },
      {
        "internalType": "uint256",
        "name": "totalBatches",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "responseLength",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalBatchesProcessed",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "latestRequestId",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "latestResponse",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "latestError",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint32",
        "name": "readingId",
        "type": "uint32"
      },
      {
        "indexed": true,
        "internalType": "uint32",
        "name": "timestamp",
        "type": "uint32"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "powerW",
        "type": "uint32"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "totalWh",
        "type": "uint32"
      }
    ],
    "name": "PowerReading",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "requestId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "merkleRoot",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "uint32",
        "name": "firstReadingId",
        "type": "uint32"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "readingCount",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "gasUsed",
        "type": "uint256"
      }
    ],
    "name": "BatchProcessed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "requestId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "bytes",
        "name": "response",
        "type": "bytes"
      },
      {
        "indexed": false,
        "internalType": "bytes",
        "name": "err",
        "type": "bytes"
      }
    ],
    "name": "ResponseReceived",
    "type": "event"
  }
]; 