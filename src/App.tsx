import { useEffect, useState } from "react";
import { BagProvider } from "./state/bag";
import { initSmoothScroll, scrollToId } from "./lib/motion";
import { TopBar } from "./components/TopBar";
import { TryTheLook } from "./components/hero/TryTheLook";
import { BagDrawer } from "./components/commerce/BagDrawer";
import { Toast } from "./components/commerce/Toast";
import { Lookbook } from "./components/sections/Lookbook";
import { Pieces } from "./components/sections/Pieces";
import { MadeInLagos } from "./components/sections/MadeInLagos";
import { Footer, Newsletter } from "./components/sections/Closing";

export default function App() {
  const [focus, setFocus] = useState(2); // opens on Look 03

  useEffect(() => {
    initSmoothScroll();
  }, []);

  return (
    <BagProvider>
      <a href="#try" className="sr-only">Skip to the lineup</a>
      <TopBar />
      <main>
        <TryTheLook focus={focus} setFocus={setFocus} />
        <Lookbook
          onTry={(i) => {
            setFocus(i);
            scrollToId("try");
          }}
        />
        <Pieces />
        <MadeInLagos />
        <Newsletter />
      </main>
      <Footer />
      <BagDrawer />
      <Toast />
    </BagProvider>
  );
}
