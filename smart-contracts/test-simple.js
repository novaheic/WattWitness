// Minimal test function for Chainlink Functions
// No HTTP requests, just returns a simple string

console.log("Starting minimal test function...");

try {
    // Simple test data
    const testData = {
        message: "Hello from Chainlink Functions",
        timestamp: Math.floor(Date.now() / 1000),
        count: 42
    };
    
    console.log("Test data created:", JSON.stringify(testData));
    
    // Return as bytes using TextEncoder
    const result = new TextEncoder().encode(JSON.stringify(testData));
    
    console.log("Encoded result length:", result.length);
    
    return result;
    
} catch (error) {
    console.error("Error in test function:", error.message);
    throw new Error(`Test function failed: ${error.message}`);
} 