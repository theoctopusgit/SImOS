import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import IntroLogo from "./components/IntroLogo";
import Navbar from "./components/Navbar";
import CPU_Scheduling from "./components/CPU_Scheduling";
import Memory_Management from "./components/MemoryManagement";
import "./App.css";

function AppContent() {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-page">
        <Routes>
          <Route path="/cpu-scheduling" element={<CPU_Scheduling />} />
          <Route path="/memory-management" element={<Memory_Management />} />
          <Route path="*" element={<Navigate to="/cpu-scheduling" replace />} />
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