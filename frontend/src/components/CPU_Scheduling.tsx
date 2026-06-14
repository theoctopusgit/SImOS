import { useState } from "react";
import "./CPU_Scheduling.css";

/* ── Types ── */
interface Process {
  id: string;
  burstTime: number;
  arrivalTime: number;
  priority: number;
}

interface GanttBlock {
  pid: string;
  start: number;
  end: number;
}

interface ProcessResult {
  id: string;
  arrivalTime: number;
  burstTime: number;
  startTime: number;
  completionTime: number;
  waitingTime: number;
  turnaroundTime: number;
}

/* ── Algorithm list ── */
const ALGORITHMS = [
  { name: "First Come First Serve", abbr: "FCFS", hasPreemptive: false },
  { name: "Shortest Job First", abbr: "SJF", hasPreemptive: true },
  { name: "Round Robin", abbr: "RR", hasPreemptive: false },
  { name: "Priority Scheduling", abbr: "PRIORITY", hasPreemptive: true },
] as const;

type AlgorithmName = (typeof ALGORITHMS)[number]["name"];

/* ── Colors ── */
const COLORS = 8;
const colorIndex = (i: number) => i % COLORS;

/* ── Single predefined demo result (visual only) ── */
const DEMO_GANTT: GanttBlock[] = [
  { pid: "P1", start: 0, end: 6 },
  { pid: "P2", start: 6, end: 14 },
  { pid: "P3", start: 14, end: 17 },
  { pid: "P4", start: 17, end: 21 },
];

const DEMO_DETAILS: ProcessResult[] = [
  { id: "P1", arrivalTime: 0, burstTime: 6, startTime: 0, completionTime: 6, waitingTime: 0, turnaroundTime: 6 },
  { id: "P2", arrivalTime: 1, burstTime: 8, startTime: 6, completionTime: 14, waitingTime: 5, turnaroundTime: 13 },
  { id: "P3", arrivalTime: 2, burstTime: 3, startTime: 14, completionTime: 17, waitingTime: 12, turnaroundTime: 15 },
  { id: "P4", arrivalTime: 3, burstTime: 4, startTime: 17, completionTime: 21, waitingTime: 14, turnaroundTime: 18 },
];

const DEMO_RESULT = {
  gantt: DEMO_GANTT,
  details: DEMO_DETAILS,
  avgWaiting: 7.75,
  avgTurnaround: 13.0,
};

/* ── Gantt color map (fixed to P1-P4) ── */
const GANTT_COLOR_MAP = new Map([["P1", 0], ["P2", 1], ["P3", 2], ["P4", 3]]);

/* ═══════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════ */

