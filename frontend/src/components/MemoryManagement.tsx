import { useEffect, useState } from "react";
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

interface MemoryAllocation {
    process: string;
    size: number;
    block: string | null;
    blockSize: number | null;
    status: string;
    internalFragmentation: number;
}

interface MemoryBlockResult {
    id: string;
    size: number;
    remaining: number;
}

interface MemoryBackendResult {
    allocations: MemoryAllocation[];
    memoryBlocks: MemoryBlockResult[];
    allocated: number;
    totalProcesses: number;
    internalFragmentation: number;
    externalFragmentation: number;
}

interface PageReplacementStep {
    step: number;
    page: number;
    frames: Array<number | null>;
    pageFault: boolean;
    replacedPage: number | null;
}

interface PageReplacementResult {
    algorithm: string;
    totalPageFaults: number;
    totalHits: number;
    steps: PageReplacementStep[];
}

const MEMORY_ALGORITHMS = [
    { name: "First Fit", abbr: "FF", desc: "Allocates the first hole that is big enough." },
    { name: "Best Fit", abbr: "BF", desc: "Allocates the smallest hole that is big enough." },
    { name: "Worst Fit", abbr: "WF", desc: "Allocates the largest available hole." },
    { name: "Next Fit", abbr: "NF", desc: "Allocates the first available hole starting from the last allocation." },
] as const;

const CPU_ALGORITHMS = [
    { name: "First Come First Serve", abbr: "FCFS", hasPreemptive: false },
    { name: "Shortest Job First", abbr: "SJF", hasPreemptive: true },
    { name: "Round Robin", abbr: "RR", hasPreemptive: false },
    { name: "Priority Scheduling", abbr: "PRIORITY", hasPreemptive: true },
] as const;

const PAGE_ALGORITHMS = ["FIFO", "LRU", "Optimal"] as const;

const MEM_SPEED_INTERVALS = [1400, 1000, 650, 350, 150];
const MEM_SPEED_LABELS = ["Slowest", "Slow", "Normal", "Fast", "Fastest"];

type AlgorithmName = (typeof MEMORY_ALGORITHMS)[number]["name"];
type MainTab = "allocation" | "replacement";
type InnerTab = "blocks" | "processes";
type PageAlgorithm = (typeof PAGE_ALGORITHMS)[number];

const COLORS = 8;
const colorIndex = (i: number) => i % COLORS;

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

function buildTimeline(blocks: MemBlock[], result: MemoryBackendResult | null): TimelineState[] {
    if (!result) {
        return [
            {
                time: 0,
                blocks: blocks.map(function (block) {
                    return {
                        id: block.id,
                        capacity: block.size,
                        processId: null,
                        processSize: 0,
                    };
                }),
                waitingQueue: [],
            },
        ];
    }

    const mappedBlocks = result.memoryBlocks.map(function (block) {
        const allocation = result.allocations.find(function (item) {
            return item.block === block.id && item.status === "Allocated";
        });

        return {
            id: block.id,
            capacity: block.size,
            processId: allocation ? allocation.process : null,
            processSize: allocation ? allocation.size : 0,
        };
    });

    const waitingQueue = result.allocations
        .filter(function (item) {
            return item.status !== "Allocated";
        })
        .map(function (item) {
            return item.process;
        });

    return [
        {
            time: 0,
            blocks: mappedBlocks,
            waitingQueue,
        },
    ];
}

