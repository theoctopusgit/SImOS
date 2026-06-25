import math
from typing import List, Optional, Dict, Any

TLB_SIZE = 4


def _simulate_tlb(pages: List[int], fault_log: List[Dict]) -> Dict:
    """Simulate TLB (LRU eviction, size 4) alongside a pre-computed fault log."""
    tlb_map: Dict[int, int] = {}   # page -> frame
    tlb_order: List[int] = []       # LRU order
    tlb_hits = 0
    tlb_misses = 0
    access_log = []

    for i, page in enumerate(pages):
        is_fault = fault_log[i]["fault"]
        snap = fault_log[i]["snap"]

        if page in tlb_map:
            tlb_hits += 1
            tlb_order.remove(page)
            tlb_order.append(page)
            tlb_hit = True
        else:
            tlb_misses += 1
            tlb_hit = False
            frame = snap.index(page) if page in snap else -1
            if frame != -1:
                if len(tlb_order) >= TLB_SIZE:
                    evicted = tlb_order.pop(0)
                    del tlb_map[evicted]
                tlb_map[page] = frame
                tlb_order.append(page)

        access_log.append({
            "step": i + 1,
            "page": page,
            "tlbHit": tlb_hit,
            "pageFault": is_fault,
            "framesSnapshot": list(snap),
        })

    # Final TLB state
    tlb_entries = [
        {"page": p, "frame": tlb_map[p], "lastAccess": idx + 1}
        for idx, p in enumerate(tlb_order)
    ]

    return {
        "tlbHits": tlb_hits,
        "tlbMisses": tlb_misses,
        "tlbEntries": tlb_entries,
        "accessLog": access_log,
    }


# ── FIFO ──────────────────────────────────────────────
def _run_fifo(pages: List[int], num_frames: int) -> Dict:
    frames: List[Optional[int]] = [None] * num_frames
    queue: List[int] = []
    faults = 0
    log = []

    for page in pages:
        if page in frames:
            log.append({"page": page, "fault": False, "snap": list(frames)})
        else:
            faults += 1
            if len(queue) < num_frames:
                idx = frames.index(None)
                frames[idx] = page
                queue.append(page)
            else:
                evict = queue.pop(0)
                idx = frames.index(evict)
                frames[idx] = page
                queue.append(page)
            log.append({"page": page, "fault": True, "snap": list(frames)})

    return {"frames": frames, "faults": faults, "log": log}


# ── LRU ───────────────────────────────────────────────
def _run_lru(pages: List[int], num_frames: int) -> Dict:
    frames: List[Optional[int]] = [None] * num_frames
    recency: List[int] = []
    faults = 0
    log = []

    for page in pages:
        if page in frames:
            recency.remove(page)
            recency.append(page)
            log.append({"page": page, "fault": False, "snap": list(frames)})
        else:
            faults += 1
            if None in frames:
                frames[frames.index(None)] = page
            else:
                lru = recency.pop(0)
                frames[frames.index(lru)] = page
            recency.append(page)
            log.append({"page": page, "fault": True, "snap": list(frames)})

    return {"frames": frames, "faults": faults, "log": log}


# ── OPT ───────────────────────────────────────────────
def _run_opt(pages: List[int], num_frames: int) -> Dict:
    frames: List[Optional[int]] = [None] * num_frames
    faults = 0
    log = []

    for i, page in enumerate(pages):
        if page in frames:
            log.append({"page": page, "fault": False, "snap": list(frames)})
        else:
            faults += 1
            if None in frames:
                frames[frames.index(None)] = page
            else:
                future = []
                for f in frames:
                    try:
                        next_use = pages.index(f, i + 1)
                    except ValueError:
                        next_use = float("inf")
                    future.append(next_use)
                evict_idx = future.index(max(future))
                frames[evict_idx] = page
            log.append({"page": page, "fault": True, "snap": list(frames)})

    return {"frames": frames, "faults": faults, "log": log}


# ── Clock ─────────────────────────────────────────────
def _run_clock(pages: List[int], num_frames: int) -> Dict:
    frames: List[Optional[int]] = [None] * num_frames
    ref_bits = [False] * num_frames
    pointer = 0
    faults = 0
    log = []

    for page in pages:
        if page in frames:
            ref_bits[frames.index(page)] = True
            log.append({"page": page, "fault": False, "snap": list(frames)})
        else:
            faults += 1
            while ref_bits[pointer]:
                ref_bits[pointer] = False
                pointer = (pointer + 1) % num_frames
            frames[pointer] = page
            ref_bits[pointer] = True
            pointer = (pointer + 1) % num_frames
            log.append({"page": page, "fault": True, "snap": list(frames)})

    return {"frames": frames, "faults": faults, "log": log}


# ── MFU ───────────────────────────────────────────────
def _run_mfu(pages: List[int], num_frames: int) -> Dict:
    frames: List[Optional[int]] = [None] * num_frames
    freq: Dict[int, int] = {}       # page -> access count
    load_order: Dict[int, int] = {} # page -> step it was loaded (for tie-breaking)
    faults = 0
    log = []

    for step, page in enumerate(pages):
        freq[page] = freq.get(page, 0) + 1

        if page in frames:
            log.append({"page": page, "fault": False, "snap": list(frames)})
        else:
            faults += 1
            if None in frames:
                idx = frames.index(None)
                frames[idx] = page
                load_order[page] = step
            else:
                # Evict the most frequently used; tie-break by earliest load
                evict = max(
                    (f for f in frames if f is not None),
                    key=lambda p: (freq.get(p, 0), -load_order.get(p, 0))
                )
                frames[frames.index(evict)] = page
                load_order[page] = step
            log.append({"page": page, "fault": True, "snap": list(frames)})

    return {"frames": frames, "faults": faults, "log": log}


# ── Dispatcher ────────────────────────────────────────
def solve_virtual_memory(
    memory_size: int,
    page_size: int,
    algorithm: str,
    access_sequence: List[int],
) -> Dict[str, Any]:
    num_frames = max(1, math.floor(memory_size / page_size))
    pages = access_sequence

    algo_map = {
        "FIFO": _run_fifo,
        "LRU": _run_lru,
        "OPT": _run_opt,
        "Clock": _run_clock,
        "SecondChance": _run_clock,   # identical behaviour
        "MFU": _run_mfu,
    }

    result = algo_map[algorithm](pages, num_frames)
    frames_raw = result["frames"]
    faults = result["faults"]
    fault_log = result["log"]

    tlb_data = _simulate_tlb(pages, fault_log)

    # Page table (unique pages, sorted)
    unique_pages = sorted(set(pages))
    page_table = []
    for p in unique_pages:
        frame_idx = frames_raw.index(p) if p in frames_raw else None
        page_table.append({
            "page": p,
            "frame": frame_idx,
            "status": "Present" if frame_idx is not None else "Not Loaded",
        })

    # Frames final state
    frames_out = [{"page": p} for p in frames_raw]

    total = tlb_data["tlbHits"] + tlb_data["tlbMisses"]
    hit_ratio = (tlb_data["tlbHits"] / total * 100) if total > 0 else 0.0

    return {
        "pageTable": page_table,
        "tlb": tlb_data["tlbEntries"],
        "frames": frames_out,
        "pageFaults": faults,
        "tlbHits": tlb_data["tlbHits"],
        "tlbMisses": tlb_data["tlbMisses"],
        "hitRatio": hit_ratio,
        "accessLog": tlb_data["accessLog"],
    }