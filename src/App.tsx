import { memo, useEffect, useMemo, useRef, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { loadHeartShape } from "@tsparticles/shape-heart";
import "./App.css";

type Stats = {
  yesClicks: number;
  noClicks: number;
};

const ParticlesBackground = memo(function ParticlesBackground({
  options,
}: {
  options: Record<string, unknown>;
}) {
  return (
    <div className="particles-layer" aria-hidden="true">
      <Particles
        id="heart-particles"
        options={options}
        className="particles-canvas"
      />
    </div>
  );
});

const STORAGE_KEY = "valloween-stats";

const readStats = (): Stats | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<Stats>;
    const yesClicks = Number(parsed.yesClicks ?? 0);
    const noClicks = Number(parsed.noClicks ?? 0);

    if (Number.isNaN(yesClicks) || Number.isNaN(noClicks)) {
      return null;
    }

    return {
      yesClicks,
      noClicks,
    };
  } catch {
    return null;
  }
};

function App() {
  const [particlesReady, setParticlesReady] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [yesClicks, setYesClicks] = useState(0);
  const [noClicks, setNoClicks] = useState(0);
  const [noPos, setNoPos] = useState({ x: 16, y: 24 });
  const [noFree, setNoFree] = useState(false);
  const noRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
      await loadHeartShape(engine);
    }).then(() => setParticlesReady(true));
  }, []);

  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 640px)").matches;
  const particleCount = isMobile ? 130 : 90;
  const densityArea = isMobile ? 650 : 1200;
  const sizeRange = isMobile ? { min: 8, max: 16 } : { min: 10, max: 20 };

  const particlesOptions = useMemo(
    () => ({
      fullScreen: {
        enable: false,
      },
      detectRetina: false,
      fpsLimit: 30,
      pauseOnBlur: true,
      pauseOnOutsideViewport: true,
      particles: {
        number: {
          value: particleCount,
          density: {
            enable: true,
            area: densityArea,
          },
        },
        color: {
          value: ["#0b0a0f", "#1c0f16", "#d21f3c", "#ff4c80"],
        },
        shape: {
          type: "heart",
        },
        opacity: {
          value: { min: 0.55, max: 0.9 },
        },
        size: {
          value: sizeRange,
        },
        rotate: {
          value: { min: 0, max: 360 },
          direction: "random",
          animation: {
            enable: true,
            speed: 6,
          },
        },
        move: {
          direction: "top",
          enable: true,
          speed: { min: 0.6, max: 1 },
          outModes: {
            default: "out",
          },
        },
      },
    }),
    [],
  );

  const pinNoButtonToCurrent = () => {
    const button = noRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    setNoPos({ x: rect.left, y: rect.top });
  };

  const moveNoButton = () => {
    const button = noRef.current;
    if (!button) return;

    const padding = 16;
    const buttonRect = button.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;

    const maxX = Math.max(padding, viewportWidth - buttonRect.width - padding);
    const maxY = Math.max(
      padding,
      viewportHeight - buttonRect.height - padding,
    );

    const x = padding + Math.random() * Math.max(0, maxX - padding);
    const y = padding + Math.random() * Math.max(0, maxY - padding);

    setNoPos({ x, y });
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ yesClicks, noClicks }));
  }, [yesClicks, noClicks]);

  useEffect(() => {
    const id = requestAnimationFrame(moveNoButton);
    const onResize = () => moveNoButton();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const handleYes = () => {
    setYesClicks((current) => current + 1);
    setAccepted(true);
  };

  const handleNo = () => {
    setNoClicks((current) => current + 1);
    if (!noFree) {
      pinNoButtonToCurrent();
      setNoFree(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => moveNoButton());
      });
      return;
    }
    setNoFree(true);
    moveNoButton();
  };

  const handleNoHover = () => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }

    if (!noFree) {
      pinNoButtonToCurrent();
      setNoFree(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => moveNoButton());
      });
      return;
    }

    moveNoButton();
  };

  return (
    <main className="app-shell">
      {particlesReady ? (
        <ParticlesBackground options={particlesOptions} />
      ) : null}
      <section className="card-shell">
        <div className="glow-orb" />
        <div className="glow-orb glow-orb--secondary" />

        <div className="text-center space-y-4 fade-in-up">
          <h1 className="title">
            Will you
            <br />
            be my
            <br />
            Valentine?
          </h1>
          <p className="subtitle">
            A haunted vow for Isy: bouldering by dusk, Chainsaw Man by night,
            and a haunted yes in between.
          </p>
        </div>

        {accepted ? (
          <div className="success-panel fade-in-up">
            <h2 className="success-title">The ritual is complete.</h2>
            <p className="success-text">
              You said yes, my eerie muse. First we chase the wall, then drift
              into the fresh Chainsaw Man night. And there might be a few
              dark-sweet surprises waiting for you.
            </p>
            <p className="success-subtext">Isy, see you on our haunted date.</p>
          </div>
        ) : (
          <>
            <div className="button-row fade-in-up">
              <button type="button" className="btn btn-yes" onClick={handleYes}>
                Yes, forever
              </button>
              {noFree ? (
                <span className="btn btn-no btn-no--ghost" aria-hidden="true">
                  No way
                </span>
              ) : (
                <button
                  ref={noRef}
                  type="button"
                  className="btn btn-no"
                  onClick={handleNo}
                  onMouseEnter={handleNoHover}
                >
                  No way
                </button>
              )}
            </div>
            {noFree ? (
              <button
                ref={noRef}
                type="button"
                className="btn btn-no btn-no--free"
                style={{ transform: `translate(${noPos.x}px, ${noPos.y}px)` }}
                onClick={handleNo}
                onMouseEnter={handleNoHover}
              >
                No way
              </button>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}

export default App;
