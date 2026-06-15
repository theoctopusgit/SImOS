from fastapi import APIRouter
from app.models.schemas import CPUScheduleRequest, CPUScheduleResponse, CPUCompareRequest, CPUCompareResponse, CPUCompareResult
from app.algorithms.cpu_scheduling.cpu_scheduling import solve_cpu_scheduling

router = APIRouter()

@router.post("/api/cpu-scheduling", response_model=CPUScheduleResponse)
def compute_cpu_scheduling(request: CPUScheduleRequest):
    result = solve_cpu_scheduling(
        processes=[p.model_dump() for p in request.processes],
        algorithm=request.algorithm,
        preemptive=request.preemptive,
        quantum=request.quantum
    )
    return result

@router.post("/api/cpu-scheduling/compare", response_model=CPUCompareResponse)
def compare_cpu_scheduling(request: CPUCompareRequest):
    configs = [
        ("First Come First Serve", False),
        ("Shortest Job First", False),
        ("Shortest Job First", True),
        ("Round Robin", False),
        ("Priority Scheduling", False),
        ("Priority Scheduling", True)
    ]
    
    results = []
    process_dicts = [p.model_dump() for p in request.processes]
    for algo, preemp in configs:
        res = solve_cpu_scheduling(
            processes=process_dicts,
            algorithm=algo,
            preemptive=preemp,
            quantum=request.quantum
        )
        
        name = algo
        if algo in ["Shortest Job First", "Priority Scheduling"]:
            name += " (Preemptive)" if preemp else " (Non-preemptive)"
            
        results.append(CPUCompareResult(
            algorithm=name,
            avgWaiting=res['avgWaiting'],
            avgTurnaround=res['avgTurnaround']
        ))
        
    return CPUCompareResponse(results=results)
