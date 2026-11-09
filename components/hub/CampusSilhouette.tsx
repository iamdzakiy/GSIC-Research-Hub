// Line-art silhouette of the ITB Ganesha campus: the upswept roofs of Aula Barat and Aula Timur on
// either side of the main axis. Drawn with strokes only, so it inherits currentColor and draws itself
// in once (see .silhouette-draw in globals.css; disabled under prefers-reduced-motion).
import { cn } from "@/lib/cn";

export default function CampusSilhouette({ className, draw = false, strokeWidth = 1.5 }: { className?: string; draw?: boolean; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 1200 140" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={cn("block w-full", draw && "silhouette-draw", className)} aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMax meet">
      <path d="M24 128 H1176" />
      <path d="M160 34 Q325.0 78 490 34" />
      <path d="M160 34 L198 80 M490 34 L452 80" />
      <path d="M166 76 Q325.0 92 484 76" />
      <path d="M184 88 H466" />
      <path d="M190 88 V128 M216 88 V128 M242 88 V128 M268 88 V128 M294 88 V128 M320 88 V128 M346 88 V128 M372 88 V128 M398 88 V128 M424 88 V128 M450 88 V128" />
      <path d="M710 34 Q875.0 78 1040 34" />
      <path d="M710 34 L748 80 M1040 34 L1002 80" />
      <path d="M716 76 Q875.0 92 1034 76" />
      <path d="M734 88 H1016" />
      <path d="M740 88 V128 M766 88 V128 M792 88 V128 M818 88 V128 M844 88 V128 M870 88 V128 M896 88 V128 M922 88 V128 M948 88 V128 M974 88 V128 M1000 88 V128" />
      <path d="M574 128 V96 H626 V128 M586 96 Q600 84 614 96" />
      <path d="M80 128 V95.0 M60.2 90.6 q9.9 -24.200000000000003 19.8 -13.200000000000001 q9.9 -15.400000000000002 19.8 2.2 q13.86 4.4 0 15.400000000000002 q-19.8 8.8 -39.6 -4.4" />
      <path d="M122 128 V104.0 M107.6 100.8 q7.2 -17.6 14.4 -9.600000000000001 q7.2 -11.200000000000001 14.4 1.6 q10.08 3.2 0 11.200000000000001 q-14.4 6.4 -28.8 -3.2" />
      <path d="M1080 128 V101.0 M1063.8 97.4 q8.1 -19.8 16.2 -10.8 q8.1 -12.6 16.2 1.8 q11.339999999999998 3.6 0 12.6 q-16.2 7.2 -32.4 -3.6" />
      <path d="M1128 128 V92.0 M1106.4 87.2 q10.799999999999999 -26.4 21.599999999999998 -14.399999999999999 q10.799999999999999 -16.8 21.599999999999998 2.4 q15.119999999999997 4.8 0 16.8 q-21.599999999999998 9.6 -43.199999999999996 -4.8" />
      <path d="M530 128 V107.0 M517.4 104.2 q6.3 -15.399999999999999 12.6 -8.399999999999999 q6.3 -9.799999999999999 12.6 1.4 q8.819999999999999 2.8 0 9.799999999999999 q-12.6 5.6 -25.2 -2.8" />
      <path d="M670 128 V105.5 M656.5 102.5 q6.75 -16.5 13.5 -9.0 q6.75 -10.5 13.5 1.5 q9.45 3.0 0 10.5 q-13.5 6.0 -27.0 -3.0" />
    </svg>
  );
}
