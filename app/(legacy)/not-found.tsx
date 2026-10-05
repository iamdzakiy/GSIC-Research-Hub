import Link from "next/link";
import StateScreen from "@/components/portal/StateScreen";

export default function NotFound() {
  return (
    <StateScreen code="404" title="Page not found" message="The link may have changed, or the opportunity may have been removed. Try the opportunities directory.">
      <Link href="/opportunities" className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">View opportunities</Link>
    </StateScreen>
  );
}
