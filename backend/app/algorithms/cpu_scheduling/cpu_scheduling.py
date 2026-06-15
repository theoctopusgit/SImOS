def format_result(gantt, process_stats, n_processes):
    avg_waiting = sum(p['waitingTime'] for p in process_stats.values()) / n_processes if n_processes > 0 else 0
    avg_turnaround = sum(p['turnaroundTime'] for p in process_stats.values()) / n_processes if n_processes > 0 else 0
    return {
        "gantt": gantt,
        "details": list(process_stats.values()),
        "avgWaiting": avg_waiting,
        "avgTurnaround": avg_turnaround
    }

def run_fcfs(processes):
    procs = sorted(processes, key=lambda x: x['arrivalTime'])
    gantt = []
    stats = {}
    current_time = 0
    for p in procs:
        if current_time < p['arrivalTime']:
            gantt.append({'pid': 'idle', 'start': current_time, 'end': p['arrivalTime']})
            current_time = p['arrivalTime']
        start_time = current_time
        current_time += p['burstTime']
        gantt.append({'pid': p['id'], 'start': start_time, 'end': current_time})
        stats[p['id']] = {
            'id': p['id'],
            'arrivalTime': p['arrivalTime'],
            'burstTime': p['burstTime'],
            'startTime': start_time,
            'completionTime': current_time,
            'turnaroundTime': current_time - p['arrivalTime'],
            'waitingTime': current_time - p['arrivalTime'] - p['burstTime']
        }
    return format_result(gantt, stats, len(processes))

def run_sjf_np(processes):
    procs = sorted(processes, key=lambda x: x['arrivalTime'])
    gantt = []
    stats = {}
    current_time = 0
    remaining = procs.copy()
    
    while remaining:
        available = [p for p in remaining if p['arrivalTime'] <= current_time]
        if not available:
            next_arrival = min(p['arrivalTime'] for p in remaining)
            gantt.append({'pid': 'idle', 'start': current_time, 'end': next_arrival})
            current_time = next_arrival
            available = [p for p in remaining if p['arrivalTime'] <= current_time]
        
        selected = min(available, key=lambda x: (x['burstTime'], x['arrivalTime']))
        start_time = current_time
        current_time += selected['burstTime']
        
        gantt.append({'pid': selected['id'], 'start': start_time, 'end': current_time})
        stats[selected['id']] = {
            'id': selected['id'],
            'arrivalTime': selected['arrivalTime'],
            'burstTime': selected['burstTime'],
            'startTime': start_time,
            'completionTime': current_time,
            'turnaroundTime': current_time - selected['arrivalTime'],
            'waitingTime': current_time - selected['arrivalTime'] - selected['burstTime']
        }
        remaining.remove(selected)
    
    return format_result(gantt, stats, len(processes))

def run_sjf_p(processes):
    procs = {p['id']: dict(p) for p in processes}
    remaining_burst = {p['id']: p['burstTime'] for p in processes}
    start_times = {}
    completion_times = {}
    
    current_time = 0
    completed = 0
    n = len(processes)
    gantt = []
    
    def append_gantt(pid, start, end):
        if gantt and gantt[-1]['pid'] == pid and gantt[-1]['end'] == start:
            gantt[-1]['end'] = end
        else:
            gantt.append({'pid': pid, 'start': start, 'end': end})

    while completed < n:
        available = [p for p in procs.values() if p['arrivalTime'] <= current_time and remaining_burst[p['id']] > 0]
        if not available:
            next_arrival = min(p['arrivalTime'] for p in procs.values() if remaining_burst[p['id']] > 0)
            append_gantt('idle', current_time, next_arrival)
            current_time = next_arrival
            continue
            
        selected = min(available, key=lambda x: (remaining_burst[x['id']], x['arrivalTime']))
        sid = selected['id']
        
        if sid not in start_times:
            start_times[sid] = current_time
            
        future_arrivals = [p['arrivalTime'] for p in procs.values() if p['arrivalTime'] > current_time and remaining_burst[p['id']] > 0]
        next_event_time = min(future_arrivals) if future_arrivals else float('inf')
        
        run_time = min(remaining_burst[sid], next_event_time - current_time)
        
        append_gantt(sid, current_time, current_time + run_time)
        current_time += run_time
        remaining_burst[sid] -= run_time
        
        if remaining_burst[sid] == 0:
            completed += 1
            completion_times[sid] = current_time

    stats = {}
    for p in processes:
        sid = p['id']
        stats[sid] = {
            'id': sid,
            'arrivalTime': p['arrivalTime'],
            'burstTime': p['burstTime'],
            'startTime': start_times[sid],
            'completionTime': completion_times[sid],
            'turnaroundTime': completion_times[sid] - p['arrivalTime'],
            'waitingTime': completion_times[sid] - p['arrivalTime'] - p['burstTime']
        }
    return format_result(gantt, stats, n)