function CPU_Scheduling() {
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmName>("First Come First Serve");
  const [isPreemptive, setIsPreemptive] = useState(false);
  const [processes, setProcesses] = useState<Process[]>([
    { id: "P1", burstTime: 6, arrivalTime: 0, priority: 2 },
    { id: "P2", burstTime: 8, arrivalTime: 1, priority: 1 },
    { id: "P3", burstTime: 3, arrivalTime: 2, priority: 4 },
    { id: "P4", burstTime: 4, arrivalTime: 3, priority: 3 },
  ]);
  const [showResults, setShowResults] = useState(false);
  const [quantum, setQuantum] = useState(2);
  const [nextId, setNextId] = useState(5);

  const [formPid, setFormPid] = useState("");
  const [formBurst, setFormBurst] = useState("");
  const [formArrival, setFormArrival] = useState("");
  const [formPriority, setFormPriority] = useState("");

  const currentAlgoDef = ALGORITHMS.find((a) => a.name === selectedAlgo)!;
  const isPriority = selectedAlgo === "Priority Scheduling";
  const isRR = selectedAlgo === "Round Robin";

  /* ── Handlers ── */
  function addProcess() {
    const pid = formPid.trim() !== "" ? formPid.trim() : "P" + nextId;
    const burst = Number(formBurst) > 0 ? Number(formBurst) : 1;
    const arrival = Number(formArrival) >= 0 ? Number(formArrival) : 0;
    const priority = Number(formPriority) >= 0 ? Number(formPriority) : 0;

    for (const p of processes) {
      if (p.id === pid) {
        alert('Process "' + pid + '" already exists.');
        return;
      }
    }

    const newProcess: Process = { id: pid, burstTime: burst, arrivalTime: arrival, priority };
    setProcesses(function (prev) { return [...prev, newProcess]; });
    setNextId(function (prev) { return prev + 1; });
    setFormPid("");
    setFormBurst("");
    setFormArrival("");
    setFormPriority("");
    setShowResults(false);
  }

  function removeProcess(pid: string) {
    setProcesses(function (prev) { return prev.filter(function (p) { return p.id !== pid; }); });
    setShowResults(false);
  }

  function clearAll() {
    setProcesses([]);
    setNextId(1);
    setShowResults(false);
  }

  function loadSample() {
    setProcesses([
      { id: "P1", burstTime: 6, arrivalTime: 0, priority: 2 },
      { id: "P2", burstTime: 8, arrivalTime: 1, priority: 1 },
      { id: "P3", burstTime: 3, arrivalTime: 2, priority: 4 },
      { id: "P4", burstTime: 4, arrivalTime: 3, priority: 3 },
    ]);
    setNextId(5);
    setShowResults(false);
  }

  function runSimulation() {
    if (processes.length === 0) return;
    // TODO: call FastAPI backend here
    setShowResults(true);
  }

  /* ═══════ Render ═══════ */
  return (
    <div className="cpu-app">
      {/* Tabs */}
      <div className="cpu-tabs">
        <button type="button" className="cpu-tab active">Algorithm Simulation</button>
        <button type="button" className="cpu-tab">Compare Algorithms</button>
      </div>

      {/* Main Content */}
      <div className="cpu-content">
        {/* Sidebar */}
        <aside className="cpu-sidebar">
          <h3>Select Algorithm</h3>
          {ALGORITHMS.map(function (algo) {
            return (
              <button
                type="button"
                key={algo.name}
                className={"cpu-algo-card" + (selectedAlgo === algo.name ? " selected" : "")}
                onClick={function () {
                  setSelectedAlgo(algo.name);
                  setIsPreemptive(false);
                  setShowResults(false);
                }}
              >
                {algo.name}
                <span className="algo-abbr">{algo.abbr}</span>
              </button>
            );
          })}
        </aside>

        {/* Task Manager */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
          <section className="cpu-task-manager">
            <div className="cpu-task-header">
              <div>
                <h2>Task Manager</h2>
                <p>Add, edit, or remove processes for simulation</p>
              </div>
              <div className="cpu-controls">
                <button type="button" className="cpu-ctrl-btn" onClick={loadSample}>📋 Sample</button>
                <button type="button" className="cpu-ctrl-btn danger-btn" onClick={clearAll}>🗑 Clear</button>
                <button
                  type="button"
                  className="cpu-ctrl-btn run-btn"
                  onClick={runSimulation}
                  disabled={processes.length === 0}
                >
                  ▶ Run
                </button>
              </div>
            </div>

            {/* Preemptive toggle */}
            {currentAlgoDef.hasPreemptive && (
              <div className="cpu-preemptive-toggle">
                <button
                  type="button"
                  className={"cpu-toggle-btn" + (!isPreemptive ? " active" : "")}
                  onClick={function () { setIsPreemptive(false); setShowResults(false); }}
                >
                  Non-Preemptive
                </button>
                <button
                  type="button"
                  className={"cpu-toggle-btn" + (isPreemptive ? " active" : "")}
                  onClick={function () { setIsPreemptive(true); setShowResults(false); }}
                >
                  Preemptive
                  {selectedAlgo === "Shortest Job First" && <span className="toggle-hint"> (SRTF)</span>}
                </button>
              </div>
            )}

            {/* Quantum */}
            {isRR && (
              <div className="cpu-quantum-section">
                <label>Time Quantum:</label>
                <input
                  type="number"
                  min={1}
                  value={quantum}
                  onChange={function (e) {
                    setQuantum(Math.max(1, parseInt(e.target.value) || 1));
                    setShowResults(false);
                  }}
                />
              </div>
            )}

            {/* Input Form */}
            <div className="cpu-task-form">
              <div className="cpu-input-group">
                <label>Process ID</label>
                <input
                  placeholder={"P" + nextId}
                  value={formPid}
                  onChange={function (e) { setFormPid(e.target.value); }}
                  onKeyDown={function (e) { if (e.key === "Enter") { e.preventDefault(); addProcess(); } }}
                />
              </div>
              <div className="cpu-input-group">
                <label>Burst Time</label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  min={1}
                  value={formBurst}
                  onChange={function (e) { setFormBurst(e.target.value); }}
                  onKeyDown={function (e) { if (e.key === "Enter") { e.preventDefault(); addProcess(); } }}
                />
              </div>
              <div className="cpu-input-group">
                <label>Arrival Time</label>
                <input
                  type="number"
                  placeholder="e.g. 0"
                  min={0}
                  value={formArrival}
                  onChange={function (e) { setFormArrival(e.target.value); }}
                  onKeyDown={function (e) { if (e.key === "Enter") { e.preventDefault(); addProcess(); } }}
                />
              </div>
              {isPriority && (
                <div className="cpu-input-group">
                  <label>Priority</label>
                  <input
                    type="number"
                    placeholder="e.g. 1"
                    min={0}
                    value={formPriority}
                    onChange={function (e) { setFormPriority(e.target.value); }}
                    onKeyDown={function (e) { if (e.key === "Enter") { e.preventDefault(); addProcess(); } }}
                  />
                </div>
              )}
              <button type="button" className="cpu-add-btn" onClick={function () { addProcess(); }}>+</button>
            </div>

            {/* Process Table */}
            <div className="cpu-table-container">
              {processes.length === 0 ? (
                <div className="cpu-empty-state">
                  <div className="cpu-empty-icon">⚙️</div>
                  <h4>No processes yet</h4>
                  <p>Add processes above or load sample data to get started</p>
                </div>
              ) : (
                <table className="cpu-table">
                  <thead>
                    <tr>
                      <th>Process</th>
                      <th>Burst Time</th>
                      <th>Arrival Time</th>
                      {isPriority && <th>Priority</th>}
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {processes.map(function (p, i) {
                      return (
                        <tr key={p.id}>
                          <td>
                            <span className="cpu-process-id">
                              <span className={"cpu-process-dot dot-color-" + colorIndex(i)} />
                              {p.id}
                            </span>
                          </td>
                          <td>{p.burstTime}</td>
                          <td>{p.arrivalTime}</td>
                          {isPriority && <td>{p.priority}</td>}
                          <td>
                            <button
                              type="button"
                              className="cpu-delete-btn"
                              onClick={function () { removeProcess(p.id); }}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Results (predefined demo) */}
          {showResults && (
            <section className="cpu-results">
              <div className="cpu-results-header">
                <div>
                  <h2>Simulation Results</h2>
                  <p className="cpu-results-algo-label">
                    {selectedAlgo}
                    {currentAlgoDef.hasPreemptive && (isPreemptive ? " (Preemptive)" : " (Non-Preemptive)")}
                    {isRR && " · Q=" + quantum}
                  </p>
                </div>
                <div className="cpu-metrics">
                  <div className="cpu-metric">
                    <div className="cpu-metric-label">Avg Waiting</div>
                    <div className="cpu-metric-value">{DEMO_RESULT.avgWaiting.toFixed(2)}</div>
                  </div>
                  <div className="cpu-metric">
                    <div className="cpu-metric-label">Avg Turnaround</div>
                    <div className="cpu-metric-value">{DEMO_RESULT.avgTurnaround.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Gantt Chart */}
              <div className="cpu-gantt-wrapper">
                <div className="cpu-gantt">
                  {DEMO_RESULT.gantt.map(function (block, i) {
                    const isIdle = block.pid === "idle";
                    const ci = isIdle ? 0 : (GANTT_COLOR_MAP.get(block.pid) ?? 0);
                    const widthUnits = block.end - block.start;
                    return (
                      <div
                        key={block.pid + "-" + block.start + "-" + i}
                        className={"cpu-gantt-block " + (isIdle ? "idle-block" : "process-color-" + ci)}
                        style={{ flex: widthUnits, animationDelay: i * 0.06 + "s" }}
                      >
                        {isIdle ? "—" : block.pid}
                        <span className="cpu-gantt-time">{block.start}–{block.end}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detail Table */}
              <div className="cpu-result-table-wrapper">
                <h3>Process Details</h3>
                <table className="cpu-result-table">
                  <thead>
                    <tr>
                      <th>Process</th>
                      <th>Arrival</th>
                      <th>Burst</th>
                      <th>Start</th>
                      <th>Completion</th>
                      <th>Waiting</th>
                      <th>Turnaround</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_RESULT.details.map(function (d) {
                      return (
                        <tr key={d.id}>
                          <td>{d.id}</td>
                          <td>{d.arrivalTime}</td>
                          <td>{d.burstTime}</td>
                          <td>{d.startTime}</td>
                          <td>{d.completionTime}</td>
                          <td>{d.waitingTime}</td>
                          <td>{d.turnaroundTime}</td>
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
    </div>
  );
}

export default CPU_Scheduling;