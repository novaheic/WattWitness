from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Boolean, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class SolarInstallation(Base):
    __tablename__ = "solar_installations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)  # e.g., "Hackathon Test 1"
    shelly_mac = Column(String, unique=True)  # MAC address from ShellyEM
    public_key = Column(String, unique=True)  # Public key from ESP32
    last_boot_timestamp = Column(BigInteger)  # Unix timestamp of last ESP32 boot/reset
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    power_readings = relationship("PowerReading", back_populates="installation")
    tokens = relationship("Token", back_populates="installation")

class PowerReading(Base):
    __tablename__ = "power_readings"

    id = Column(Integer, primary_key=True, index=True)
    installation_id = Column(Integer, ForeignKey("solar_installations.id"))
    power_w = Column(Float)  # Power in watts (from ESP32)
    total_wh = Column(Float)  # Total energy in watt-hours (from ESP32)
    timestamp = Column(BigInteger)  # Unix timestamp (from ESP32)
    signature = Column(String)  # Cryptographic signature (from ESP32)
    
    # Verification fields
    is_verified = Column(Boolean, default=False)
    verification_timestamp = Column(DateTime)
    
    # Blockchain fields
    blockchain_tx_hash = Column(String)  # Transaction hash on blockchain (not unique - multiple readings can share same TX)
    blockchain_block_number = Column(Integer)  # Block number where data is stored
    is_on_chain = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    installation = relationship("SolarInstallation", back_populates="power_readings")

class Token(Base):
    __tablename__ = "tokens"

    id = Column(Integer, primary_key=True, index=True)
    installation_id = Column(Integer, ForeignKey("solar_installations.id"))
    token_id = Column(String, unique=True)  # Blockchain token ID
    amount = Column(Float)  # Amount of tokens
    minting_date = Column(DateTime, default=datetime.utcnow)
    transaction_hash = Column(String)  # Blockchain transaction hash
    
    # Relationships
    installation = relationship("SolarInstallation", back_populates="tokens") 