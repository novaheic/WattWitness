// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title WattWitness
 * @dev Smart contract for IoT energy monitoring with blockchain verification
 * @author WattWitness Team
 */
contract WattWitness {
    address public owner;
    mapping(uint256 => bool) public registeredDevices;
    mapping(uint256 => uint256) public deviceDataCount;
    
    struct EnergyReading {
        uint256 installationId;
        uint256 timestamp;
        uint256 powerConsumption;
        uint256 powerProduction;
        uint256 blockNumber;
        bytes signature;
    }
    
    mapping(uint256 => EnergyReading[]) public deviceReadings;
    
    event EnergyDataSubmitted(
        uint256 indexed installationId, 
        uint256 timestamp, 
        uint256 powerConsumption, 
        uint256 powerProduction
    );
    event DeviceRegistered(uint256 indexed installationId);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Register a new energy monitoring device
     * @param _installationId Unique identifier for the installation
     */
    function registerDevice(uint256 _installationId) external onlyOwner {
        registeredDevices[_installationId] = true;
        emit DeviceRegistered(_installationId);
    }
    
    /**
     * @dev Submit energy data from IoT device
     * @param _installationId Installation identifier
     * @param _timestamp Unix timestamp of the reading
     * @param _powerConsumption Power consumption in watts
     * @param _powerProduction Power production in watts
     * @param _signature Cryptographic signature from IoT device
     */
    function submitEnergyData(
        uint256 _installationId,
        uint256 _timestamp,
        uint256 _powerConsumption,
        uint256 _powerProduction,
        bytes memory _signature
    ) external onlyOwner {
        require(registeredDevices[_installationId], "Device not registered");
        require(_timestamp > 0, "Invalid timestamp");
        require(_powerConsumption >= 0, "Invalid power consumption");
        require(_powerProduction >= 0, "Invalid power production");
        
        EnergyReading memory reading = EnergyReading({
            installationId: _installationId,
            timestamp: _timestamp,
            powerConsumption: _powerConsumption,
            powerProduction: _powerProduction,
            blockNumber: block.number,
            signature: _signature
        });
        
        deviceReadings[_installationId].push(reading);
        deviceDataCount[_installationId]++;
        
        emit EnergyDataSubmitted(_installationId, _timestamp, _powerConsumption, _powerProduction);
    }
    
    /**
     * @dev Check if a device is registered
     * @param _installationId Installation identifier
     * @return bool Registration status
     */
    function isDeviceRegistered(uint256 _installationId) external view returns (bool) {
        return registeredDevices[_installationId];
    }
    
    /**
     * @dev Get device statistics
     * @param _installationId Installation identifier
     * @return lastTimestamp Last reading timestamp
     * @return totalConsumption Total power consumption
     * @return totalProduction Total power production
     */
    function getDeviceStats(uint256 _installationId) external view returns (
        uint256 lastTimestamp,
        uint256 totalConsumption,
        uint256 totalProduction
    ) {
        require(registeredDevices[_installationId], "Device not registered");
        
        EnergyReading[] memory readings = deviceReadings[_installationId];
        uint256 totalCons = 0;
        uint256 totalProd = 0;
        uint256 lastTime = 0;
        
        for (uint i = 0; i < readings.length; i++) {
            totalCons += readings[i].powerConsumption;
            totalProd += readings[i].powerProduction;
            if (readings[i].timestamp > lastTime) {
                lastTime = readings[i].timestamp;
            }
        }
        
        return (lastTime, totalCons, totalProd);
    }
    
    /**
     * @dev Get network information
     * @return networkName Name of the blockchain network
     * @return chainId Chain identifier
     */
    function getNetworkInfo() external view returns (string memory networkName, uint256 chainId) {
        return ("Avalanche Fuji Testnet", block.chainid);
    }
    
    /**
     * @dev Get total number of readings for a device
     * @param _installationId Installation identifier
     * @return count Number of readings
     */
    function getReadingCount(uint256 _installationId) external view returns (uint256 count) {
        return deviceDataCount[_installationId];
    }
}

