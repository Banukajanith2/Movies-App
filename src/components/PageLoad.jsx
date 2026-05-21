import { useEffect, useState } from "react";
import Spinner from "./Spinner.jsx";

// Timeline:
//  0ms        "loading" begins — spinner + logo both visible
//  1000ms     spinner starts fading out (halfway through the 2s wait)
//  2000ms     "splatting" — only logo remains, centered, splats outward
//  2700ms     "done" — splash unmounted, app takes over

export default function PageLoad({ children }) {
  const [phase, setPhase]           = useState("loading");
  const [showSpinner, setShowSpinner] = useState(true);

  useEffect(() => {
    // Fade spinner out at the halfway point
    const spinnerTimer = setTimeout(() => setShowSpinner(false), 1000);
    // Trigger splat at 2s
    const splatTimer   = setTimeout(() => setPhase("splatting"), 2000);
    // Unmount splash after splat finishes
    const doneTimer    = setTimeout(() => setPhase("done"), 2700);

    return () => {
      clearTimeout(spinnerTimer);
      clearTimeout(splatTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  const isSplatting = phase === "splatting";
  const isDone      = phase === "done";

  return (
    <>
      {/* App — always mounted in background */}
      <div
        style={{
          opacity:    isDone ? 1 : isSplatting ? 1 : 0,
          filter:     isDone ? "none" : isSplatting ? "blur(0px)" : "blur(12px)",
          transform:  isDone ? "none" : isSplatting ? "scale(1)"  : "scale(0.97)",
          transition: isSplatting
            ? "opacity 0.5s ease-out, filter 0.6s ease-out, transform 0.6s ease-out"
            : "none",
          pointerEvents: isDone ? "auto" : "none",
        }}
      >
        {children}
      </div>

      {/* Splash overlay */}
      {!isDone && (
        <div
          className="fixed inset-0 z-[9999]"
          style={{
            backgroundColor: "#0f0d23",
            // Whole background fades after splat starts
            opacity:    isSplatting ? 0 : 1,
            transition: isSplatting ? "opacity 0.6s ease-in 0.1s" : "none",
            pointerEvents: "none",
          }}
        >
          {/* Spinner — sits above the logo, fades out at 1000ms */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: "translateY(-90px)",
              opacity:    showSpinner ? 1 : 0,
              transition: "opacity 0.4s ease-in-out",
            }}
          >
            <Spinner />
          </div>

          {/* Logo — always absolutely centred, never moves */}
          <div className="absolute inset-0 flex items-center justify-center">
            <h1
              className="font-bold select-none text-center"
              style={{
                fontSize: "clamp(2rem, 6vw, 3.5rem)",
                background: "linear-gradient(90deg, #D6C7FF, #6366f1)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                // Splat: scale up + fade
                transform:  isSplatting ? "scale(18)" : "scale(1)",
                opacity:    isSplatting ? 0            : 1,
                transition: isSplatting
                  ? "transform 3.0s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease-in"
                  : "none",
                transformOrigin: "center center",
                willChange: "transform, opacity",
              }}
            >
              EZ Movies
            </h1>
          </div>
        </div>
      )}
    </>
  );
}
