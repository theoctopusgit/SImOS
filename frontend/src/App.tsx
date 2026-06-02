import { useEffect, useState } from "react";
import IntroLogo from "./components/IntroLogo";

function App() {
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIntro(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return intro ? <IntroLogo /> : <MainPage />;
}

function MainPage() {
  return <h1>Natatae ako</h1>;
}

export default App;