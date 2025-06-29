# ABI snippet for WattWitnessDataLogger containing only the BatchProcessed event.
ABI = [
    {
        "anonymous": False,
        "inputs": [
            {
                "indexed": True,
                "internalType": "bytes32",
                "name": "requestId",
                "type": "bytes32",
            },
            {
                "indexed": True,
                "internalType": "bytes32",
                "name": "merkleRoot",
                "type": "bytes32",
            },
            {
                "indexed": True,
                "internalType": "uint32",
                "name": "firstReadingId",
                "type": "uint32",
            },
            {
                "indexed": False,
                "internalType": "uint16",
                "name": "readingCount",
                "type": "uint16",
            },
            {
                "indexed": False,
                "internalType": "uint256",
                "name": "gasUsed",
                "type": "uint256",
            },
        ],
        "name": "BatchProcessed",
        "type": "event",
    }
] 