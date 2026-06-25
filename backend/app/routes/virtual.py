from fastapi import APIRouter, HTTPException
from app.models.schemas import VirtualMemoryRequest, VirtualMemoryResponse
from app.algorithms.virtual_memory.virtual_memory import solve_virtual_memory

router = APIRouter()

VALID_ALGORITHMS = {"FIFO", "LRU", "OPT", "Clock", "SecondChance", "MFU"}


@router.post("/virtual-memory/simulate", response_model=VirtualMemoryResponse)
def simulate_virtual_memory(request: VirtualMemoryRequest):
    if request.page_size > request.memory_size:
        raise HTTPException(
            status_code=400,
            detail="page_size must be less than or equal to memory_size."
        )

    if not request.access_sequence:
        raise HTTPException(
            status_code=400,
            detail="access_sequence must not be empty."
        )

    if request.algorithm not in VALID_ALGORITHMS:
        raise HTTPException(
            status_code=400,
            detail=f"algorithm must be one of: {', '.join(sorted(VALID_ALGORITHMS))}."
        )

    result = solve_virtual_memory(
        memory_size=request.memory_size,
        page_size=request.page_size,
        algorithm=request.algorithm,
        access_sequence=request.access_sequence,
    )

    return result