function Memory_Management() {
    const [mainTab, setMainTab] = useState<MainTab>("allocation");

    const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmName>("First Fit");
    const [selectedCpuAlgo, setSelectedCpuAlgo] = useState<string>(CPU_ALGORITHMS[0].name);
    const [blocks, setBlocks] = useState<MemBlock[]>(SAMPLE_BLOCKS);
    const [processes, setProcesses] = useState<Process[]>(DEMO_PROCESSES);
    const [showResults, setShowResults] = useState(false);
    const [backendResult, setBackendResult] = useState<MemoryBackendResult | null>(null);

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
    const [activeTab, setActiveTab] = useState<InnerTab>("blocks");
    const [autoPlay, setAutoPlay] = useState(false);
    const [speed, setSpeed] = useState(3);

    const [pageString, setPageString] = useState("7 0 1 2 0 3 0 4 2 3 0 3 2");
    const [frameCount, setFrameCount] = useState(3);
    const [pageAlgorithm, setPageAlgorithm] = useState<PageAlgorithm>("FIFO");
    const [pageResult, setPageResult] = useState<PageReplacementResult | null>(null);

    const processColorMap = new Map(processes.map(function (p, i) { return [p.id, i]; }));
    const currentCpuAlgoDef = CPU_ALGORITHMS.find((a) => a.name === selectedCpuAlgo)!;
    const isPriority = selectedCpuAlgo === "Priority Scheduling";
    const isRR = selectedCpuAlgo === "Round Robin";

    const activeTimeline = buildTimeline(blocks, backendResult);
    const activeTimelineState = activeTimeline[currentTimeIndex] || activeTimeline[0];

    const currentAllocations = backendResult
        ? backendResult.allocations.map(function (allocation) {
            return {
                processId: allocation.process,
                processSize: allocation.size,
                blockId: allocation.block || "—",
                blockSize: allocation.blockSize || 0,
                allocated: allocation.status === "Allocated",
            };
        })
        : processes.map(function (proc) {
            return {
                processId: proc.id,
                processSize: proc.size,
                blockId: "—",
                blockSize: 0,
                allocated: false,
            };
        });

    function addBlock() {
        const bid = "B" + nextBlockId;
        const size = Number(formBlockSize) > 0 ? Number(formBlockSize) : 100;

        for (const b of blocks) {
            if (b.id === bid) {
                alert('Block "' + bid + '" already exists.');
                return;
            }
        }

        setBlocks(function (prev) { return [...prev, { id: bid, size: size }]; });
        setNextBlockId(function (prev) { return prev + 1; });
        setFormBlockSize("");
        setBackendResult(null);
        setShowResults(false);
    }

    function addProcess() {
        const pid = formProcName.trim() || ("P" + nextProcId);
        const size = Number(formProcSize) > 0 ? Number(formProcSize) : 50;
        const arrival = Number(formProcArrival) >= 0 ? Number(formProcArrival) : 0;
        const burst = Number(formProcBurst) > 0 ? Number(formProcBurst) : 1;
        const priority = Number(formProcPriority) >= 0 ? Number(formProcPriority) : 0;

        for (const p of processes) {
            if (p.id === pid) {
                alert('Process "' + pid + '" already exists.');
                return;
            }
        }

        setProcesses(function (prev) {
            return [...prev, { id: pid, size: size, arrivalTime: arrival, burstTime: burst, priority: priority }];
        });

        setNextProcId(function (prev) { return prev + 1; });
        setFormProcName("");
        setFormProcSize("");
        setFormProcArrival("");
        setFormProcBurst("");
        setFormProcPriority("");
        setBackendResult(null);
        setShowResults(false);
    }

    function removeBlock(id: string) {
        setBlocks(function (prev) { return prev.filter(function (b) { return b.id !== id; }); });
        setBackendResult(null);
        setShowResults(false);
    }

    function removeProcess(id: string) {
        setProcesses(function (prev) { return prev.filter(function (p) { return p.id !== id; }); });
        setBackendResult(null);
        setShowResults(false);
    }

    function clearAll() {
        setBlocks([]);
        setProcesses([]);
        setNextBlockId(1);
        setNextProcId(1);
        setBackendResult(null);
        setPageResult(null);
        setShowResults(false);
    }

    function loadSample() {
        setBlocks([...SAMPLE_BLOCKS]);
        setProcesses([...DEMO_PROCESSES]);
        setNextBlockId(6);
        setNextProcId(5);
        setBackendResult(null);
        setShowResults(false);
    }

    async function runSimulation() {
        if (blocks.length === 0 || processes.length === 0) return;

        try {
            const response = await fetch("http://127.0.0.1:8000/api/memory-management", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    blocks,
                    processes,
                    allocationAlgorithm: selectedAlgo,
                    schedulingAlgorithm: selectedCpuAlgo,
                    compaction: isCompaction,
                }),
            });

            if (!response.ok) {
                throw new Error("Memory management request failed.");
            }

            const data = (await response.json()) as MemoryBackendResult;

            setBackendResult(data);
            setCurrentTimeIndex(0);
            setAutoPlay(false);
            setShowResults(true);
        } catch (error) {
            console.error(error);
            alert("Cannot connect to backend");
        }
    }

    async function runPageReplacement() {
        const pages = pageString
            .split(/[\s,]+/)
            .filter(function (value) { return value.trim() !== ""; })
            .map(function (value) { return Number(value); });

        if (pages.length === 0 || frameCount <= 0) return;

        try {
            const response = await fetch("http://127.0.0.1:8000/api/page-replacement", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    pages,
                    frames: frameCount,
                    algorithm: pageAlgorithm,
                }),
            });

            if (!response.ok) {
                throw new Error("Page replacement request failed.");
            }

            const data = (await response.json()) as PageReplacementResult;
            setPageResult(data);
        } catch (error) {
            console.error(error);
            alert("Cannot connect to backend");
        }
    }

    useEffect(function () {
        if (!autoPlay || !showResults) return;
        if (currentTimeIndex >= activeTimeline.length - 1) return;

        const interval = MEM_SPEED_INTERVALS[speed - 1] || MEM_SPEED_INTERVALS[2];
        const timer = setTimeout(function () {
            setCurrentTimeIndex(function (prev) {
                return Math.min(activeTimeline.length - 1, prev + 1);
            });
        }, interval);

        return function () { clearTimeout(timer); };
    }, [autoPlay, currentTimeIndex, speed, showResults, activeTimeline.length]);

    return (
        <div className="mem-app">
            <div className="mem-tabs">
                <button
                    type="button"
                    className={"mem-tab" + (mainTab === "allocation" ? " active" : "")}
                    onClick={function () { setMainTab("allocation"); }}
                >
                    Memory Allocation
                </button>

                <button
                    type="button"
                    className={"mem-tab" + (mainTab === "replacement" ? " active" : "")}
                    onClick={function () { setMainTab("replacement"); }}
                >
                    Page Replacement
                </button>
            </div>

            {mainTab === "allocation" && (
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
                                    onClick={function () {
                                        setSelectedAlgo(algo.name);
                                        setBackendResult(null);
                                        setShowResults(false);
                                    }}
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
                                    <button
                                        type="button"
                                        className="mem-ctrl-btn run-btn"
                                        onClick={runSimulation}
                                        disabled={blocks.length === 0 || processes.length === 0}
                                    >
                                        Run
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap", marginBottom: "12px" }}>
                                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                    <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)" }}>CPU Scheduling:</span>
                                    <select
                                        className="mem-select"
                                        value={selectedCpuAlgo}
                                        onChange={function (e) {
                                            setSelectedCpuAlgo(e.target.value);
                                            setIsPreemptive(false);
                                            setBackendResult(null);
                                            setShowResults(false);
                                        }}
                                    >
                                        {CPU_ALGORITHMS.map(function (a) {
                                            return <option key={a.name} value={a.name}>{a.name}</option>;
                                        })}
                                    </select>
                                </div>

                                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                    <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)" }}>Compaction:</span>
                                    <select
                                        className="mem-select"
                                        value={isCompaction ? "true" : "false"}
                                        onChange={function (e) {
                                            setIsCompaction(e.target.value === "true");
                                            setBackendResult(null);
                                            setShowResults(false);
                                        }}
                                    >
                                        <option value="false">Without Compaction</option>
                                        <option value="true">With Compaction</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mem-inner-tabs">
                                <button
                                    type="button"
                                    className={"mem-inner-tab" + (activeTab === "blocks" ? " active" : "")}
                                    onClick={function () { setActiveTab("blocks"); }}
                                >
                                    Memory Blocks ({blocks.length})
                                </button>

                                <button
                                    type="button"
                                    className={"mem-inner-tab" + (activeTab === "processes" ? " active" : "")}
                                    onClick={function () { setActiveTab("processes"); }}
                                >
                                    Processes ({processes.length})
                                </button>
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
                                            <input
                                                type="number"
                                                placeholder="e.g. 200"
                                                min={1}
                                                value={formBlockSize}
                                                onChange={function (e) { setFormBlockSize(e.target.value); }}
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            className="mem-add-btn"
                                            disabled={!formBlockSize || Number(formBlockSize) <= 0}
                                            onClick={addBlock}
                                        >
                                            +
                                        </button>
                                    </div>

                                    <table className="mem-table">
                                        <thead>
                                            <tr>
                                                <th>Block</th>
                                                <th>Size (KB)</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {blocks.map(function (b, i) {
                                                return (
                                                    <tr key={b.id}>
                                                        <td>
                                                            <span className="mem-process-id">
                                                                <span className={"mem-process-dot dot-color-" + colorIndex(i)} />
                                                                {b.id}
                                                            </span>
                                                        </td>
                                                        <td>{b.size}</td>
                                                        <td>
                                                            <button type="button" className="mem-delete-btn" onClick={function () { removeBlock(b.id); }}>✕</button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </>
                            )}

                            {activeTab === "processes" && (
                                <>
                                    {currentCpuAlgoDef.hasPreemptive && (
                                        <div className="mem-preemptive-toggle" style={{ marginBottom: "16px" }}>
                                            <button
                                                type="button"
                                                className={"mem-toggle-btn" + (!isPreemptive ? " active" : "")}
                                                onClick={function () {
                                                    setIsPreemptive(false);
                                                    setBackendResult(null);
                                                    setShowResults(false);
                                                }}
                                            >
                                                Non-Preemptive
                                            </button>

                                            <button
                                                type="button"
                                                className={"mem-toggle-btn" + (isPreemptive ? " active" : "")}
                                                onClick={function () {
                                                    setIsPreemptive(true);
                                                    setBackendResult(null);
                                                    setShowResults(false);
                                                }}
                                            >
                                                Preemptive
                                            </button>
                                        </div>
                                    )}

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
                                                    setBackendResult(null);
                                                    setShowResults(false);
                                                }}
                                            />
                                        </div>
                                    )}

                                    <div className="mem-task-form" style={{ flexWrap: "wrap" }}>
                                        <div className="mem-input-group" style={{ minWidth: "120px" }}>
                                            <label>Process Name</label>
                                            <input type="text" placeholder={"P" + nextProcId} value={formProcName} onChange={function (e) { setFormProcName(e.target.value); }} />
                                        </div>

                                        <div className="mem-input-group" style={{ minWidth: "100px" }}>
                                            <label>Size (KB)</label>
                                            <input type="number" placeholder="e.g. 150" min={1} value={formProcSize} onChange={function (e) { setFormProcSize(e.target.value); }} />
                                        </div>

                                        <div className="mem-input-group" style={{ minWidth: "100px" }}>
                                            <label>Arrival Time</label>
                                            <input type="number" placeholder="e.g. 0" min={0} value={formProcArrival} onChange={function (e) { setFormProcArrival(e.target.value); }} />
                                        </div>

                                        <div className="mem-input-group" style={{ minWidth: "100px" }}>
                                            <label>Burst Time</label>
                                            <input type="number" placeholder="e.g. 5" min={1} value={formProcBurst} onChange={function (e) { setFormProcBurst(e.target.value); }} />
                                        </div>

                                        {isPriority && (
                                            <div className="mem-input-group" style={{ minWidth: "80px" }}>
                                                <label>Priority</label>
                                                <input type="number" placeholder="e.g. 1" min={0} value={formProcPriority} onChange={function (e) { setFormProcPriority(e.target.value); }} />
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            className="mem-add-btn"
                                            disabled={!formProcSize || Number(formProcSize) <= 0}
                                            onClick={addProcess}
                                        >
                                            +
                                        </button>
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
                                                                <td>
                                                                    <span className="mem-process-id">
                                                                        <span className={"mem-process-dot dot-color-" + colorIndex(i)} />
                                                                        {p.id}
                                                                    </span>
                                                                </td>
                                                                <td>{p.size}</td>
                                                                <td>{p.arrivalTime}</td>
                                                                <td>{p.burstTime}</td>
                                                                {isPriority && <td>{p.priority}</td>}
                                                                <td>
                                                                    <button type="button" className="mem-delete-btn" onClick={function () { removeProcess(p.id); }}>✕</button>
                                                                </td>
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

                        {showResults && (
                            <section className="mem-results">
                                <div className="mem-results-header">
                                    <div>
                                        <h2>Allocation Results</h2>
                                        <p className="mem-results-algo-label">
                                            {selectedAlgo} · {selectedCpuAlgo} · {isCompaction ? "With Compaction" : "Without Compaction"}
                                        </p>
                                    </div>

                                    <div className="mem-metrics">
                                        <div className="mem-metric">
                                            <div className="mem-metric-label">Allocated</div>
                                            <div className="mem-metric-value">
                                                {backendResult ? backendResult.allocated : 0} / {processes.length}
                                            </div>
                                        </div>

                                        <div className="mem-metric">
                                            <div className="mem-metric-label">Internal Frag.</div>
                                            <div className="mem-metric-value">
                                                {backendResult ? backendResult.internalFragmentation : 0} KB
                                            </div>
                                        </div>

                                        <div className="mem-metric">
                                            <div className="mem-metric-label">External Frag.</div>
                                            <div className="mem-metric-value">
                                                {backendResult ? backendResult.externalFragmentation : 0} KB
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mem-results-layout">
                                    <div className="mem-visual-col">
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
                                                        onClick={function () {
                                                            setAutoPlay(false);
                                                            setCurrentTimeIndex(function (prev) { return Math.max(0, prev - 1); });
                                                        }}
                                                    >
                                                        Back
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="mem-ctrl-btn"
                                                        style={{ padding: "6px 12px", fontSize: "12px" }}
                                                        disabled={currentTimeIndex === activeTimeline.length - 1}
                                                        onClick={function () {
                                                            setAutoPlay(false);
                                                            setCurrentTimeIndex(function (prev) { return Math.min(activeTimeline.length - 1, prev + 1); });
                                                        }}
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
                                                        {MEM_SPEED_LABELS.map(function (label, i) {
                                                            return <option key={i} value={i + 1}>{label}</option>;
                                                        })}
                                                    </select>
                                                </div>
                                            </div>

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
                                                                <div className="mem-free-segment">Free Space</div>
                                                            )}

                                                            {block.processId && block.capacity > block.processSize && (
                                                                <div
                                                                    className="mem-frag-segment"
                                                                    style={{ height: ((block.capacity - block.processSize) / block.capacity) * 100 + "%" }}
                                                                    title={"Internal Fragmentation: " + (block.capacity - block.processSize) + " KB"}
                                                                >
                                                                    Frag: {block.capacity - block.processSize} KB
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

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
            )}

            {mainTab === "replacement" && (
                <div className="mem-content">
                    <aside className="mem-sidebar">
                        <h3>Page Replacement</h3>
                        {PAGE_ALGORITHMS.map(function (algo) {
                            return (
                                <button
                                    type="button"
                                    key={algo}
                                    className={"mem-algo-card" + (pageAlgorithm === algo ? " selected" : "")}
                                    onClick={function () {
                                        setPageAlgorithm(algo);
                                        setPageResult(null);
                                    }}
                                >
                                    {algo}
                                    <span className="algo-abbr">{algo}</span>
                                </button>
                            );
                        })}
                    </aside>

                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
                        <section className="mem-task-manager">
                            <div className="mem-task-header">
                                <div>
                                    <h2>Page Replacement</h2>
                                    <p>Configure reference string and frame count</p>
                                </div>

                                <div className="mem-controls">
                                    <button
                                        type="button"
                                        className="mem-ctrl-btn"
                                        onClick={function () {
                                            setPageString("7 0 1 2 0 3 0 4 2 3 0 3 2");
                                            setFrameCount(3);
                                            setPageResult(null);
                                        }}
                                    >
                                        Sample
                                    </button>

                                    <button
                                        type="button"
                                        className="mem-ctrl-btn danger-btn"
                                        onClick={function () {
                                            setPageString("");
                                            setFrameCount(3);
                                            setPageResult(null);
                                        }}
                                    >
                                        Clear
                                    </button>

                                    <button type="button" className="mem-ctrl-btn run-btn" onClick={runPageReplacement}>
                                        Run
                                    </button>
                                </div>
                            </div>

                            <div className="mem-task-form">
                                <div className="mem-input-group">
                                    <label>Reference String</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 7 0 1 2 0 3"
                                        value={pageString}
                                        onChange={function (e) {
                                            setPageString(e.target.value);
                                            setPageResult(null);
                                        }}
                                    />
                                </div>

                                <div className="mem-input-group" style={{ maxWidth: "220px" }}>
                                    <label>Frames</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={frameCount}
                                        onChange={function (e) {
                                            setFrameCount(Math.max(1, Number(e.target.value) || 1));
                                            setPageResult(null);
                                        }}
                                    />
                                </div>
                            </div>
                        </section>

                        {pageResult && (
                            <section className="mem-results">
                                <div className="mem-results-header">
                                    <div>
                                        <h2>Page Replacement Results</h2>
                                        <p className="mem-results-algo-label">{pageResult.algorithm}</p>
                                    </div>

                                    <div className="mem-metrics">
                                        <div className="mem-metric">
                                            <div className="mem-metric-label">Page Faults</div>
                                            <div className="mem-metric-value">{pageResult.totalPageFaults}</div>
                                        </div>

                                        <div className="mem-metric">
                                            <div className="mem-metric-label">Hits</div>
                                            <div className="mem-metric-value">{pageResult.totalHits}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mem-result-table-wrapper" style={{ marginTop: 0 }}>
                                    <h3>Step-by-Step Overview</h3>
                                    <table className="mem-result-table">
                                        <thead>
                                            <tr>
                                                <th>Step</th>
                                                <th>Page</th>
                                                <th>Frames</th>
                                                <th>Status</th>
                                                <th>Replaced</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pageResult.steps.map(function (step) {
                                                return (
                                                    <tr key={step.step}>
                                                        <td>{step.step}</td>
                                                        <td>{step.page}</td>
                                                        <td>{step.frames.map(function (frame) { return frame === null ? "—" : frame; }).join(" | ")}</td>
                                                        <td style={{ color: step.pageFault ? "#d9534f" : "#3B7A6A", fontWeight: 700 }}>
                                                            {step.pageFault ? "Page Fault" : "Hit"}
                                                        </td>
                                                        <td>{step.replacedPage === null ? "—" : step.replacedPage}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Memory_Management;
