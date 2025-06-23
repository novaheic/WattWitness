// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IWattWitness
 * @dev Interface for WattWitness energy monitoring contract
 */
interface IWattWitness {
    struct EnergyReading {
        uint256 installationId;
        uint256 timestamp;
        uint256 powerConsumption;
        uint256 powerProduction;
        uint256 blockNumber;
        bytes signature;
    }
    
    event EnergyDataSubmitted(
        uint256 indexed installationId, 
        uint256 timestamp, 
        uint256 powerConsumption, 
        uint256 powerProduction
    );
    
    event DeviceRegistered(uint256 indexed installationId);
    
    function registerDevice(uint256 _installationId) external;
    
    function submitEnergyData(
        uint256 _installationId,
        uint256 _timestamp,
        uint256 _powerConsumption,
        uint256 _powerProduction,
        bytes memory _signature
    ) external;
    
    function isDeviceRegistered(uint256 _installationId) external view returns (bool);
    
    function getDeviceStats(uint256 _installationId) external view returns (
        uint256 lastTimestamp,
        uint256 totalConsumption,
        uint256 totalProduction
    );
    
    function getNetworkInfo() external view returns (string memory networkName, uint256 chainId);
    
    function getReadingCount(uint256 _installationId) external view returns (uint256 count);
}

