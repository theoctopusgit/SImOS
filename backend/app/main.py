from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import cpu, memory, mass_storage, virtual

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cpu.router)
app.include_router(memory.router)
app.include_router(mass_storage.router)
app.include_router(virtual.router)

@app.get("/")
def home():
    return {"status": "ok"}