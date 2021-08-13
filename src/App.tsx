import { useCallback, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { scanImageData } from "zbar.wasm";

const DELAY_MS = 500;

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!;

function asyncDelay(ms: number) {
  return new Promise((res) => window.setTimeout(res, ms));
}

function getImageDataFromVideo(videoElement: HTMLVideoElement) {
  const { videoWidth, videoHeight } = videoElement;
  canvas.width = videoWidth;
  canvas.height = videoHeight;
  ctx.drawImage(videoElement, 0, 0);
  return ctx.getImageData(0, 0, videoWidth, videoHeight);
}

function BarcodeScanner({
  onDetected,
}: {
  onDetected: (barcodeText: string) => void;
}) {
  const [videoElement, setVideoElement] = useState<Webcam | null>(null);

  useEffect(() => {
    if (!videoElement?.video) return;
    let mounted = true;

    const startScan = async () => {
      if (!mounted) return;

      if (videoElement.video?.videoWidth) {
        const imageData = getImageDataFromVideo(videoElement.video);
        const scanData = await scanImageData(imageData);
        if (scanData.length) {
          const barcodeText = scanData[0].decode();
          onDetected(barcodeText);
        }
      }

      await asyncDelay(DELAY_MS);
      window.requestAnimationFrame(startScan);
    };

    startScan();

    return () => {
      mounted = false;
    };
  }, [videoElement, onDetected]);

  return (
    <Webcam
      ref={(el) => setVideoElement(el)}
      className="BarcodeScanner"
      videoConstraints={{
        facingMode: "environment",
        width: { max: 600 },
        height: { max: 600 },
      }}
      audio={false}
    />
  );
}

function BarcodesList({ barcodes }: { barcodes: string[] }) {
  const handleShare = () => {
    navigator.share({ text: barcodes.join("\n") });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(barcodes.join("\n"));
  };

  return (
    <section className="BarcodesList">
      <header>
        <button disabled={!barcodes.length} onClick={handleShare}>
          Share List
        </button>

        <button disabled={!barcodes.length} onClick={handleCopy}>
          Copy All
        </button>
      </header>

      {barcodes.map((barcodeText) => (
        <main className="BarcodesListItem" key={barcodeText}>
          {barcodeText}
        </main>
      ))}
    </section>
  );
}

function App() {
  const [barcodes, setBarcodes] = useState<string[]>([]);

  const handleBarcodeDetected = useCallback((detectedCode) => {
    console.debug({ detectedCode });

    setBarcodes((prev) => {
      // prevent duplicate barcodes
      if (prev.includes(detectedCode)) return prev;

      return [detectedCode, ...prev];
    });
  }, []);

  return (
    <div className="App">
      <BarcodeScanner onDetected={handleBarcodeDetected} />
      <BarcodesList barcodes={barcodes} />
    </div>
  );
}

export default App;
