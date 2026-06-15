from fastapi import APIRouter
from app.models.schemas import CPUScheduleRequest, CPUScheduleResponse
from app.algorithms.cpu_scheduling.cpu_scheduling import solve_cpu_scheduling

router = APIRouter()

@router.post("/api/cpu-scheduling", response_model=CPUScheduleResponse)
def compute_cpu_scheduling(request: CPUScheduleRequest):
    result = solve_cpu_scheduling(
        processes=request.processes,
        algorithm=request.algorithm,
        preemptive=request.preemptive,
        quantum=request.quantum
    )
    return result