def run_rr(processes, quantum):
    procs = sorted(processes, key=lambda x: x['arrivalTime'])
    remaining_burst = {p['id']: p['burstTime'] for p in processes}
    start_times = {}
    completion_times = {}
    
    current_time = 0
    completed = 0
    n = len(processes)
    gantt = []
    
    queue = []
    in_queue = set()
    
    def enqueue_arrived(t):
        for p in procs:
            if p['arrivalTime'] <= t and p['id'] not in in_queue and remaining_burst[p['id']] > 0:
                queue.append(p)
                in_queue.add(p['id'])

    enqueue_arrived(current_time)
    
    def append_gantt(pid, start, end):
        if gantt and gantt[-1]['pid'] == pid and gantt[-1]['end'] == start:
            gantt[-1]['end'] = end
        else:
            gantt.append({'pid': pid, 'start': start, 'end': end})

    while completed < n:
        if not queue:
            next_arrival = float('inf')
            for p in procs:
                if p['arrivalTime'] > current_time and remaining_burst[p['id']] > 0:
                    next_arrival = min(next_arrival, p['arrivalTime'])
            append_gantt('idle', current_time, next_arrival)
            current_time = next_arrival
            enqueue_arrived(current_time)
            continue
            
        current_proc = queue.pop(0)
        sid = current_proc['id']
        
        if sid not in start_times:
            start_times[sid] = current_time
            
        run_time = min(quantum, remaining_burst[sid])
        append_gantt(sid, current_time, current_time + run_time)
        current_time += run_time
        remaining_burst[sid] -= run_time
        
        enqueue_arrived(current_time)
        
        if remaining_burst[sid] > 0:
            queue.append(current_proc)
        else:
            completed += 1
            completion_times[sid] = current_time
            
    stats = {}
    for p in processes:
        sid = p['id']
        stats[sid] = {
            'id': sid,
            'arrivalTime': p['arrivalTime'],
            'burstTime': p['burstTime'],
            'startTime': start_times[sid],
            'completionTime': completion_times[sid],
            'turnaroundTime': completion_times[sid] - p['arrivalTime'],
            'waitingTime': completion_times[sid] - p['arrivalTime'] - p['burstTime']
        }
    return format_result(gantt, stats, n)

def run_priority_np(processes):
    procs = sorted(processes, key=lambda x: x['arrivalTime'])
    gantt = []
    stats = {}
    current_time = 0
    remaining = procs.copy()
    
    while remaining:
        available = [p for p in remaining if p['arrivalTime'] <= current_time]
        if not available:
            next_arrival = min(p['arrivalTime'] for p in remaining)
            gantt.append({'pid': 'idle', 'start': current_time, 'end': next_arrival})
            current_time = next_arrival
            available = [p for p in remaining if p['arrivalTime'] <= current_time]
        
        selected = min(available, key=lambda x: (x.get('priority', 0), x['arrivalTime']))
        start_time = current_time
        current_time += selected['burstTime']
        
        gantt.append({'pid': selected['id'], 'start': start_time, 'end': current_time})
        stats[selected['id']] = {
            'id': selected['id'],
            'arrivalTime': selected['arrivalTime'],
            'burstTime': selected['burstTime'],
            'startTime': start_time,
            'completionTime': current_time,
            'turnaroundTime': current_time - selected['arrivalTime'],
            'waitingTime': current_time - selected['arrivalTime'] - selected['burstTime']
        }
        remaining.remove(selected)
    
    return format_result(gantt, stats, len(processes))

def run_priority_p(processes):
    procs = {p['id']: dict(p) for p in processes}
    remaining_burst = {p['id']: p['burstTime'] for p in processes}
    start_times = {}
    completion_times = {}
    
    current_time = 0
    completed = 0
    n = len(processes)
    gantt = []
    
    def append_gantt(pid, start, end):
        if gantt and gantt[-1]['pid'] == pid and gantt[-1]['end'] == start:
            gantt[-1]['end'] = end
        else:
            gantt.append({'pid': pid, 'start': start, 'end': end})

    while completed < n:
        available = [p for p in procs.values() if p['arrivalTime'] <= current_time and remaining_burst[p['id']] > 0]
        if not available:
            next_arrival = min(p['arrivalTime'] for p in procs.values() if remaining_burst[p['id']] > 0)
            append_gantt('idle', current_time, next_arrival)
            current_time = next_arrival
            continue
            
        selected = min(available, key=lambda x: (x.get('priority', 0), x['arrivalTime']))
        sid = selected['id']
        
        if sid not in start_times:
            start_times[sid] = current_time
            
        future_arrivals = [p['arrivalTime'] for p in procs.values() if p['arrivalTime'] > current_time and remaining_burst[p['id']] > 0]
        next_event_time = min(future_arrivals) if future_arrivals else float('inf')
        
        run_time = min(remaining_burst[sid], next_event_time - current_time)
        
        append_gantt(sid, current_time, current_time + run_time)
        current_time += run_time
        remaining_burst[sid] -= run_time
        
        if remaining_burst[sid] == 0:
            completed += 1
            completion_times[sid] = current_time

    stats = {}
    for p in processes:
        sid = p['id']
        stats[sid] = {
            'id': sid,
            'arrivalTime': p['arrivalTime'],
            'burstTime': p['burstTime'],
            'startTime': start_times[sid],
            'completionTime': completion_times[sid],
            'turnaroundTime': completion_times[sid] - p['arrivalTime'],
            'waitingTime': completion_times[sid] - p['arrivalTime'] - p['burstTime']
        }
    return format_result(gantt, stats, n)

def solve_cpu_scheduling(processes, algorithm, preemptive, quantum):
    # Convert Pydantic models to dicts if needed
    if hasattr(processes[0], 'model_dump'):
        procs = [p.model_dump() for p in processes]
    elif hasattr(processes[0], 'dict'):
        procs = [p.dict() for p in processes]
    else:
        procs = processes

    if algorithm == "First Come First Serve":
        return run_fcfs(procs)
    elif algorithm == "Shortest Job First":
        if preemptive:
            return run_sjf_p(procs)
        else:
            return run_sjf_np(procs)
    elif algorithm == "Round Robin":
        return run_rr(procs, quantum)
    elif algorithm == "Priority Scheduling":
        if preemptive:
            return run_priority_p(procs)
        else:
            return run_priority_np(procs)
    else:
        return run_fcfs(procs)
