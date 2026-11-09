import { redirect } from "next/navigation";

/** Teams became Seeking Partner. Old links keep working. */
export default function TeamsPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const tab = searchParams.tab;
  if (tab === "mine" || tab === "applied" || tab === "match") redirect(`/partners/manage?tab=${tab}`);
  const q = new URLSearchParams();
  if (searchParams.opportunity) q.set("competition", searchParams.opportunity);
  if (searchParams.event) q.set("event", searchParams.event);
  redirect(q.size ? `/partners?${q}` : "/partners");
}
