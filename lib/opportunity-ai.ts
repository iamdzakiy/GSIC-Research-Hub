// AI import for opportunities: raw text and/or a link -> a structured draft (Claude API, structured outputs).
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod/v4";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { CATEGORY_IDS } from "@/lib/competitions";
import { BENEFIT_CATEGORIES, LEVELS } from "@/lib/opportunity-status";
import type { OpportunityDraft } from "@/lib/opportunity-broadcast";

// Every field is required and non-nullable: "" / [] means "not stated in the source".
const Draft = z.object({
  type: z.enum(["scholarship", "competition", "research", "career"]),
  category: z.enum(["", ...CATEGORY_IDS] as [string, ...string[]]),
  lang: z.enum(["id", "en"]),
  emoji: z.string(),
  title: z.string(),
  organizer: z.string(),
  intro: z.string(),
  summary: z.string(),
  details: z.array(z.string()),
  benefits: z.array(z.string()),
  eligibility: z.array(z.object({ text: z.string(), required: z.boolean() })),
  requiredDocuments: z.array(z.string()),
  howToApply: z.string(),
  contact: z.string(),
  hashtags: z.array(z.string()),
  link: z.string(),
  guidebookUrl: z.string(),
  deadline: z.string(),
  openDate: z.string(),
  submissionDeadline: z.string(),
  programStart: z.string(),
  programEnd: z.string(),
  levels: z.array(z.enum(LEVELS)),
  benefitCategories: z.array(z.enum(BENEFIT_CATEGORIES)),
  fundingType: z.enum(["", "fully_funded", "partially_funded", "tuition_only", "stipend", "prize_money", "paid", "unpaid", "self_funded"]),
  fundingAmount: z.string(),
  attendanceMode: z.enum(["", "onsite", "online", "hybrid"]),
  city: z.string(),
  country: z.string(),
  location: z.string(),
  nationality: z.string(),
  duration: z.string(),
  ageMin: z.string(),
  ageMax: z.string(),
  minGpa: z.string(),
  quota: z.string(),
  teamSizeMin: z.string(),
  teamSizeMax: z.string(),
  registrationFee: z.string(),
  theme: z.string(),
  fieldsOfStudy: z.array(z.string()),
  tags: z.array(z.string()),
  quickFacts: z.array(z.object({ label: z.string(), value: z.string() })),
  timeline: z.array(z.object({ phase: z.string(), date: z.string(), description: z.string() })),
  warnings: z.array(z.string()),
});

const SYSTEM = `You turn a raw opportunity announcement (a scholarship, research program, internship/career program, or competition) into one structured record for GSIC Hub, the opportunity board of Ganesha Students Innovation Center at ITB, and write its group broadcast (BC).

Rules:
- Use only facts stated in the source. When a field is not stated, leave it as "" or []. Never invent dates, amounts, links or contacts. List anything uncertain or missing that a student would need (deadline, link, fee, eligibility) in "warnings".
- type: "competition" for any lomba/competition (business plan, BMC, case, essay, LKTI, poster, hackathon, debate, robotics...). "research" for summer research programs, research internships and research fellowships. "scholarship" for degree funding. "career" for jobs and non-research internships.
- category (competitions only, else ""): bcc = business case; bpc = business plan / business model canvas; case = other case competitions; hackathon; paper = karya tulis ilmiah / LKTI / scientific paper; essay; uiux; data = data science / analytics; innovation = innovation, startup, product or eco/social project; design = poster, infographic, design, video; debate = debate / MUN; pkm; other.
- lang: "id" when the opportunity is Indonesian (Indonesian organizer or Indonesian-language source), else "en". Write title, intro, summary, details, benefits, eligibility, requiredDocuments, howToApply and quickFacts in that language.
- title: the official name with year, plus a short descriptor, e.g. "Kyoto University Amgen Scholars Program 2027 in Japan — Fully Funded Summer Research Internship" or "Indonesia Entrepreneur Festival (IEF) 2026 — National BMC Competition".
- emoji: one emoji for the headline (🎓 scholarship/fellowship, 🔬 research, 💼 career, 🏆 competition, or a closer fit such as 🤖 robotics, 📝 essay).
- intro: 1–2 short, energetic paragraphs (a hook question, then what it is and who it is for). Use **bold** for the program name. If students at Indonesian universities are NOT eligible, add a final line starting with "⚠️".
- details: bullets such as Host Country, Host Organisation / Penyelenggara, Location, Program Dates, Format, Team size, Registration fee, Theme, and finish with a bold deadline bullet, e.g. "**Application Deadline: February 1, 2027**" or "**Batas Pendaftaran: 30 November 2026**".
- benefits, eligibility, requiredDocuments: short bullet texts (no leading bullet character). eligibility.required is false only for "preferred"/"nice to have" items.
- howToApply: 1–3 sentences on how to apply, with the deadline in **bold**.
- contact: WhatsApp / phone / email / Instagram contact as written in the source, else "".
- hashtags: 6–8 hashtags without "#", ending with GSICHub and IntegratedGrowth.
- link: the official registration or info URL (prefer the organizer's page over an aggregator). guidebookUrl: the guidebook link when given.
- Dates: "YYYY-MM-DD" when only a date is known (deadlines are read as 23:59 WIB), or a full ISO 8601 timestamp with offset when a time and zone are stated. deadline is when registration/applications close; submissionDeadline is the work submission deadline when separate.
- levels: from D3, D4, S1, S2, S3, PR (PR = postdoc/professional). benefitCategories: from the allowed list only.
- fundingType: fully_funded, partially_funded, tuition_only, stipend, prize_money (competitions with prizes), paid, unpaid or self_funded; "" when unclear.
- Numbers (ageMin, ageMax, minGpa, quota, teamSizeMin, teamSizeMax) as plain digits in a string, e.g. "3" or "3.0".
- quickFacts: 2–6 extra label/value facts that do not fit elsewhere. timeline: key dates (phase, date as written, short description).
- tags: 3–6 short topic tags. fieldsOfStudy: fields named in the source.`;

