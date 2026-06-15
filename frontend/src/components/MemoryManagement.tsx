import { useState, useEffect } from "react";
import "./MemoryManagement.css";

interface MemBlock {
    id: string;
    size: number;
}

interface Process {
    id: string;
    size: number;
    arrivalTime: number;
    burstTime: number;
    priority?: number;
}

interface TimelineState {
    time: number;
    blocks: {
        id: string;
        capacity: number;
        processId: string | null;
        processSize: number;
    }[];
    waitingQueue: string[];
}

const MEMORY_ALGORITHMS = [
    { name: "First Fit", abbr: "FF", desc: "Allocates the first hole that is big enough." },
    { name: "Best Fit", abbr: "BF", desc: "Allocates the smallest hole that is big enough." },
    { name: "Worst Fit", abbr: "WF", desc: "Allocates the largest available hole." },
    { name: "Next Fit", abbr: "NF", desc: "Allocates the first available hole starting from the last allocation." },
];

const CPU_ALGORITHMS = [
    { name: "First Come First Serve", abbr: "FCFS", hasPreemptive: false },
    { name: "Shortest Job First", abbr: "SJF", hasPreemptive: true },
    { name: "Round Robin", abbr: "RR", hasPreemptive: false },
    { name: "Priority Scheduling", abbr: "PRIORITY", hasPreemptive: true },
] as const;

const MEM_SPEED_INTERVALS = [1400, 1000, 650, 350, 150];
const MEM_SPEED_LABELS = ["Slowest", "Slow", "Normal", "Fast", "Fastest"];

type AlgorithmName = (typeof MEMORY_ALGORITHMS)[number]["name"];

const COLORS = 8;
const colorIndex = (i: number) => i % COLORS;

// Predefined demo data
const SAMPLE_BLOCKS: MemBlock[] = [
    { id: "B1", size: 100 },
    { id: "B2", size: 500 },
    { id: "B3", size: 200 },
    { id: "B4", size: 300 },
    { id: "B5", size: 600 },
];

const DEMO_PROCESSES: Process[] = [
    { id: "P1", size: 212, arrivalTime: 0, burstTime: 6, priority: 2 },
    { id: "P2", size: 417, arrivalTime: 1, burstTime: 8, priority: 1 },
    { id: "P3", size: 112, arrivalTime: 2, burstTime: 3, priority: 4 },
    { id: "P4", size: 426, arrivalTime: 3, burstTime: 4, priority: 3 },
];

const DEMO_TIMELINE: TimelineState[] = [
    {
        time: 0,
        blocks: [
        { id: "B1", capacity: 100, processId: null, processSize: 0 },
        { id: "B2", capacity: 500, processId: null, processSize: 0 },
        { id: "B3", capacity: 200, processId: null, processSize: 0 },
        { id: "B4", capacity: 300, processId: "P1", processSize: 212 },
        { id: "B5", capacity: 600, processId: null, processSize: 0 },
        ],
        waitingQueue: [],
    },
    {
        time: 1,
        blocks: [
        { id: "B1", capacity: 100, processId: null, processSize: 0 },
        { id: "B2", capacity: 500, processId: "P2", processSize: 417 },
        { id: "B3", capacity: 200, processId: null, processSize: 0 },
        { id: "B4", capacity: 300, processId: "P1", processSize: 212 },
        { id: "B5", capacity: 600, processId: null, processSize: 0 },
        ],
        waitingQueue: [],
    },
    {
        time: 2,
        blocks: [
        { id: "B1", capacity: 100, processId: null, processSize: 0 },
        { id: "B2", capacity: 500, processId: "P2", processSize: 417 },
        { id: "B3", capacity: 200, processId: "P3", processSize: 112 },
        { id: "B4", capacity: 300, processId: "P1", processSize: 212 },
        { id: "B5", capacity: 600, processId: null, processSize: 0 },
        ],
        waitingQueue: [],
    },
    {
        time: 3,
        blocks: [
        { id: "B1", capacity: 100, processId: null, processSize: 0 },
        { id: "B2", capacity: 500, processId: "P2", processSize: 417 },
        { id: "B3", capacity: 200, processId: "P3", processSize: 112 },
        { id: "B4", capacity: 300, processId: "P1", processSize: 212 },
        { id: "B5", capacity: 600, processId: "P4", processSize: 426 },
        ],
        waitingQueue: [],
    },
    {
        time: 5,
        blocks: [
        { id: "B1", capacity: 100, processId: null, processSize: 0 },
        { id: "B2", capacity: 500, processId: "P2", processSize: 417 },
        { id: "B3", capacity: 200, processId: null, processSize: 0 },
        { id: "B4", capacity: 300, processId: "P1", processSize: 212 },
        { id: "B5", capacity: 600, processId: "P4", processSize: 426 },
        ],
        waitingQueue: [],
    },
    {
        time: 6,
        blocks: [
        { id: "B1", capacity: 100, processId: null, processSize: 0 },
        { id: "B2", capacity: 500, processId: "P2", processSize: 417 },
        { id: "B3", capacity: 200, processId: null, processSize: 0 },
        { id: "B4", capacity: 300, processId: null, processSize: 0 },
        { id: "B5", capacity: 600, processId: "P4", processSize: 426 },
        ],
        waitingQueue: [],
    },
    {
        time: 7,
        blocks: [
        { id: "B1", capacity: 100, processId: null, processSize: 0 },
        { id: "B2", capacity: 500, processId: "P2", processSize: 417 },
        { id: "B3", capacity: 200, processId: null, processSize: 0 },
        { id: "B4", capacity: 300, processId: null, processSize: 0 },
        { id: "B5", capacity: 600, processId: null, processSize: 0 },
        ],
        waitingQueue: [],
    },
    {
        time: 9,
        blocks: [
        { id: "B1", capacity: 100, processId: null, processSize: 0 },
        { id: "B2", capacity: 500, processId: null, processSize: 0 },
        { id: "B3", capacity: 200, processId: null, processSize: 0 },
        { id: "B4", capacity: 300, processId: null, processSize: 0 },
        { id: "B5", capacity: 600, processId: null, processSize: 0 },
        ],
        waitingQueue: [],
    },
];

