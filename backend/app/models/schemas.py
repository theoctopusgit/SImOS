from pydantic import BaseModel
from typing import List, Optional
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

# ── Virtual Memory ────────────────────────────────────

class VirtualMemoryRequest(BaseModel):
    memory_size: int
    page_size: int
    algorithm: str
    access_sequence: List[int]

class VMPageTableEntry(BaseModel):
    page: int
    frame: Optional[int]
    status: str

class VMTLBEntry(BaseModel):
    page: int
    frame: int
    lastAccess: int

class VMFrameCell(BaseModel):
    page: Optional[int]

class VMAccessLogEntry(BaseModel):
    step: int
    page: int
    tlbHit: bool
    pageFault: bool
    framesSnapshot: List[Optional[int]]

class VirtualMemoryResponse(BaseModel):
    pageTable: List[VMPageTableEntry]
    tlb: List[VMTLBEntry]
    frames: List[VMFrameCell]
    pageFaults: int
    tlbHits: int
    tlbMisses: int
    hitRatio: float
    accessLog: List[VMAccessLogEntry]