const MAX_SOURCE_CHARS = 60_000;

/** Fetch a public page and reduce it to readable text. Admin-only caller; still refuses non-http(s) and local hosts. */
export async function fetchPageText(raw: string): Promise<string> {
  const url = new URL(raw);
  if (!/^https?:$/.test(url.protocol)) throw new Error("Only http(s) links are supported.");
  if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[?::1\]?)/i.test(url.hostname) || /^172\.(1[6-9]|2\d|3[01])\./.test(url.hostname)) throw new Error("That link points to a private address.");
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; GSIC-Hub-Importer/1.0)", Accept: "text/html,text/plain,*/*" }, redirect: "follow", signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`The link returned HTTP ${res.status}. Paste the text instead.`);
  const type = res.headers.get("content-type") ?? "";
  if (!/text|html|json|xml/.test(type)) throw new Error("The link is not a web page (PDF or image?). Paste the text instead.");
  const html = (await res.text()).slice(0, 2_000_000);
  return html
    .replace(/<(script|style|noscript|svg|iframe)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, text) => `${text} (${href})`)
    .replace(/<\/(p|div|li|h[1-6]|tr|br)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&rsquo;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim()
    .slice(0, MAX_SOURCE_CHARS);
}

export class ImportError extends Error {}

export async function extractOpportunity(input: { text?: string; url?: string }, today = new Date()): Promise<OpportunityDraft> {
  if (!process.env.ANTHROPIC_API_KEY) throw new ImportError("ANTHROPIC_API_KEY is not set on the server.");
  const parts: string[] = [];
  if (input.url) {
    parts.push(`Source link: ${input.url}`);
    try { parts.push(`Page text:\n${await fetchPageText(input.url)}`); }
    catch (e) { if (!input.text) throw new ImportError((e as Error).message); parts.push(`(Could not read the link: ${(e as Error).message})`); }
  }
  if (input.text) parts.push(`Pasted text:\n${input.text.slice(0, MAX_SOURCE_CHARS)}`);

  const client = new Anthropic();
  const response = await client.beta.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: zodOutputFormat(Draft) },
    system: SYSTEM,
    messages: [{ role: "user", content: `Today is ${today.toISOString().slice(0, 10)} (Asia/Jakarta).\n\n${parts.join("\n\n")}` }],
  });
  if (response.stop_reason === "refusal") throw new ImportError("The AI declined this text. Fill the form by hand.");
  if (response.stop_reason === "max_tokens") throw new ImportError("The source is too long. Paste only the announcement text.");
  const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  const parsed = Draft.safeParse(JSON.parse(text));
  if (!parsed.success) throw new ImportError("The AI returned an unexpected shape. Try again.");
  return parsed.data as OpportunityDraft;
}
