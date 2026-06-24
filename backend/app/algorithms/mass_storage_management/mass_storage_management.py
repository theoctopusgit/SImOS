import math
from typing import List, Dict, Any

def run_fcfs(head: int, queue: List[int]) -> List[int]:
    return [head] + queue

def run_sstf(head: int, queue: List[int]) -> List[int]:
    pending = list(queue)
    sequence = [head]
    current = head

    while len(pending) > 0:
        best_index = 0
        best_distance = abs(pending[0] - current)

        for i in range(1, len(pending)):
            distance = abs(pending[i] - current)
            if distance < best_distance:
                best_distance = distance
                best_index = i

        next_val = pending.pop(best_index)
        sequence.append(next_val)
        current = next_val

    return sequence

def run_scan(head: int, queue: List[int], max_val: int, direction: str) -> List[int]:
    DISK_MIN = 0
    left = sorted([v for v in queue if v < head], reverse=True)
    right = sorted([v for v in queue if v >= head])

    if direction == "towards-roof":
        sequence = [head] + right
        if not sequence or sequence[-1] != max_val:
            sequence.append(max_val)
        return sequence + left
    else:
        sequence = [head] + left
        if not sequence or sequence[-1] != DISK_MIN:
            sequence.append(DISK_MIN)
        return sequence + right

def run_cscan(head: int, queue: List[int], max_val: int, direction: str) -> List[int]:
    DISK_MIN = 0
    left_asc = sorted([v for v in queue if v < head])
    right_asc = sorted([v for v in queue if v >= head])
    left_desc = list(reversed(left_asc))
    right_desc = list(reversed(right_asc))

    if direction == "towards-roof":
        sequence = [head] + right_asc
        if not sequence or sequence[-1] != max_val:
            sequence.append(max_val)
        sequence.append(DISK_MIN)
        return sequence + left_asc
    else:
        sequence = [head] + left_desc
        if not sequence or sequence[-1] != DISK_MIN:
            sequence.append(DISK_MIN)
        sequence.append(max_val)
        return sequence + right_desc

def run_look(head: int, queue: List[int], direction: str) -> List[int]:
    left = sorted([v for v in queue if v < head], reverse=True)
    right = sorted([v for v in queue if v >= head])

    if direction == "towards-roof":
        return [head] + right + left
    else:
        return [head] + left + right

def run_clook(head: int, queue: List[int], direction: str) -> List[int]:
    left = sorted([v for v in queue if v < head])
    right = sorted([v for v in queue if v >= head])

    if direction == "towards-roof":
        return [head] + right + left
    else:
        return [head] + left + right

def build_movements(sequence: List[int]) -> List[Dict[str, Any]]:
    steps = []
    for i in range(len(sequence) - 1):
        from_val = sequence[i]
        to_val = sequence[i + 1]
        steps.append({
            "step": i + 1,
            "from": from_val,
            "to": to_val,
            "distance": abs(to_val - from_val)
        })
    return steps

def compute_sequence(algorithm: str, head: int, queue: List[int], max_val: int, direction: str) -> List[int]:
    if not queue:
        return [head]
        
    if algorithm == "SSTF":
        return run_sstf(head, queue)
    elif algorithm == "SCAN":
        return run_scan(head, queue, max_val, direction)
    elif algorithm == "C-SCAN":
        return run_cscan(head, queue, max_val, direction)
    elif algorithm == "LOOK":
        return run_look(head, queue, direction)
    elif algorithm == "C-LOOK":
        return run_clook(head, queue, direction)
    elif algorithm == "FCFS":
        return run_fcfs(head, queue)
    else:
        return run_fcfs(head, queue)

def solve_disk_scheduling(head: int, queue: List[int], algorithm: str, max_track: int, direction: str) -> Dict[str, Any]:
    # Determine the actual computed max track
    max_input = max([head] + queue) if queue else head
    computed_max_track = int(math.ceil(max_input / 50.0) * 50) if max_input > max_track else max_track
    
    sequence = compute_sequence(algorithm, head, queue, computed_max_track, direction)
    movements = build_movements(sequence)
    total_movement = sum(m["distance"] for m in movements)
    
    return {
        "sequence": sequence,
        "movements": movements,
        "totalMovement": total_movement,
        "maxTrack": computed_max_track
    }
