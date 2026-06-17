import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import IntroLogo from "./components/IntroLogo";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import CPU_Scheduling from "./components/CPU_Scheduling";
import Memory_Management from "./components/MemoryManagement";
import "./App.css";
import VirtualMemory from "./components/VirtualMemory";
import About from "./components/About";
import ScrollToTop from "./components/ScrollToTop";
import DiskScheduling from "./components/DiskScheduling";

function AppContent() {
  return (
    <div className="app-shell">
      <ScrollToTop />
      <Navbar />
      <div className="app-page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cpu-scheduling" element={<CPU_Scheduling />} />
          <Route path="/memory-management" element={<Memory_Management />} />
          <Route path="/virtual-memory" element={<VirtualMemory />} />
          <Route path="/mass-storage" element={<DiskScheduling />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIntro(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  if (intro) return <IntroLogo />;

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;