function Memory_Management() {
    const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmName>("First Fit");
    const [selectedCpuAlgo, setSelectedCpuAlgo] = useState<string>(CPU_ALGORITHMS[0].name);
    const [blocks, setBlocks] = useState<MemBlock[]>(SAMPLE_BLOCKS);
    const [processes, setProcesses] = useState<Process[]>(DEMO_PROCESSES);
    const [showResults, setShowResults] = useState(false);
    const [isCompaction, setIsCompaction] = useState(false);
    const [isPreemptive, setIsPreemptive] = useState(false);
    const [quantum, setQuantum] = useState(2);
    const [nextBlockId, setNextBlockId] = useState(6);
    const [nextProcId, setNextProcId] = useState(5);

    const [formBlockSize, setFormBlockSize] = useState("");
    const [formProcName, setFormProcName] = useState("");
    const [formProcSize, setFormProcSize] = useState("");
    const [formProcArrival, setFormProcArrival] = useState("");
    const [formProcBurst, setFormProcBurst] = useState("");
    const [formProcPriority, setFormProcPriority] = useState("");

    const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<"blocks" | "processes">("blocks");
    const [autoPlay, setAutoPlay] = useState(false);
    const [speed, setSpeed] = useState(3);

    const processColorMap = new Map(processes.map(function (p, i) { return [p.id, i]; }));
    const currentCpuAlgoDef = CPU_ALGORITHMS.find((a) => a.name === selectedCpuAlgo)!;
    const isPriority = selectedCpuAlgo === "Priority Scheduling";
    const isRR = selectedCpuAlgo === "Round Robin";

    function addBlock() {
        const bid = "B" + nextBlockId;
        const size = Number(formBlockSize) > 0 ? Number(formBlockSize) : 100;
        for (const b of blocks) {
            if (b.id === bid) { alert('Block "' + bid + '" already exists.'); return; }
        }
        setBlocks(function (prev) { return [...prev, { id: bid, size: size }]; });
        setNextBlockId(function (prev) { return prev + 1; });
        setFormBlockSize("");
        setShowResults(false);
    }

    function addProcess() {
        const pid = formProcName.trim() || ("P" + nextProcId);
        const size = Number(formProcSize) > 0 ? Number(formProcSize) : 50;
        const arrival = Number(formProcArrival) >= 0 ? Number(formProcArrival) : 0;
        const burst = Number(formProcBurst) > 0 ? Number(formProcBurst) : 1;
        const priority = Number(formProcPriority) >= 0 ? Number(formProcPriority) : 0;
        for (const p of processes) {
        if (p.id === pid) { alert('Process "' + pid + '" already exists.'); return; }
        }
        setProcesses(function (prev) { return [...prev, { id: pid, size: size, arrivalTime: arrival, burstTime: burst, priority: priority }]; });
        setNextProcId(function (prev) { return prev + 1; });
        setFormProcName("");
        setFormProcSize("");
        setFormProcArrival("");
        setFormProcBurst("");
        setFormProcPriority("");
        setShowResults(false);
    }

    function removeBlock(id: string) {
        setBlocks(function (prev) { return prev.filter(function (b) { return b.id !== id; }); });
        setShowResults(false);
    }

    function removeProcess(id: string) {
        setProcesses(function (prev) { return prev.filter(function (p) { return p.id !== id; }); });
        setShowResults(false);
    }

    function clearAll() {
        setBlocks([]); setProcesses([]);
        setNextBlockId(1); setNextProcId(1);
        setShowResults(false);
    }

    function loadSample() {
        setBlocks([...SAMPLE_BLOCKS]); setProcesses([...DEMO_PROCESSES]);
        setNextBlockId(6); setNextProcId(5);
        setShowResults(false);
    }

    function runSimulation() {
        if (blocks.length === 0 || processes.length === 0) return;
        setCurrentTimeIndex(0);
        setAutoPlay(false);
        setShowResults(true);
    }

    /* Auto-play stepping */
    useEffect(function () {
        if (!autoPlay || !showResults) return;
        const timeline = DEMO_TIMELINE;
        if (currentTimeIndex >= timeline.length - 1) {
            setAutoPlay(false);
            return;
        }
        var interval = MEM_SPEED_INTERVALS[speed - 1] || MEM_SPEED_INTERVALS[2];
        var timer = setTimeout(function () {
            setCurrentTimeIndex(function (prev) { return Math.min(timeline.length - 1, prev + 1); });
        }, interval);
        return function () { clearTimeout(timer); };
    }, [autoPlay, currentTimeIndex, speed, showResults]);

    const activeTimeline = DEMO_TIMELINE;
    const activeTimelineState = activeTimeline[currentTimeIndex] || activeTimeline[0];
    const currentAllocations = processes.map(function (proc) {
        const allocatedBlock = activeTimelineState.blocks.find(function (b) { return b.processId === proc.id; });
        return {
        processId: proc.id,
        processSize: proc.size,
        blockId: allocatedBlock ? allocatedBlock.id : "—",
        blockSize: allocatedBlock ? allocatedBlock.capacity : 0,
        allocated: !!allocatedBlock,
        };
    });

    return (
        <div className="mem-app">
        <div className="mem-tabs">
            <button type="button" className="mem-tab active">Memory Allocation</button>
            <button type="button" className="mem-tab">Page Replacement</button>
        </div>

        <div className="mem-content">
            <aside className="mem-sidebar">
            <h3>Memory Allocation</h3>
            {MEMORY_ALGORITHMS.map(function (algo) {
                return (
                <button
                    type="button"
                    key={algo.name}
                    className={"mem-algo-card" + (selectedAlgo === algo.name ? " selected" : "")}
                    title={algo.desc}
                    onClick={function () { setSelectedAlgo(algo.name); setShowResults(false); }}
                >
                    {algo.name}
                    <span className="algo-abbr">{algo.abbr}</span>
                </button>
                );
            })}
            </aside>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
            <section className="mem-task-manager">
                <div className="mem-task-header">
                <div>
                    <h2>Memory Manager</h2>
                    <p>Configure memory blocks and processes</p>
                </div>
                <div className="mem-controls">
                    <button type="button" className="mem-ctrl-btn" onClick={loadSample}>Sample</button>
                    <button type="button" className="mem-ctrl-btn danger-btn" onClick={clearAll}>Clear</button>
                    <button type="button" className="mem-ctrl-btn run-btn" onClick={runSimulation} disabled={blocks.length === 0 || processes.length === 0}>Run</button>
                </div>
                </div>

                <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap", marginBottom: "12px" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)" }}>CPU Scheduling:</span>
                    <select 
                    className="mem-select"
                    value={selectedCpuAlgo}
                    onChange={function(e) { setSelectedCpuAlgo(e.target.value); setIsPreemptive(false); setShowResults(false); }}
                    >
                    {CPU_ALGORITHMS.map(function(a) { return <option key={a.name} value={a.name}>{a.name}</option>; })}
                    </select>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)" }}>Compaction:</span>
                    <select 
                    className="mem-select"
                    value={isCompaction ? "true" : "false"}
                    onChange={function(e) { setIsCompaction(e.target.value === "true"); setShowResults(false); }}
                    >
                    <option value="false">Without Compaction</option>
                    <option value="true">With Compaction</option>
                    </select>
                </div>
                </div>

                <div className="mem-inner-tabs">
                <button type="button" className={"mem-inner-tab" + (activeTab === "blocks" ? " active" : "")} onClick={function () { setActiveTab("blocks"); }}>Memory Blocks ({blocks.length})</button>
                <button type="button" className={"mem-inner-tab" + (activeTab === "processes" ? " active" : "")} onClick={function () { setActiveTab("processes"); }}>Processes ({processes.length})</button>
                </div>

                {activeTab === "blocks" && (
                <>
                    <div className="mem-task-form">
                    <div className="mem-input-group">
                        <label>Block ID</label>
                        <input value={"B" + nextBlockId} readOnly disabled style={{ cursor: "not-allowed", backgroundColor: "var(--bg-inset)" }} />
                    </div>
                    <div className="mem-input-group">
                        <label>Size (KB)</label>
                        <input type="number" placeholder="e.g. 200" min={1} value={formBlockSize} onChange={function (e) { setFormBlockSize(e.target.value); }} />
                    </div>
                    <button type="button" className="mem-add-btn" disabled={!formBlockSize || Number(formBlockSize) <= 0} onClick={addBlock}>+</button>
                    </div>
                    
                    <table className="mem-table">
                    <thead><tr><th>Block</th><th>Size (KB)</th><th></th></tr></thead>
                    <tbody>
                        {blocks.map(function (b, i) {
                        return (
                            <tr key={b.id}>
                            <td><span className="mem-process-id"><span className={"mem-process-dot dot-color-" + colorIndex(i)} />{b.id}</span></td>
                            <td>{b.size}</td>
                            <td><button type="button" className="mem-delete-btn" onClick={function () { removeBlock(b.id); }}>✕</button></td>
                            </tr>
                        );
                        })}
                    </tbody>
                    </table>
                </>
                )}

                {activeTab === "processes" && (
                <>
                    {/* Preemptive toggle for CPU Scheduling */}
                    {currentCpuAlgoDef.hasPreemptive && (
                    <div className="mem-preemptive-toggle" style={{ marginBottom: "16px" }}>
                        <button
                        type="button"
                        className={"mem-toggle-btn" + (!isPreemptive ? " active" : "")}
                        onClick={function () { setIsPreemptive(false); setShowResults(false); }}
                        >
                        Non-Preemptive
                        </button>
                        <button
                        type="button"
                        className={"mem-toggle-btn" + (isPreemptive ? " active" : "")}
                        onClick={function () { setIsPreemptive(true); setShowResults(false); }}
                        >
                        Preemptive
                        </button>
                    </div>
                    )}

                    {/* Quantum for RR */}
                    {isRR && (
                    <div className="mem-quantum-section" style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>Time Quantum:</label>
                        <input
                        type="number"
                        min={1}
                        value={quantum}
                        style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border)", width: "80px", outline: "none", fontFamily: "inherit", fontWeight: 600 }}
                        onChange={function (e) {
                            setQuantum(Math.max(1, parseInt(e.target.value) || 1));
                            setShowResults(false);
                        }}
                        />
                    </div>
                    )}

                    <div className="mem-task-form" style={{ flexWrap: "wrap" }}>
                    <div className="mem-input-group" style={{ minWidth: "120px" }}>
                        <label>Process Name</label>
                        <input type="text" placeholder={"P" + nextProcId} value={formProcName} onChange={function (e) { setFormProcName(e.target.value); }} onKeyDown={function (e) { if (e.key === "Enter" && Number(formProcSize) > 0) { e.preventDefault(); addProcess(); } }} />
                    </div>
                    <div className="mem-input-group" style={{ minWidth: "100px" }}>
                        <label>Size (KB)</label>
                        <input type="number" placeholder="e.g. 150" min={1} value={formProcSize} onChange={function (e) { setFormProcSize(e.target.value); }} onKeyDown={function (e) { if (e.key === "Enter" && Number(formProcSize) > 0) { e.preventDefault(); addProcess(); } }} />
                    </div>
                    <div className="mem-input-group" style={{ minWidth: "100px" }}>
                        <label>Arrival Time</label>
                        <input type="number" placeholder="e.g. 0" min={0} value={formProcArrival} onChange={function (e) { setFormProcArrival(e.target.value); }} onKeyDown={function (e) { if (e.key === "Enter" && Number(formProcSize) > 0) { e.preventDefault(); addProcess(); } }} />
                    </div>
                    <div className="mem-input-group" style={{ minWidth: "100px" }}>
                        <label>Burst Time</label>
                        <input type="number" placeholder="e.g. 5" min={1} value={formProcBurst} onChange={function (e) { setFormProcBurst(e.target.value); }} onKeyDown={function (e) { if (e.key === "Enter" && Number(formProcSize) > 0) { e.preventDefault(); addProcess(); } }} />
                    </div>
                    {isPriority && (
                        <div className="mem-input-group" style={{ minWidth: "80px" }}>
                        <label>Priority</label>
                        <input type="number" placeholder="e.g. 1" min={0} value={formProcPriority} onChange={function (e) { setFormProcPriority(e.target.value); }} onKeyDown={function (e) { if (e.key === "Enter" && Number(formProcSize) > 0) { e.preventDefault(); addProcess(); } }} />
                        </div>
                    )}
                    <button type="button" className="mem-add-btn" disabled={!formProcSize || Number(formProcSize) <= 0} onClick={function () { addProcess(); }}>+</button>
                    </div>
                    
                    <div className="mem-table-container">
                    {processes.length === 0 ? (
                        <div className="mem-empty-state">
                        <div className="mem-empty-icon"></div>
                        <h4>No processes</h4>
                        <p>Add processes above or load sample data</p>
                        </div>
                    ) : (
                        <table className="mem-table">
                        <thead>
                            <tr>
                            <th>Process</th>
                            <th>Size (KB)</th>
                            <th>Arrival Time</th>
                            <th>Burst Time</th>
                            {isPriority && <th>Priority</th>}
                            <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {processes.map(function (p, i) {
                            return (
                                <tr key={p.id}>
                                <td><span className="mem-process-id"><span className={"mem-process-dot dot-color-" + colorIndex(i)} />{p.id}</span></td>
                                <td>{p.size}</td>
                                <td>{p.arrivalTime}</td>
                                <td>{p.burstTime}</td>
                                {isPriority && <td>{p.priority}</td>}
                                <td><button type="button" className="mem-delete-btn" onClick={function () { removeProcess(p.id); }}>✕</button></td>
                                </tr>
                            );
                            })}
                        </tbody>
                        </table>
                    )}
                    </div>
                </>
                )}
            </section>

            {/* Results */}
            {showResults && (
                <section className="mem-results">
                <div className="mem-results-header">
                    <div>
                    <h2>Allocation Results</h2>
                    <p className="mem-results-algo-label">{selectedAlgo} · {selectedCpuAlgo} · {isCompaction ? "With Compaction" : "Without Compaction"}</p>
                    </div>
                    <div className="mem-metrics">
                    <div className="mem-metric">
                        <div className="mem-metric-label">Allocated</div>
                        <div className="mem-metric-value">{currentAllocations.filter(function(a) { return a.allocated; }).length} / {processes.length}</div>
                    </div>
                    <div className="mem-metric">
                        <div className="mem-metric-label">Internal Frag.</div>
                        <div className="mem-metric-value">
                        {activeTimelineState.blocks.reduce(function(acc, b) { return acc + (b.processId ? (b.capacity - b.processSize) : 0); }, 0)} KB
                        </div>
                    </div>
                    <div className="mem-metric">
                        <div className="mem-metric-label">External Frag.</div>
                        <div className="mem-metric-value">
                        {activeTimelineState.blocks.reduce(function(acc, b) { return acc + (b.processId ? 0 : b.capacity); }, 0)} KB
                        </div>
                    </div>
                    </div>
                </div>

                <div className="mem-results-layout">
                    {/* Timeline Visualization Column */}
                    <div className="mem-visual-col">
                    {/* Timeline Navigation Playback */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ margin: 0, fontFamily: "Outfit, sans-serif", fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)" }}>
                            Memory Stack (Time: {activeTimelineState.time}s)
                        </h3>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <button
                            type="button"
                            className="mem-ctrl-btn"
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                            disabled={currentTimeIndex === 0}
                            onClick={function () { setAutoPlay(false); setCurrentTimeIndex(function (prev) { return Math.max(0, prev - 1); }); }}
                            >
                            Back
                            </button>
                            <button
                            type="button"
                            className="mem-ctrl-btn"
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                            disabled={currentTimeIndex === activeTimeline.length - 1}
                            onClick={function () { setAutoPlay(false); setCurrentTimeIndex(function (prev) { return Math.min(activeTimeline.length - 1, prev + 1); }); }}
                            >
                            Next
                            </button>
                            <button
                            type="button"
                            className={"mem-ctrl-btn" + (autoPlay ? " mem-ctrl-btn-active" : "")}
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                            disabled={currentTimeIndex >= activeTimeline.length - 1}
                            onClick={function () { setAutoPlay(function (v) { return !v; }); }}
                            >
                            {autoPlay ? "Pause" : "Auto-Play"}
                            </button>
                            <select
                            className="mem-speed-select"
                            value={speed}
                            onChange={function (e) { setSpeed(parseInt(e.target.value)); }}
                            title="Auto-Play Speed"
                            >
                            {MEM_SPEED_LABELS.map(function (label, i) { return <option key={i} value={i + 1}>{label}</option>; })}
                            </select>
                        </div>
                        </div>

                        {/* Waiting Queue Visualizer */}
                        {activeTimelineState.waitingQueue.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--purple-bg)", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--purple-border)" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--purple)", textTransform: "uppercase" }}>Waiting Queue:</span>
                            <div style={{ display: "flex", gap: "6px" }}>
                            {activeTimelineState.waitingQueue.map(function (pid) {
                                const ci = processColorMap.get(pid) ?? 0;
                                return (
                                <span key={pid} className={"process-color-" + ci} style={{ color: "#fff", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700 }}>
                                    {pid}
                                </span>
                                );
                            })}
                            </div>
                        </div>
                        )}
                    </div>

                    {/* Vertical Memory Visualization */}
                    <div className="mem-visual">
                        <div className="mem-stack">
                        {activeTimelineState.blocks.map(function (block, i) {
                            const ci = block.processId ? (processColorMap.get(block.processId) ?? 0) : 0;
                            
                            return (
                            <div
                                key={block.id + "-" + i}
                                className={"mem-stack-block" + (block.processId ? "" : " free-block")}
                                style={{ flex: block.capacity, animationDelay: i * 0.06 + "s" }}
                            >
                                <div className="mem-stack-block-label">
                                {block.id} <span className="capacity-label">({block.capacity} KB)</span>
                                </div>
                                
                                {block.processId ? (
                                <div className={"mem-allocated-segment process-color-" + ci} style={{ height: (block.processSize / block.capacity) * 100 + "%" }}>
                                    {block.processId} <span className="segment-size">{block.processSize} KB</span>
                                </div>
                                ) : (
                                <div className="mem-free-segment">
                                    Free Space
                                </div>
                                )}

                                {block.processId && block.capacity > block.processSize && (
                                <div className="mem-frag-segment" style={{ height: ((block.capacity - block.processSize) / block.capacity) * 100 + "%" }} title={"Internal Fragmentation: " + (block.capacity - block.processSize) + " KB"}>
                                    Frag: {block.capacity - block.processSize} KB
                                </div>
                                )}
                            </div>
                            );
                        })}
                        </div>
                    </div>
                    </div>

                    {/* Allocation Table Column */}
                    <div className="mem-table-col">
                    <div className="mem-result-table-wrapper" style={{ marginTop: 0 }}>
                        <h3>Allocation Overview (Time: {activeTimelineState.time}s)</h3>
                        <table className="mem-result-table">
                        <thead>
                            <tr>
                            <th>Process</th>
                            <th className="num-col">Size (KB)</th>
                            <th>Block</th>
                            <th className="num-col">Block Size (KB)</th>
                            <th className="center-col">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentAllocations.map(function (a) {
                            return (
                                <tr key={a.processId}>
                                <td>{a.processId}</td>
                                <td className="num-col">{a.processSize}</td>
                                <td>{a.blockId}</td>
                                <td className="num-col">{a.blockSize || "—"}</td>
                                <td className="center-col" style={{ color: a.allocated ? "#3B7A6A" : "#a4b0b6", fontWeight: 600 }}>
                                    {a.allocated ? "Allocated" : "Waiting"}
                                </td>
                                </tr>
                            );
                            })}
                        </tbody>
                        </table>
                    </div>
                    </div>
                </div>
                </section>
            )}
            </div>
        </div>
        </div>
    );
}

export default Memory_Management;
