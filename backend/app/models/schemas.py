from pydantic import BaseModel
from typing import List, Optional

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

class MemoryBlockInput(BaseModel):
    id: str
    size: int


class MemoryProcessInput(BaseModel):
    id: str
    size: int
    arrivalTime: int = 0
    burstTime: int = 0
    priority: int = 0


class MemoryManagementRequest(BaseModel):
    blocks: List[MemoryBlockInput]
    processes: List[MemoryProcessInput]
    allocationAlgorithm: str
    schedulingAlgorithm: str
    compaction: bool = False


class MemoryAllocationResult(BaseModel):
    process: str
    size: int
    block: Optional[str]
    blockSize: Optional[int]
    status: str
    internalFragmentation: int


class MemoryBlockResult(BaseModel):
    id: str
    size: int
    remaining: int


class MemoryManagementResponse(BaseModel):
    allocations: List[MemoryAllocationResult]
    memoryBlocks: List[MemoryBlockResult]
    allocated: int
    totalProcesses: int
    internalFragmentation: int
    externalFragmentation: int

class PageReplacementRequest(BaseModel):
    pages: List[int]
    frames: int
    algorithm: str

class PageReplacementStep(BaseModel):
    step: int
    page: int
    frames: List[Optional[int]]
    pageFault: bool
    replacedPage: Optional[int] = None

class PageReplacementResponse(BaseModel):
    algorithm: str
    totalPageFaults: int
    totalHits: int
    steps: List[PageReplacementStep]