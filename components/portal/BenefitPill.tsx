import { Check } from "lucide-react";

export default function BenefitPill({ children }: { children: React.ReactNode }) {
  return (
    <li className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-mint-200 bg-mint-50 px-2.5 py-1 text-xs font-medium text-mint-800">
      <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span className="truncate">{children}</span>
    </li>
  );
}
