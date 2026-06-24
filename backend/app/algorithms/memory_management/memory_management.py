def order_processes(processes, algorithm):
    if algorithm == "Shortest Job First":
        return sorted(processes, key=lambda p: (p.burstTime, p.arrivalTime))

    if algorithm == "Priority Scheduling":
        return sorted(processes, key=lambda p: (p.priority, p.arrivalTime))

    return sorted(processes, key=lambda p: p.arrivalTime)


def find_block(memory_blocks, process_size, algorithm, next_index):
    available = [
        (i, b) for i, b in enumerate(memory_blocks)
        if b["remaining"] >= process_size
    ]

    if not available:
        return None, next_index

    if algorithm == "Best Fit":
        return min(available, key=lambda x: x[1]["remaining"])

    if algorithm == "Worst Fit":
        return max(available, key=lambda x: x[1]["remaining"])

    if algorithm == "Next Fit":
        n = len(memory_blocks)
        for offset in range(n):
            i = (next_index + offset) % n
            if memory_blocks[i]["remaining"] >= process_size:
                return (i, memory_blocks[i])

    return available[0]


def solve_memory_management(
    blocks,
    processes,
    allocation_algorithm,
    scheduling_algorithm,
    compaction=False
):
    memory_blocks = [
        {
            "id": b.id,
            "size": b.size,
            "remaining": b.size
        }
        for b in blocks
    ]

    ordered_processes = order_processes(processes, scheduling_algorithm)

    allocations = []
    total_internal = 0
    next_index = 0

    for process in ordered_processes:
        selected = find_block(
            memory_blocks,
            process.size,
            allocation_algorithm,
            next_index
        )

        if selected is not None:
            block_index, block = selected
            frag = block["remaining"] - process.size

            allocations.append({
                "process": process.id,
                "size": process.size,
                "block": block["id"],
                "blockSize": block["size"],
                "status": "Allocated",
                "internalFragmentation": frag
            })

            total_internal += frag
            block["remaining"] = 0
            next_index = (block_index + 1) % len(memory_blocks)

        else:
            total_free = sum(b["remaining"] for b in memory_blocks)

            if compaction and total_free >= process.size:
                frag = total_free - process.size

                allocations.append({
                    "process": process.id,
                    "size": process.size,
                    "block": "Compacted Space",
                    "blockSize": total_free,
                    "status": "Allocated",
                    "internalFragmentation": frag
                })

                total_internal += frag

                for b in memory_blocks:
                    b["remaining"] = 0

            else:
                allocations.append({
                    "process": process.id,
                    "size": process.size,
                    "block": None,
                    "blockSize": None,
                    "status": "Waiting",
                    "internalFragmentation": 0
                })

    external = 0 if compaction else sum(b["remaining"] for b in memory_blocks)

    return {
        "allocations": allocations,
        "memoryBlocks": memory_blocks,
        "allocated": len([a for a in allocations if a["status"] == "Allocated"]),
        "totalProcesses": len(processes),
        "internalFragmentation": total_internal,
        "externalFragmentation": external
    }


def solve_page_replacement(pages, frames, algorithm):
    memory = []
    steps = []
    faults = 0
    hits = 0
    recent = []

    for i, page in enumerate(pages):
        replaced = None
        fault = page not in memory

        if not fault:
            hits += 1
            if page in recent:
                recent.remove(page)
            recent.append(page)

        else:
            faults += 1

            if len(memory) < frames:
                memory.append(page)
            else:
                if algorithm == "LRU":
                    replaced = recent.pop(0)
                    memory[memory.index(replaced)] = page

                elif algorithm == "Optimal":
                    future = pages[i + 1:]
                    farthest_index = -1
                    replace_index = 0

                    for idx, current in enumerate(memory):
                        if current not in future:
                            replace_index = idx
                            break
                        next_use = future.index(current)
                        if next_use > farthest_index:
                            farthest_index = next_use
                            replace_index = idx

                    replaced = memory[replace_index]
                    memory[replace_index] = page

                else:
                    replaced = memory.pop(0)
                    memory.append(page)

            if page in recent:
                recent.remove(page)
            recent.append(page)

        frame_snapshot = memory.copy()
        while len(frame_snapshot) < frames:
            frame_snapshot.append(None)

        steps.append({
            "step": i + 1,
            "page": page,
            "frames": frame_snapshot,
            "pageFault": fault,
            "replacedPage": replaced
        })

    return {
        "algorithm": algorithm,
        "totalPageFaults": faults,
        "totalHits": hits,
        "steps": steps
    }