from fastapi import APIRouter

from app.models.schemas import (
    MemoryManagementRequest,
    MemoryManagementResponse,
    PageReplacementRequest,
    PageReplacementResponse
)

from app.algorithms.memory_management.memory_management import (
    solve_memory_management,
    solve_page_replacement
)

router = APIRouter()

@router.post("/api/memory-management", response_model=MemoryManagementResponse)
def compute_memory_management(request: MemoryManagementRequest):
    return solve_memory_management(
        blocks=request.blocks,
        processes=request.processes,
        allocation_algorithm=request.allocationAlgorithm,
        scheduling_algorithm=request.schedulingAlgorithm,
        compaction=request.compaction
    )

@router.post("/api/page-replacement", response_model=PageReplacementResponse)
def compute_page_replacement(request: PageReplacementRequest):
    return solve_page_replacement(
        pages=request.pages,
        frames=request.frames,
        algorithm=request.algorithm
    )