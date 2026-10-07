import { useId, type CSSProperties } from "react";
import styles from "./Hero.module.css";

const WISPS = [
  { left: 0, width: 52, height: 76, duration: 4.8, delay: -1.4, drift: -22, turn: -7 },
  { left: 17, width: 46, height: 93, duration: 5.6, delay: -3.1, drift: 16, turn: 6 },
  { left: 34, width: 47, height: 100, duration: 5.2, delay: -0.8, drift: -13, turn: -4 },
  { left: 48, width: 46, height: 84, duration: 4.5, delay: -2.5, drift: 20, turn: 8 },
  { left: 21, width: 59, height: 88, duration: 6.1, delay: -4.3, drift: -9, turn: -5 },
] as const;

/** The supplied photos share a bowl opening at 71.4% across, 69% down.
 *  Steam stays attached to the photo throughout its slide and fade. */
export default function BowlSteam() {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  return (
    <div className={styles.steam} aria-hidden="true" data-bowl-steam>
      <span className={styles.steamSource} data-steam-origin />
      <div className={styles.steamHaze} />
      {WISPS.map((wisp, index) => {
        const gradientId = `bowl-steam-${id}-${index}`;
        return (
          <svg
            key={index}
            className={styles.steamWisp}
            viewBox="0 0 64 160"
            fill="none"
            preserveAspectRatio="none"
            style={{
              "--wisp-left": `${wisp.left}%`,
              "--wisp-width": `${wisp.width}%`,
              "--wisp-height": `${wisp.height}%`,
              "--wisp-duration": `${wisp.duration}s`,
              "--wisp-delay": `${wisp.delay}s`,
              "--wisp-drift": `${wisp.drift}%`,
              "--wisp-turn": `${wisp.turn}deg`,
            } as CSSProperties}
          >
            <defs>
              <linearGradient id={gradientId} x1="32" y1="160" x2="32" y2="0" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f4fff8" stopOpacity="0.12" />
                <stop offset="0.22" stopColor="#f4fff8" stopOpacity="0.7" />
                <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.5" />
                <stop offset="0.82" stopColor="#ffffff" stopOpacity="0.16" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={index % 2 === 0
                ? "M31 158C45 137 16 125 26 103C39 79 46 68 29 45C15 27 31 12 41 1"
                : "M34 158C19 139 43 123 35 103C22 80 17 66 34 46C48 29 33 13 25 1"}
              stroke={`url(#${gradientId})`}
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M31 158C20 133 46 112 32 87C18 60 40 37 30 4"
              stroke={`url(#${gradientId})`}
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.3"
            />
          </svg>
        );
      })}
    </div>
  );
}
