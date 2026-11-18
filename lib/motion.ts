// Motion tokens. Mirrors the --dur-* and --ease-out variables in app/tokens.css; keep the two in step.
export const DUR = { fast: 0.15, base: 0.22, slow: 0.42, setPiece: 0.7 } as const;
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const SPRING = { type: "spring", stiffness: 420, damping: 30, mass: 0.8 } as const;
/** Delay between siblings that enter together. */
export const STAGGER = 0.04;
export const RISE = 12;
