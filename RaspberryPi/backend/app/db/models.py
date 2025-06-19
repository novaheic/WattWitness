from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class SolarInstallation(Base):
    __tablename__ = "solar_installations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    location = Column(String)
    capacity_kw = Column(Float)
    installation_date = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    public_key = Column(String, unique=True)  # For blockchain integration
    hardware_id = Column(String, unique=True)  # ID of the secure hardware
    
    # Relationships
    power_readings = relationship("PowerReading", back_populates="installation")
    tokens = relationship("Token", back_populates="installation")

class PowerReading(Base):
    __tablename__ = "power_readings"

    id = Column(Integer, primary_key=True, index=True)
    installation_id = Column(Integer, ForeignKey("solar_installations.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    power_kw = Column(Float)
    voltage_v = Column(Float)
    current_a = Column(Float)
    temperature_c = Column(Float)
    
    # Verification fields
    hardware_signature = Column(String)  # Signature from secure hardware
    is_verified = Column(Boolean, default=False)
    verification_timestamp = Column(DateTime)
    
    # Blockchain fields
    blockchain_tx_hash = Column(String, unique=True)  # Transaction hash on blockchain
    blockchain_block_number = Column(Integer)  # Block number where data is stored
    is_on_chain = Column(Boolean, default=False)
    
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

class PowerMeasurement(Base):
    __tablename__ = "power_measurements"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    power_value = Column(Float, nullable=False)
    device_id = Column(String, nullable=False)
    signature = Column(String, nullable=False)
    is_verified = Column(Boolean, default=False)

class SystemStatus(Base):
    __tablename__ = "system_status"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    device_id = Column(String, nullable=False)
    status = Column(String, nullable=False)  # online, offline, error
    details = Column(String, nullable=True)
    hardware_status = Column(String, nullable=True)  # Status of secure hardware
    last_verification = Column(DateTime, nullable=True)  # Last successful verification 