from fastapi import APIRouter
from app.models.schemas import DiskScheduleRequest, DiskScheduleResponse
from app.algorithms.mass_storage_management.mass_storage_management import solve_disk_scheduling

router = APIRouter()

@router.post("/api/disk-scheduling", response_model=DiskScheduleResponse)
def compute_disk_scheduling(request: DiskScheduleRequest):
    result = solve_disk_scheduling(
        head=request.head,
        queue=request.queue,
        algorithm=request.algorithm,
        max_track=request.maxTrack,
        direction=request.direction
    )
    return result
