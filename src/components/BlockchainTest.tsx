import React, { useState, useEffect } from 'react';
import { blockchainService } from '../services/blockchain';

export const BlockchainTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Testing blockchain connection...');
      const status = await blockchainService.testConnection();
      setConnectionStatus(status);
      
      if (status.connected) {
        console.log('Connection successful, fetching readings...');
        const latestReadings = await blockchainService.getLatestReadings(5);
        setReadings(latestReadings);
        console.log('Readings fetched:', latestReadings);
      }
    } catch (error) {
      console.error('Test failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow max-w-4xl">
      <h2 className="text-xl font-semibold mb-4">Blockchain Connection Test</h2>
      
      {loading && <p className="text-blue-600">Testing connection...</p>}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {connectionStatus && (
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <p className="font-medium">
            Status: {connectionStatus.connected ? '✅ Connected' : '❌ Failed'}
          </p>
          <p>Network: {connectionStatus.network}</p>
          <p>Readings Count: {connectionStatus.readingsCount}</p>
          <p>Contract: 0x7189D2b09691a8867056a228fb3e227e12E5B105</p>
        </div>
      )}
      
      {readings.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Latest Contract Readings:</h3>
          <div className="space-y-2">
            {readings.map((reading, index) => (
              <div key={index} className="border border-gray-200 rounded p-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Reading ID:</strong> {reading.readingId}
                  </div>
                  <div>
                    <strong>Power:</strong> {(parseInt(reading.powerW) / 1000).toFixed(1)}kW
                  </div>
                  <div>
                    <strong>Energy:</strong> {(parseInt(reading.totalEnergyWh) / 1000).toFixed(1)}kWh
                  </div>
                  <div>
                    <strong>Time:</strong> {new Date(reading.timestamp * 1000).toLocaleString()}
                  </div>
                </div>
                <div className="mt-2 text-xs">
                  <strong>Signature:</strong> 
                  <span className="font-mono break-all text-gray-600 ml-1">
                    {reading.signature.toString().substring(0, 50)}...
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <button 
        onClick={testConnection}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Testing...' : 'Test Connection'}
      </button>
      
      {connectionStatus?.connected && (
        <div className="mt-4 text-sm text-gray-600">
          <p>✅ Successfully connected to Avalanche Fuji testnet</p>
          <p>✅ Contract interface loaded</p>
          <p>✅ Ready to integrate with LatestRecords component</p>
        </div>
      )}
    </div>
  );
}; 