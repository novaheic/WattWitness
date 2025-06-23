#!/usr/bin/env node

const WattWitnessIntegrationService = require('./WattWitnessIntegrationService');

// Configuration
const config = {
    installationId: 1
};

// Initialize and start the service
try {
    console.log('🚀 Starting WattWitness Blockchain Integration Service...');
    console.log('📋 Configuration:', config);
    
    const service = new WattWitnessIntegrationService(config);
    service.start();
    
    console.log('✅ Service started successfully!');
    console.log('🔄 Processing energy data every 5 minutes...');
    console.log('⏹️  Press Ctrl+C to stop');
    
} catch (error) {
    console.error('❌ Failed to start service:', error.message);
    process.exit(1);
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down WattWitness Integration Service...');
    console.log('✅ Service stopped gracefully');
    process.exit(0);
});

