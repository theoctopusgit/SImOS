import React from "react";
import "./Docs.css";

interface AlgoCardProps {
  abbr: string;
  name: string;
  children: React.ReactNode;
}

const AlgoCard: React.FC<AlgoCardProps> = ({ abbr, name, children }) => (
  <div className="docs-algo-card">
    <span className="docs-algo-abbr">{abbr}</span>
    <h4>{name}</h4>
    <p>{children}</p>
  </div>
);

const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="docs-note">
    <span className="docs-note-icon">i</span>
    <p>{children}</p>
  </div>
);

const NAV_SECTIONS = [
  { id: "getting-started", label: "Getting Started" },
  { id: "cpu-scheduling", label: "CPU Scheduling" },
  { id: "memory-management", label: "Memory Management" },
  { id: "virtual-memory", label: "Virtual Memory" },
  { id: "disk-scheduling", label: "Disk Scheduling" },
];

export const Docs: React.FC = () => {
  const handleJump = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="docs-app">
      <header className="docs-hero">
        <span className="docs-pill">Documentation</span>
        <h1>Understanding SImOS</h1>
        <p>What each algorithm actually does, and how to drive every simulator on this site.</p>
      </header>

      <nav className="docs-toc">
        {NAV_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className="docs-toc-link"
            onClick={() => handleJump(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {/* ───────────────────────── Getting Started ───────────────────────── */}
      <section id="getting-started" className="docs-section">
        <h2>Getting Started</h2>
        <p className="docs-section-sub">
          SImOS simulates four classic operating-system subsystems — CPU scheduling, memory
          management, virtual memory, and disk (mass storage) scheduling. Every page works the
          same way: configure the inputs on the left/top, run the simulation, and read the
          results in the table or chart that appears below.
        </p>
        <Note>
          The simulations run on a FastAPI backend. Make sure the backend is started with
          <code> uvicorn app.main:app --reload</code> from the <code>backend/</code> folder before
          running anything — if a page can't reach the server, you'll see a "Could not reach the
          server" or "Failed to connect to backend" error instead of results.
        </Note>
      </section>

      {/* ───────────────────────── CPU Scheduling ───────────────────────── */}
      <section id="cpu-scheduling" className="docs-section">
        <h2>CPU Scheduling</h2>
        <p className="docs-section-sub">
          CPU scheduling decides which waiting process gets the processor next. The goal is
          usually to balance fairness, responsiveness, and total throughput.
        </p>

        <h3>How it works</h3>
        <div className="docs-card-grid">
          <AlgoCard abbr="FCFS" name="First Come, First Served">
            Processes run strictly in arrival order, with no preemption. Simple to reason about,
            but a single long process can hold up everything behind it (the "convoy effect").
          </AlgoCard>
          <AlgoCard abbr="SJF / SRTF" name="Shortest Job First">
            Always runs whichever waiting process has the smallest burst time. The preemptive
            version (SRTF) can interrupt a running process if a newly-arrived job is shorter.
            Minimizes average waiting time, but long jobs can starve.
          </AlgoCard>
          <AlgoCard abbr="Priority" name="Priority Scheduling">
            Each process carries a priority value; the highest-priority waiting process runs
            next. Can be preemptive or non-preemptive. Low-priority jobs risk starvation unless
            priorities are "aged" upward over time.
          </AlgoCard>
          <AlgoCard abbr="RR" name="Round Robin">
            Every process gets a fixed time slice (the quantum) before being rotated to the back
            of the queue. Always preemptive. Fair and responsive, but a poorly-sized quantum
            hurts throughput.
          </AlgoCard>
        </div>

        <h3>How to use this page</h3>
        <ol className="docs-steps">
          <li>Add each process with an ID, arrival time, and burst time (and a priority value, if you're using Priority Scheduling).</li>
          <li>Choose an algorithm from the dropdown.</li>
          <li>Toggle <strong>Preemptive</strong> if the algorithm has a preemptive mode (SRTF, preemptive priority).</li>
          <li>Set a <strong>Quantum</strong> if you're running Round Robin.</li>
          <li>Run the simulation to see the Gantt chart, plus each process's waiting/turnaround/completion time and the overall averages.</li>
        </ol>
      </section>

      {/* ───────────────────────── Memory Management ───────────────────────── */}
      <section id="memory-management" className="docs-section">
        <h2>Memory Management</h2>
        <p className="docs-section-sub">
          Memory management decides where each process gets placed inside a set of fixed memory
          blocks (partitions), and how much space is wasted in the process.
        </p>

        <h3>How it works</h3>
        <div className="docs-card-grid">
          <AlgoCard abbr="First Fit" name="First Fit">
            Scans blocks from the start and allocates the process to the first block that's big
            enough. Fast, but can leave awkward small gaps near the front of memory.
          </AlgoCard>
          <AlgoCard abbr="Best Fit" name="Best Fit">
            Allocates the smallest block that's still big enough for the process, minimizing
            leftover space in that block — at the cost of leaving lots of tiny unusable holes
            elsewhere.
          </AlgoCard>
          <AlgoCard abbr="Worst Fit" name="Worst Fit">
            Allocates the largest available block, on the theory that the leftover space stays
            big enough to be useful for a future process.
          </AlgoCard>
          <AlgoCard abbr="Next Fit" name="Next Fit">
            Like First Fit, but resumes scanning from wherever the last allocation left off
            instead of restarting from the beginning every time.
          </AlgoCard>
        </div>

        <h3>How to use this page</h3>
        <ol className="docs-steps">
          <li>Define your memory blocks — an ID and a size for each partition.</li>
          <li>Define your processes — an ID and a size (plus arrival/burst/priority, if the scheduling algorithm you pick needs them to decide ordering).</li>
          <li>Pick an <strong>allocation algorithm</strong> (how a block is chosen) and a <strong>scheduling algorithm</strong> (the order processes are considered in).</li>
          <li>Toggle <strong>Compaction</strong> if you want free holes merged together to reduce external fragmentation.</li>
          <li>Run to see which block each process landed in, the internal fragmentation per allocation, and the totals for internal vs. external fragmentation.</li>
        </ol>
      </section>

      {/* ───────────────────────── Virtual Memory ───────────────────────── */}
      <section id="virtual-memory" className="docs-section">
        <h2>Virtual Memory</h2>
        <p className="docs-section-sub">
          Virtual memory lets a process use more address space than physically exists, by keeping
          only some pages in real memory frames and swapping the rest in on demand. When every
          frame is full and a new page is needed, a replacement algorithm decides who gets evicted.
        </p>

        <h3>How it works</h3>
        <div className="docs-card-grid">
          <AlgoCard abbr="FIFO" name="First In, First Out">
            Evicts whichever page has been resident the longest, regardless of how often it's
            actually used.
          </AlgoCard>
          <AlgoCard abbr="LRU" name="Least Recently Used">
            Evicts the page that hasn't been touched for the longest time — a good real-world
            approximation of future usage, based on recent history.
          </AlgoCard>
          <AlgoCard abbr="OPT" name="Optimal">
            Evicts whichever page won't be needed again for the longest time. This requires
            knowing the future access sequence, so it's a theoretical best-case used here purely
            as a benchmark.
          </AlgoCard>
          <AlgoCard abbr="Clock / 2nd Chance" name="Clock (Second Chance)">
            A cheap approximation of LRU: a circular pointer sweeps over frames, giving each page
            a "use" bit. A page with its bit set gets spared once (its bit is cleared instead),
            avoiding the bookkeeping cost of true LRU.
          </AlgoCard>
          <AlgoCard abbr="MFU" name="Most Frequently Used">
            Evicts the page that has been accessed the most so far, on the theory that a
            heavily-used page has already "had its turn." Ties break by earliest load order.
          </AlgoCard>
        </div>

        <p className="docs-section-sub">
          Alongside whichever algorithm you pick, a small Translation Lookaside Buffer (TLB) is
          simulated too — a 4-entry LRU cache of recent page→frame translations, shown separately
          as hits/misses so you can see how much it speeds up address lookups.
        </p>

        <h3>How to use this page</h3>
        <ol className="docs-steps">
          <li>Set the <strong>memory size</strong> and <strong>page size</strong> — the number of frames is memory size ÷ page size.</li>
          <li>Enter the <strong>access sequence</strong>: the page numbers referenced, in order.</li>
          <li>Pick a page-replacement algorithm.</li>
          <li>Run to see the resulting page table, TLB contents, frame state, total page faults, and the step-by-step access log with the final hit ratio.</li>
        </ol>
      </section>

      {/* ───────────────────────── Disk Scheduling ───────────────────────── */}
      <section id="disk-scheduling" className="docs-section">
        <h2>Disk Scheduling</h2>
        <p className="docs-section-sub">
          Disk scheduling decides the order in which pending I/O requests are served, to minimize
          how far the physical disk head has to travel across tracks.
        </p>

        <h3>How it works</h3>
        <div className="docs-card-grid">
          <AlgoCard abbr="FCFS" name="First Come, First Served">
            Services requests strictly in the order they arrived. Simple, but can cause long,
            unnecessary seeks if requests are scattered across the disk.
          </AlgoCard>
          <AlgoCard abbr="SSTF" name="Shortest Seek Time First">
            Always jumps to whichever pending request is physically closest to the current head
            position. Minimizes seek distance step-by-step, but can starve far-away requests if
            closer ones keep arriving.
          </AlgoCard>
          <AlgoCard abbr="SCAN" name="SCAN (Elevator)">
            The head sweeps in one direction, servicing every request in its path, until it
            reaches the end of the disk — then reverses and sweeps back.
          </AlgoCard>
          <AlgoCard abbr="C-SCAN" name="Circular SCAN">
            Like SCAN, but instead of reversing at the end of the disk, the head jumps straight
            back to the start and sweeps the same direction again — giving more even wait times.
          </AlgoCard>
          <AlgoCard abbr="LOOK" name="LOOK">
            Like SCAN, but reverses at the last actual request instead of travelling all the way
            to the physical edge of the disk when there's nothing left to service out there.
          </AlgoCard>
          <AlgoCard abbr="C-LOOK" name="Circular LOOK">
            Like C-SCAN, but the wrap-around jump happens at the last request rather than the
            physical edge of the disk.
          </AlgoCard>
        </div>

        <h3>How to use this page</h3>
        <ol className="docs-steps">
          <li>Pick an algorithm from the dropdown.</li>
          <li>Set the <strong>Max Track/Disk Size</strong> (defaults to 200; it auto-expands if your queue references a larger track).</li>
          <li>For SCAN-family algorithms, also choose a sweep <strong>Direction</strong> — towards track 0, or towards the highest track.</li>
          <li>Set the <strong>Initial Head</strong> position.</li>
          <li>Enter the <strong>Request Queue</strong> as comma-separated track numbers, or click <strong>Sample</strong> to autofill one.</li>
          <li>Click <strong>Run</strong> — results show total head movement, the seek-path chart, and a step-by-step movement log.</li>
        </ol>
      </section>
    </div>
  );
};

export default Docs;