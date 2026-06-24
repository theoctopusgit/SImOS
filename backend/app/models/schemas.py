from pydantic import BaseModel, Field
from typing import List

class ProcessInput(BaseModel):
    id: str
    burstTime: int
    arrivalTime: int
    priority: int = 0

class CPUScheduleRequest(BaseModel):
    processes: List[ProcessInput]
    algorithm: str
    preemptive: bool = False
    quantum: int = 2

class GanttBlock(BaseModel):
    pid: str
    start: int
    end: int

class ProcessResult(BaseModel):
    id: str
    arrivalTime: int
    burstTime: int
    startTime: int
    completionTime: int
    waitingTime: int
    turnaroundTime: int
class CPUScheduleResponse(BaseModel):
    gantt: List[GanttBlock]
    details: List[ProcessResult]
    avgWaiting: float
    avgTurnaround: float

class CPUCompareRequest(BaseModel):
    processes: List[ProcessInput]
    quantum: int = 2

class CPUCompareResult(BaseModel):
    algorithm: str
    avgWaiting: float
    avgTurnaround: float

class CPUCompareResponse(BaseModel):
    results: List[CPUCompareResult]

class DiskScheduleRequest(BaseModel):
    head: int
    queue: List[int]
    algorithm: str
    maxTrack: int = 200
    direction: str = "towards-roof"

class SeekMovement(BaseModel):
    step: int
    from_track: int = Field(..., alias="from")
    to: int
    distance: int

class DiskScheduleResponse(BaseModel):
    sequence: List[int]
    movements: List[SeekMovement]
    totalMovement: int
    maxTrack: int

