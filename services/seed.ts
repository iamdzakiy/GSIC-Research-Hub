import {
  SEED_OPPORTUNITIES,
  SEED_CURATED,
  SEED_EVENTS,
  SEED_TESTS,
  SEED_DOCUMENTS,
} from "@/lib/data";

export async function ensureSeed(collection: string): Promise<void> {
  let data: any[] = [];

  switch (collection) {
    case "opportunities":
      data = SEED_OPPORTUNITIES;
      break;
    case "curated":
      data = SEED_CURATED;
      break;
    case "events":
      data = SEED_EVENTS;
      break;
    case "tests":
      data = SEED_TESTS;
      break;
    case "documents":
      data = SEED_DOCUMENTS;
      break;
    default:
      return;
  }

  try {
    const res = await fetch("/api/seed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collection, data }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Seed failed");
    }
  } catch (e) {
    console.error(`Seed error for ${collection}:`, e);
  }
}

export async function ensureAllSeeds(): Promise<void> {
  await Promise.all([
    ensureSeed("opportunities"),
    ensureSeed("curated"),
    ensureSeed("events"),
    ensureSeed("tests"),
    ensureSeed("documents"),
  ]);
}