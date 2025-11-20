import React, { useState, useEffect } from "react";

type ModeId = "greater" | "lesser" | "greaterAbs" | "lesserAbs";

type Mode = {
  id: ModeId;
  name: string;
  description: string;
  rule: string;
};

type Rational = {
  display: string;
  value: number;
  denomHint: number; // denominator hint for tick spacing
};

const MODES: Mode[] = [
  {
    id: "greater",
    name: "Greater",
    description: "The larger number wins.",
    rule: "Choose the number with the greater value.",
  },
  {
    id: "lesser",
    name: "Lesser",
    description: "The smaller number wins.",
    rule: "Choose the number with the lesser value.",
  },
  {
    id: "greaterAbs",
    name: "Greater Absolute",
    description: "The number with the larger absolute value wins.",
    rule: "Choose the number whose distance from 0 is greater.",
  },
  {
    id: "lesserAbs",
    name: "Lesser Absolute",
    description: "The number with the smaller absolute value wins.",
    rule: "Choose the number whose distance from 0 is smaller.",
  },
];

function getRandomMode(): Mode {
  return MODES[Math.floor(Math.random() * MODES.length)];
}

function randomIntInclusive(min: number, max: number): number {
  const low = Math.ceil(min);
  const high = Math.floor(max);
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createDecimalRational(): Rational {
  const sign = Math.random() < 0.5 ? -1 : 1;
  const whole = randomIntInclusive(0, 9);
  const decimalParts = [0, 0.25, 0.5, 0.75];
  const decimal = randomChoice(decimalParts);
  const raw = whole + decimal;
  const value = sign * raw;
  const normalized = value === 0 ? 0 : value;
  return {
    display: normalized.toFixed(2),
    value: normalized,
    denomHint: 4, // quarters
  };
}

function createFractionRational(): Rational {
  const denominators = [2, 3, 4, 5, 6, 8, 10];
  const denom = randomChoice(denominators);
  const numer = randomIntInclusive(1, denom - 1);
  const sign = Math.random() < 0.5 ? -1 : 1;
  const value = sign * (numer / denom);
  const prefix = sign === -1 ? "-" : "";
  return {
    display: `${prefix}${numer}/${denom}`,
    value,
    denomHint: denom,
  };
}

function createMixedRational(): Rational {
  const denominators = [2, 3, 4, 5, 6, 8];
  const whole = randomIntInclusive(1, 5);
  const denom = randomChoice(denominators);
  const numer = randomIntInclusive(1, denom - 1);
  const sign = Math.random() < 0.5 ? -1 : 1;
  const value = sign * (whole + numer / denom);
  const wholePart = sign === -1 ? `-${whole}` : `${whole}`;
  return {
    display: `${wholePart} ${numer}/${denom}`,
    value,
    denomHint: denom,
  };
}

function getRandomRational(): Rational {
  const type = randomIntInclusive(0, 2); // 0 = decimal, 1 = fraction, 2 = mixed
  if (type === 0) return createDecimalRational();
  if (type === 1) return createFractionRational();
  return createMixedRational();
}

function getWinnerIndex(
  mode: Mode,
  left: Rational,
  right: Rational
): 0 | 1 | null {
  const v1 = left.value;
  const v2 = right.value;
  const a1 = Math.abs(v1);
  const a2 = Math.abs(v2);

  switch (mode.id) {
    case "greater":
      if (v1 > v2) return 0;
      if (v2 > v1) return 1;
      return null;
    case "lesser":
      if (v1 < v2) return 0;
      if (v2 < v1) return 1;
      return null;
    case "greaterAbs":
      if (a1 > a2) return 0;
      if (a2 > a1) return 1;
      return null;
    case "lesserAbs":
      if (a1 < a2) return 0;
      if (a2 < a1) return 1;
      return null;
    default:
      return null;
  }
}

// Map value in [min,max] to percentage along the line
function getPositionPercent(value: number, min: number, max: number): number {
  if (max === min) return 50;
  const t = (value - min) / (max - min); // 0 to 1
  // Map to 5%..95% so we have padding on both sides
  return 5 + t * 90;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a || 1;
}

function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

export default function TwoPlayerModeNumberGame() {
  const [currentMode, setCurrentMode] = useState<Mode | null>(null);
  const [leftNumber, setLeftNumber] = useState<Rational | null>(null);
  const [rightNumber, setRightNumber] = useState<Rational | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<0 | 1 | null>(null);

  const hasRound = !!(currentMode && leftNumber && rightNumber);

  const startRound = () => {
    // Keep generating until there is a clear winner (no ties, even in absolute modes)
    let mode: Mode;
    let n1: Rational;
    let n2: Rational;
    let winner: 0 | 1 | null = null;
    let safety = 0;

    do {
      mode = getRandomMode();
      n1 = getRandomRational();
      n2 = getRandomRational();
      winner = getWinnerIndex(mode, n1, n2);
      safety += 1;
    } while (winner === null && safety < 100);

    setCurrentMode(mode!);
    setLeftNumber(n1!);
    setRightNumber(n2!);
    setSelectedIndex(null);
  };

  useEffect(() => {
    // Generate an initial round on mount so the screen is never empty.
    startRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const winnerIndex =
    hasRound && currentMode && leftNumber && rightNumber
      ? getWinnerIndex(currentMode, leftNumber, rightNumber)
      : null;

  const handlePick = (index: 0 | 1) => {
    if (!hasRound) return;
    setSelectedIndex(index);
  };

  const baseCardClasses =
    "rounded-2xl border px-4 py-10 md:py-16 text-center text-5xl md:text-6xl font-semibold flex items-center justify-center select-none transition-transform bg-slate-900/70 border-slate-700 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500/60";

  const getCardStyle = (index: 0 | 1): React.CSSProperties => {
    // Default: no overrides, Tailwind base handles layout.
    let backgroundColor: string | undefined;
    let borderColor: string | undefined;
    let opacity = 1;

    if (selectedIndex === null || winnerIndex === null) {
      return { backgroundColor, borderColor, opacity };
    }

    // Chosen card: solid green or red
    if (selectedIndex === index) {
      if (winnerIndex === index) {
        backgroundColor = "#16a34a"; // green-600
        borderColor = "#4ade80"; // green-400
      } else {
        backgroundColor = "#dc2626"; // red-600
        borderColor = "#f87171"; // red-400
      }
      return { backgroundColor, borderColor, opacity, color: "#ffffff" };
    }

    // Not chosen: if it was the correct one, give it a subtle green border
    if (winnerIndex === index) {
      borderColor = "#4ade80"; // green-ish
    } else {
      opacity = 0.7;
    }

    return { backgroundColor, borderColor, opacity };
  };

  // --- Number line domain + ticks (dynamic) ---
  const isAbsMode =
    currentMode?.id === "greaterAbs" || currentMode?.id === "lesserAbs";

  let leftPlot: number | null = null;
  let rightPlot: number | null = null;
  let domainMin: number | null = null;
  let domainMax: number | null = null;
  let ticks: { value: number; isMajor: boolean }[] = [];

  if (leftNumber && rightNumber) {
    leftPlot = isAbsMode ? Math.abs(leftNumber.value) : leftNumber.value;
    rightPlot = isAbsMode ? Math.abs(rightNumber.value) : rightNumber.value;

    const minVal = Math.min(leftPlot, rightPlot);
    const maxVal = Math.max(leftPlot, rightPlot);

    let minInt = Math.floor(minVal);
    let maxInt = Math.ceil(maxVal);

    // Ensure we have at least a 2-integer span so the line isn't degenerate
    if (minInt === maxInt) {
      minInt -= 1;
      maxInt += 1;
    }

    domainMin = minInt;
    domainMax = maxInt;

    // Find a common denominator so we can show all relevant fractional/decimal multiples.
    const leftDenom = leftNumber.denomHint || 1;
    const rightDenom = rightNumber.denomHint || 1;
    const stepDenom = lcm(leftDenom, rightDenom);
    const step = 1 / stepDenom;

    const tickValues: number[] = [];
    const startN = Math.round(domainMin * stepDenom);
    const endN = Math.round(domainMax * stepDenom);

    for (let n = startN; n <= endN; n++) {
      tickValues.push(n / stepDenom);
    }

    ticks = tickValues.map((v) => ({
      value: v,
      isMajor: Math.abs(v - Math.round(v)) < 1e-6,
    }));
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex flex-col items-center gap-12">
        {/* MODE (big centered text) */}
        <div className="text-4xl md:text-7xl font-bold tracking-tight text-center select-none">
          {currentMode ? currentMode.name : ""}
        </div>

        {/* TWO BIG NUMBERS, LABELED A AND B */}
        <div className="flex flex-col md:flex-row gap-10 w-full max-w-5xl">
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="text-xl md:text-2xl font-bold select-none">A</div>
            <button
              type="button"
              onClick={() => handlePick(0)}
              className={baseCardClasses}
              style={getCardStyle(0)}
            >
              {leftNumber ? leftNumber.display : ""}
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="text-xl md:text-2xl font-bold select-none">B</div>
            <button
              type="button"
              onClick={() => handlePick(1)}
              className={baseCardClasses}
              style={getCardStyle(1)}
            >
              {rightNumber ? rightNumber.display : ""}
            </button>
          </div>
        </div>

        {/* NEW ROUND BUTTON */}
        <button
          type="button"
          onClick={startRound}
          className="mt-2 inline-flex items-center justify-center rounded-2xl px-10 py-4 text-2xl font-semibold bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 transition focus:outline-none focus:ring-4 focus:ring-indigo-500/70"
        >
          New Round
        </button>

        {/* LARGE NUMBER LINE (appears after a choice is made) */}
        {hasRound &&
          selectedIndex !== null &&
          leftNumber &&
          rightNumber &&
          leftPlot !== null &&
          rightPlot !== null &&
          domainMin !== null &&
          domainMax !== null && (
            <div className="w-full max-w-5xl mt-8">
              <div className="relative h-48">
                {/* Base line */}
                <div className="absolute left-[5%] right-[5%] top-1/2 h-2 bg-slate-600 -translate-y-1/2 rounded" />

                {/* Ticks (major + minor) */}
                <div className="absolute left-[5%] right-[5%] top-[62%] flex justify-between text-base md:text-xl text-slate-300 select-none">
                  {ticks.map((tick) => {
                    const isInt = tick.isMajor;
                    const label = isInt ? Math.round(tick.value) : null;
                    return (
                      <div
                        key={tick.value.toFixed(4)}
                        className="flex flex-col items-center"
                      >
                        <div
                          className={
                            isInt
                              ? "w-px h-6 bg-slate-100 mb-1"
                              : "w-px h-3 bg-slate-400 mb-1"
                          }
                        />
                        <span
                          className={isInt ? "text-sm md:text-base" : "hidden"}
                        >
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Left point (A) */}
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                  style={{
                    left: `${getPositionPercent(leftPlot!, domainMin, domainMax)}%`,
                    top: "40%",
                  }}
                >
                  <div className="w-7 h-7 rounded-full bg-sky-300 shadow-lg flex items-center justify-center text-xs font-bold text-slate-900">
                    A
                  </div>
                  <span className="text-sm md:text-lg mt-2 select-none">
                    {leftNumber.display}
                  </span>
                </div>

                {/* Right point (B) */}
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                  style={{
                    left: `${getPositionPercent(rightPlot!, domainMin, domainMax)}%`,
                    top: "40%",
                  }}
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-300 shadow-lg flex items-center justify-center text-xs font-bold text-slate-900">
                    B
                  </div>
                  <span className="text-sm md:text-lg mt-2 select-none">
                    {rightNumber.display}
                  </span>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
