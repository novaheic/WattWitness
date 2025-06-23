const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WattWitness", function () {
    let wattWitness;
    let owner;
    let addr1;
    
    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();
        
        const WattWitness = await ethers.getContractFactory("WattWitness");
        wattWitness = await WattWitness.deploy();
        await wattWitness.deployed();
    });
    
    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await wattWitness.owner()).to.equal(owner.address);
        });
        
        it("Should return correct network info", async function () {
            const [networkName, chainId] = await wattWitness.getNetworkInfo();
            expect(networkName).to.equal("Avalanche Fuji Testnet");
            expect(chainId).to.equal(31337); // Hardhat network chain ID
        });
    });
    
    describe("Device Registration", function () {
        it("Should register a device", async function () {
            await wattWitness.registerDevice(1);
            expect(await wattWitness.isDeviceRegistered(1)).to.be.true;
        });
        
        it("Should emit DeviceRegistered event", async function () {
            await expect(wattWitness.registerDevice(1))
                .to.emit(wattWitness, "DeviceRegistered")
                .withArgs(1);
        });
        
        it("Should only allow owner to register devices", async function () {
            await expect(wattWitness.connect(addr1).registerDevice(1))
                .to.be.revertedWith("Only owner can call this function");
        });
    });
    
    describe("Energy Data Submission", function () {
        beforeEach(async function () {
            await wattWitness.registerDevice(1);
        });
        
        it("Should submit energy data", async function () {
            const timestamp = Math.floor(Date.now() / 1000);
            const signature = ethers.utils.toUtf8Bytes("test_signature");
            
            await wattWitness.submitEnergyData(1, timestamp, 100, 50, signature);
            
            const count = await wattWitness.getReadingCount(1);
            expect(count).to.equal(1);
        });
        
        it("Should emit EnergyDataSubmitted event", async function () {
            const timestamp = Math.floor(Date.now() / 1000);
            const signature = ethers.utils.toUtf8Bytes("test_signature");
            
            await expect(wattWitness.submitEnergyData(1, timestamp, 100, 50, signature))
                .to.emit(wattWitness, "EnergyDataSubmitted")
                .withArgs(1, timestamp, 100, 50);
        });
        
        it("Should reject data for unregistered device", async function () {
            const timestamp = Math.floor(Date.now() / 1000);
            const signature = ethers.utils.toUtf8Bytes("test_signature");
            
            await expect(wattWitness.submitEnergyData(2, timestamp, 100, 50, signature))
                .to.be.revertedWith("Device not registered");
        });
        
        it("Should only allow owner to submit data", async function () {
            const timestamp = Math.floor(Date.now() / 1000);
            const signature = ethers.utils.toUtf8Bytes("test_signature");
            
            await expect(wattWitness.connect(addr1).submitEnergyData(1, timestamp, 100, 50, signature))
                .to.be.revertedWith("Only owner can call this function");
        });
    });
    
    describe("Device Statistics", function () {
        beforeEach(async function () {
            await wattWitness.registerDevice(1);
        });
        
        it("Should return correct device stats", async function () {
            const timestamp1 = Math.floor(Date.now() / 1000);
            const timestamp2 = timestamp1 + 300; // 5 minutes later
            const signature = ethers.utils.toUtf8Bytes("test_signature");
            
            await wattWitness.submitEnergyData(1, timestamp1, 100, 50, signature);
            await wattWitness.submitEnergyData(1, timestamp2, 150, 75, signature);
            
            const [lastTimestamp, totalConsumption, totalProduction] = await wattWitness.getDeviceStats(1);
            
            expect(lastTimestamp).to.equal(timestamp2);
            expect(totalConsumption).to.equal(250); // 100 + 150
            expect(totalProduction).to.equal(125);  // 50 + 75
        });
        
        it("Should reject stats for unregistered device", async function () {
            await expect(wattWitness.getDeviceStats(2))
                .to.be.revertedWith("Device not registered");
        });
    });
});

