import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx
from app.api.endpoints import power
from app.db.database import engine
from app.db.models import Base

# Create database tables
Base.metadata.create_all(bind=engine)

# Configuration
TUNNEL_URL = os.getenv("TUNNEL_URL", "https://wattwitness.loca.lt")

app = FastAPI(
    title="WattWitness Backend",
    description="Backend for WattWitness solar power monitoring system",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(power.router, prefix="/api/v1", tags=["power"])

@app.get("/")
async def root():
    return {"message": "Welcome to WattWitness Backend"}

@app.get("/health")
@app.head("/health")
async def health_check():
    return {"status": "healthy", "tunnel_url": TUNNEL_URL}

@app.get("/tunnel-status")
async def tunnel_status():
    """
    Endpoint to check tunnel connectivity status
    Useful for debugging tunnel issues
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{TUNNEL_URL}/health")
            return {
                "tunnel_url": TUNNEL_URL,
                "status": "connected",
                "response_code": response.status_code,
                "response_time": response.elapsed.total_seconds(),
                "monitoring": "UptimeRobot external monitoring active"
            }
    except Exception as e:
        return {
            "tunnel_url": TUNNEL_URL,
            "status": "disconnected",
            "error": str(e),
            "monitoring": "UptimeRobot external monitoring active"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 