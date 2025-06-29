export const SOLARPARK_ABI = [
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
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newReadingsCount",
        "type": "uint256"
      }
    ],
    "name": "Response",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "getReadingsCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "count",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "count",
        "type": "uint256"
      }
    ],
    "name": "getLatestReadings",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "readingId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "powerW",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalEnergyWh",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "bytes",
            "name": "signature",
            "type": "bytes"
          }
        ],
        "internalType": "struct Solarpark.PowerReading[]",
        "name": "readings",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "getReadingAtIndex",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "readingId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "powerW",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalEnergyWh",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "bytes",
            "name": "signature",
            "type": "bytes"
          }
        ],
        "internalType": "struct Solarpark.PowerReading",
        "name": "reading",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]; 