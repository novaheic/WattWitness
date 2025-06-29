import React from 'react';
import logo from '../assets/logo.png';
import { useInternetStatus } from '../hooks/usePowerData';
import { useBlockchainData } from '../hooks/useBlockchainData';

export const Header: React.FC = () => {
  // Get real internet connectivity status
  const { data: internetConnected = false, isLoading: internetLoading } = useInternetStatus();
  
  // Get blockchain data for refresh functionality
  const { refetch: refetchBlockchainData } = useBlockchainData();

  return (
    <header className="w-full pt-8">
      <div className="max-w-[1920px] w-full mx-auto px-24 lg:px-48 xl:px-64 2xl:px-80">
        <div className="h-24 flex items-center justify-between">
          <div className="flex items-center">
            <a 
              href="https://wattwitness.com/" 
              className="hover:opacity-100 transition-opacity cursor-pointer"
            >
              <img src={logo} alt="WattWitness" className="h-24 w-auto" />
            </a>
          </div>
          <div className="flex items-center space-x-6">
            <button 
              className="p-2 rounded-full bg-white hover:bg-[#E9EBEB] transition-colors group"
              style={{ outline: 'none', border: 'none' }}
              onFocus={(e) => e.target.style.outline = 'none'}
            >
              <svg className="h-5 w-5 text-gray-500 group-hover:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button 
              className="p-2 rounded-full bg-white hover:bg-[#E9EBEB] transition-colors group"
              style={{ outline: 'none', border: 'none' }}
              onFocus={(e) => e.target.style.outline = 'none'}
              onClick={refetchBlockchainData}
              title="Refresh blockchain data"
            >
              <svg className="h-5 w-5 text-gray-500 group-hover:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <div className="flex items-center space-x-2 px-4 py-2 rounded-[10px] bg-white">
              {internetLoading ? (
                // Loading state
                <div className="h-2.5 w-2.5 animate-pulse bg-gray-400 rounded-full"></div>
              ) : (
                // Status indicator
                <div className={`h-2.5 w-2.5 rounded-full ${internetConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              )}
              <span className={`text-sm font-medium ${internetLoading ? 'text-gray-400' : internetConnected ? 'text-gray-600' : 'text-red-500'}`}>
                {internetLoading ? 'Checking...' : internetConnected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}; 