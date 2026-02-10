import { memo, useEffect, useMemo, useRef, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { loadHeartShape } from "@tsparticles/shape-heart";
import "./App.css";

type RemoteStats = {
  yes: number;
  no: number;
  modals: number;
  hides: number;
};

const MODAL_TRIGGER_MIN = 3;
const MODAL_TRIGGER_MAX = 5;
const MODAL_SHOW_LIMIT = 3;
const HIDE_TRIGGER_MIN = 3;
const HIDE_TRIGGER_MAX = 5;
const MODAL_IMAGES = [
  "/1.gif",
  "/2.gif",
  "/3.gif",
  "/4.gif",
  "/5.gif",
  "/6.gif",
];
const MODAL_TEXTS = [
  "Aw, come on. Play nice.",
  "Okay, cheeky. I am keeping score.",
  "Final warning: one more no and I send the ghosts to nibble back.",
  "You are toying with dark forces. Choose wisely.",
  "Stop playing!",
  "No more biting for you.",
];
const HIDE_MODAL_TEXTS = [
  "Nope. Button confiscated. Play nice.",
  "Too much teasing. I am taking the button away.",
  "The haunted button is gone now. You did this.",
  "All right, biter. The button is removed.",
  "You pushed it too far. The button vanishes.",
];

const randomBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const shuffle = <T,>(items: T[]) => {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};

const pickRandom = (items: string[]) => {
  if (items.length === 0) return "";
  return items[Math.floor(Math.random() * items.length)] ?? "";
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

const shouldShowAdmin = () => {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("admin");
};

function App() {
  const [particlesReady, setParticlesReady] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [yesClicks, setYesClicks] = useState(0);
  const [noClicks, setNoClicks] = useState(0);
  const [noPos, setNoPos] = useState({ x: 16, y: 24 });
  const [noFree, setNoFree] = useState(false);
  const [noTriggerCount, setNoTriggerCount] = useState(0);
  const [nextModalAt, setNextModalAt] = useState(() =>
    randomBetween(MODAL_TRIGGER_MIN, MODAL_TRIGGER_MAX),
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState("");
  const [modalText, setModalText] = useState("");
  const [modalShownCount, setModalShownCount] = useState(0);
  const [hideTriggerCount, setHideTriggerCount] = useState(0);
  const [nextHideAt, setNextHideAt] = useState(() =>
    randomBetween(HIDE_TRIGGER_MIN, HIDE_TRIGGER_MAX),
  );
  const [noHidePhase, setNoHidePhase] = useState<
    "visible" | "hiding" | "hidden"
  >("visible");
  const [adminVisible] = useState(shouldShowAdmin);
  const [remoteStats, setRemoteStats] = useState<RemoteStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");
  const noRef = useRef<HTMLButtonElement>(null);
  const modalImageOrderRef = useRef(shuffle(MODAL_IMAGES));
  const modalImageIndexRef = useRef(0);
  const lastModalImageRef = useRef<string | null>(null);
  const modalTextOrderRef = useRef(shuffle(MODAL_TEXTS));
  const modalTextIndexRef = useRef(0);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
      await loadHeartShape(engine);
    }).then(() => setParticlesReady(true));
  }, []);

  useEffect(() => {
    if (!adminVisible) return;
    const loadStats = async () => {
      setStatsLoading(true);
      setStatsError("");
      try {
        const response = await fetch("/api/stats");
        if (!response.ok) {
          throw new Error("Stats fetch failed");
        }
        const data = (await response.json()) as RemoteStats;
        setRemoteStats(data);
      } catch {
        setStatsError("Could not load stats.");
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, [adminVisible]);

  useEffect(() => {
    if (!modalOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [modalOpen]);

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

  const nextModalImage = () => {
    const order = modalImageOrderRef.current;
    if (order.length === 0) return "";
    let index = modalImageIndexRef.current;
    let image = order[index] ?? "";
    if (lastModalImageRef.current && order.length > 1) {
      if (image === lastModalImageRef.current) {
        index = (index + 1) % order.length;
        image = order[index] ?? "";
      }
    }
    const nextIndex = index + 1;
    if (nextIndex >= order.length) {
      const reshuffled = shuffle(order);
      if (reshuffled.length > 1 && reshuffled[0] === image) {
        [reshuffled[0], reshuffled[1]] = [reshuffled[1], reshuffled[0]];
      }
      modalImageOrderRef.current = reshuffled;
      modalImageIndexRef.current = 0;
    } else {
      modalImageIndexRef.current = nextIndex;
    }
    lastModalImageRef.current = image;
    return image;
  };

  const nextModalText = () => {
    const order = modalTextOrderRef.current;
    if (order.length === 0) return "";
    const text = order[modalTextIndexRef.current] ?? "";
    const nextIndex = modalTextIndexRef.current + 1;
    if (nextIndex >= order.length) {
      modalTextOrderRef.current = shuffle(order);
      modalTextIndexRef.current = 0;
    } else {
      modalTextIndexRef.current = nextIndex;
    }
    return text;
  };

  const openModal = (options?: {
    image?: string;
    text?: string;
    count?: boolean;
  }) => {
    setModalImage(options?.image ?? nextModalImage());
    setModalText(options?.text ?? nextModalText());
    setModalOpen(true);
    fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "modal" }),
    }).catch(() => undefined);
    if (options?.count !== false) {
      setModalShownCount((count) => count + 1);
    }
  };

  const startHideNoButton = () => {
    if (noHidePhase !== "visible") return;
    openModal({
      image: nextModalImage(),
      text: pickRandom(HIDE_MODAL_TEXTS),
      count: false,
    });
    fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "hide" }),
    }).catch(() => undefined);
    setNoHidePhase("hiding");
  };

  const registerNoTrigger = () => {
    if (modalOpen) return;
    if (noHidePhase !== "visible") return;

    if (modalShownCount >= MODAL_SHOW_LIMIT) {
      const nextCount = hideTriggerCount + 1;
      if (nextCount >= nextHideAt) {
        startHideNoButton();
        setHideTriggerCount(0);
        setNextHideAt(randomBetween(HIDE_TRIGGER_MIN, HIDE_TRIGGER_MAX));
      } else {
        setHideTriggerCount(nextCount);
      }
      return;
    }

    const nextCount = noTriggerCount + 1;
    if (nextCount >= nextModalAt) {
      openModal();
      setNoTriggerCount(0);
      setNextModalAt(randomBetween(MODAL_TRIGGER_MIN, MODAL_TRIGGER_MAX));
    } else {
      setNoTriggerCount(nextCount);
    }
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
    fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "yes" }),
    }).catch(() => undefined);
    setAccepted(true);
  };

  const handleNo = () => {
    registerNoTrigger();
    setNoClicks((current) => current + 1);
    fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "no" }),
    }).catch(() => undefined);
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

    registerNoTrigger();

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
            and a teasing bite in between.
          </p>
        </div>

        {accepted ? (
          <div className="success-panel fade-in-up">
            <h2 className="success-title">The ritual is complete.</h2>
            <p className="success-text">
              You said yes, my eerie muse. First we chase the wall, then drift
              into the fresh Chainsaw Man night. And there might be a few
              dark-sweet surprises waiting for you (bite optional).
            </p>
            <p className="success-subtext">Isy, see you on our haunted date.</p>
          </div>
        ) : (
          <>
            <div className="button-row fade-in-up">
              <button type="button" className="btn btn-yes" onClick={handleYes}>
                Yes, forever
              </button>
              {noHidePhase === "hidden" ? null : noFree ? (
                <span className="btn btn-no btn-no--ghost" aria-hidden="true">
                  No way
                </span>
              ) : (
                <button
                  ref={noRef}
                  type="button"
                  className={`btn btn-no${noHidePhase === "hiding" ? " btn-no--popout" : ""}`}
                  onClick={handleNo}
                  onMouseEnter={handleNoHover}
                  onAnimationEnd={() => {
                    if (noHidePhase === "hiding") {
                      setNoHidePhase("hidden");
                    }
                  }}
                >
                  No way
                </button>
              )}
            </div>
            {noFree && noHidePhase !== "hidden" ? (
              <span
                className="btn-no-flyer"
                style={{ transform: `translate(${noPos.x}px, ${noPos.y}px)` }}
              >
                <button
                  ref={noRef}
                  type="button"
                  className={`btn btn-no${noHidePhase === "hiding" ? " btn-no--popout" : ""}`}
                  onClick={handleNo}
                  onMouseEnter={handleNoHover}
                  onAnimationEnd={() => {
                    if (noHidePhase === "hiding") {
                      setNoHidePhase("hidden");
                    }
                  }}
                >
                  No way
                </button>
              </span>
            ) : null}
          </>
        )}
        {adminVisible ? (
          <div className="admin-panel">
            <div className="admin-header">
              <h3 className="admin-title">Admin stats</h3>
              <button
                type="button"
                className="btn btn-no admin-button"
                onClick={async () => {
                  setStatsLoading(true);
                  setStatsError("");
                  try {
                    const response = await fetch("/api/stats");
                    if (!response.ok) {
                      throw new Error("Stats fetch failed");
                    }
                    const data = (await response.json()) as RemoteStats;
                    setRemoteStats(data);
                  } catch {
                    setStatsError("Could not load stats.");
                  } finally {
                    setStatsLoading(false);
                  }
                }}
                disabled={statsLoading}
              >
                Refresh
              </button>
            </div>
            <div className="admin-grid">
              <div className="admin-card">
                <span className="admin-label">Yes</span>
                <span className="admin-value">
                  {remoteStats ? remoteStats.yes : "-"}
                </span>
              </div>
              <div className="admin-card">
                <span className="admin-label">No</span>
                <span className="admin-value">
                  {remoteStats ? remoteStats.no : "-"}
                </span>
              </div>
              <div className="admin-card">
                <span className="admin-label">Modals</span>
                <span className="admin-value">
                  {remoteStats ? remoteStats.modals : "-"}
                </span>
              </div>
              <div className="admin-card">
                <span className="admin-label">Hides</span>
                <span className="admin-value">
                  {remoteStats ? remoteStats.hides : "-"}
                </span>
              </div>
            </div>
            {statsError ? (
              <p className="admin-error">{statsError}</p>
            ) : null}
          </div>
        ) : null}
      </section>
      {modalOpen ? (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Nope modal"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="modal-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="modal-title">Nope, caught you.</h3>
            <p className="modal-text">
              {modalText || "Nice try. The haunted button has moves."}
            </p>
            {modalImage ? (
              <img
                src={modalImage}
                alt="Funny spooky reaction"
                className="modal-image"
              />
            ) : null}
            <button
              type="button"
              className="btn btn-yes modal-close"
              onClick={() => setModalOpen(false)}
            >
              try again
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default App;
