from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import cpu, mass_storage

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Usually specific origins like http://localhost:5173
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cpu.router)
app.include_router(mass_storage.router)

@app.get("/")
def home():
    return {"status": "ok"}