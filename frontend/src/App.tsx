import { useEffect, useState } from "react";
import IntroLogo from "./components/IntroLogo";
import CPU_Scheduling from "./components/CPU_Scheduling";

function App() {
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIntro(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return intro ? <IntroLogo /> : <CPU_Scheduling />;
}

export default App;