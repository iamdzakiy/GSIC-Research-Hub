// Static editorial content for /about and /pkm. Sources: GSIC Research planning documents and "ITB Road to PKM 2026" (GSIC KM ITB).
// Anything marked planned: true is a proposal for 2026/27 and still needs approval.

export const PILLARS = [
  {
    id: "connection",
    name: "Connection",
    line: "Opportunities, community and publication help in one place.",
    points: [
      "Channel info for scholarships, competitions, research and careers, checked before it is posted.",
      "Community 101: what active members do, and what alumni can offer.",
      "This website: opportunity directory, blog guides, a link library.",
      "Blog guides on how to publish a paper, how to write clearly, how to prepare an application.",
    ],
  },
  {
    id: "bootcamp",
    name: "PKM Bootcamp",
    line: "A cohort course that takes a PKM idea to a competitive proposal.",
    points: [
      "Built around PKM preparation: how a proposal gets funded, step by step.",
      "Every session has a pre-test and a post-test. Results become your report card on this site.",
      "Participants are matched with others who want to form a team.",
      "Finish a session, become a GSIC member, get invited to the next event.",
    ],
  },
  {
    id: "sandbox",
    name: "Sandbox",
    line: "A place to test ideas across majors before they become projects.",
    points: [
      "Read a module on the website. If it sparks something, come to the event.",
      "Talk to people from other fields and swap perspectives.",
      "Good ideas go on to a wet lab or dry lab project, a publication, or a scientific blog post.",
      "Ideas are grouped by cluster (rumpun): Art, Technology, Discovery.",
    ],
  },
] as const;

export const PATH = [
  { id: "srp", step: "Student Research Program", short: "SRP", when: "Registration from October", text: "Submit a research idea abstract and get a mentor. Ideas are mapped to a PKM scheme.", out: "A mapped idea and a mentor" },
  { id: "bootcamp", step: "PKM Bootcamp", short: "Bootcamp", when: "Four episodes, 12.5 hours", text: "Practice first, theory after. About 75% of the time is workshop. Three assignments and a final one build the proposal as you go.", out: "A complete draft proposal" },
  { id: "contest", step: "ITB Ace competition", short: "Competition", when: "Abstract, proposal, pitching", text: "A free internal contest with prizes and written jury feedback. Each bootcamp episode prepares one stage of it.", out: "A coached, final proposal", planned: true },
  { id: "national", step: "National PKM", short: "National PKM", when: "Registration around May", text: "Submit the proposal you have already practised, with continued mentoring after you pass.", out: "A funded-ready submission" },
] as const;

export const SCHEMES = [
  { code: "PKM-RE", name: "Research, exact sciences", text: "Experimental or computational research with a measurable result. The scheme with the most ITB submissions.", n2026: "48 submissions in 2026", funded: "2 funded in 2025", focus: true },
  { code: "PKM-KC", name: "Creative works", text: "A new design, artwork, prototype or media product, with a clear creative method behind it.", n2026: "21 submissions in 2026", funded: "10 funded in 2024", focus: true },
  { code: "PKM-GFT", name: "Futuristic written ideas", text: "A written proposal for a forward-looking solution. Selected by writing quality, so format and argument carry the score.", n2026: "8 submissions in 2026", funded: "Incentive scheme, no funding data", focus: true },
  { code: "PKM-K", name: "Entrepreneurship", text: "A business that runs for real during the program. Handled together with the School of Business and Management.", n2026: "3 submissions in 2026", funded: "6 funded in 2024", focus: true },
  { code: "PKM-RSH", name: "Research, social and humanities", text: "Research on social, cultural or economic questions.", focus: false },
  { code: "PKM-PM", name: "Community service", text: "Work with a community to solve a local problem.", focus: false },
  { code: "PKM-PI", name: "Applied technology", text: "Apply an existing technology to a real use case.", focus: false },
  { code: "PKM-AI", name: "Scientific article", text: "A written scientific article. An incentive scheme.", focus: false },
] as const;

export const EPISODES = [
  {
    n: 1, title: "Identify the problem", hours: "3 h", workshop: 90,
    work: ["60-second idea pitch", "Fishbone and 5 Whys", "Problem statement clinic", "Systems thinking"],
    theory: "PKM scheme types, and why a clear problem is the number one scoring factor.",
    task: "Assignment 1 (before Episode 2): problem statement and fishbone, one page.",
  },
  {
    n: 2, title: "Method and research design", hours: "3 h", workshop: 80,
    work: ["Literature speedrun: 3 papers in 15 minutes", "Choose a method", "Gantt chart", "Budget estimate"],
    theory: "Research methods, reference management, research ethics.",
    task: "Assignment 2 (before Episode 3): method outline and Gantt chart, one to two pages.",
  },
  {
    n: 3, title: "Write and format the proposal", hours: "3.5 h", workshop: 70,
    work: ["Write the introduction with a mentor", "Official template (Word or LaTeX)", "Document format challenge", "20-minute abstract clinic"],
    theory: "Format rules, proposal structure, writing tips.",
    task: "Assignment 3 (before Episode 4): full draft proposal.",
  },
  {
    n: 4, title: "Final polish and pitch", hours: "3 h", workshop: 60,
    work: ["3-minute pitch with feedback", "Proposal clinic with mentors", "Final checklist", "Peer editing"],
    theory: "Three winning proposals as case studies, and the jury rubric.",
    task: "Final assignment (one week after): final proposal and a 5-minute pitch video.",
  },
] as const;

export const STATS = [
  { value: 50, to: 2, label: "funded ITB proposals", note: "2023 to 2025" },
  { value: 48, to: 7, suffix: "%", label: "reach PIMNAS", note: "2020 to 2024" },
  { value: 80, label: "of 101 early 2026 submissions", note: "in the four focus schemes" },
  { value: 69, label: "SRP participants", note: "2025 cohort" },
] as const;
export const STATS_SOURCE = "Source: GSIC KM ITB, ITB Road to PKM 2026. PIMNAS 2025 data was not available.";

export const ROOT_CAUSES = [
  { problem: "Teams are hard to form", fix: "Teams register together, and an idea board helps people without a team. Organisers match people in Episode 1." },
  { problem: "Proposals fail on format", fix: "Episode 3 teaches the template, and a format check runs before you submit." },
  { problem: "Mentoring is inconsistent", fix: "Scheduled proposal coaching with a mentor group per scheme, and a backup mentor." },
  { problem: "Interest fades after the first week", fix: "Bootcamp assignments are the competition files, with a deadline at every stage." },
] as const;

export const COACHING = [
  ["Submit", "First draft (Assignment 3)."],
  ["Format check", "Automated check plus a manual one."],
  ["Coaching", "A mentor for your scheme, scored against the PKM rubric."],
  ["Review", "At least two reviewers, with written notes."],
  ["Revise", "Two to three rounds until it passes the rubric."],
  ["Final", "Final proposal and pitch video."],
] as const;

export const FORMAT_CHECKS = {
  rules: ["Margins, font and spacing", "Page count and file size", "Chapter order and complete appendices", "Citation format and reference list", "Figure and table numbering", "Template for the current year"],
  meaning: ["Title, aim and method line up", "Budget matches activities and outputs", "Problem and novelty are clear", "Numbers and terms stay consistent", "Claims without support, ambiguous sentences", "Fit with the chosen PKM scheme"],
} as const;

export const TIMELINE = [
  { m: "Oct", t: "SRP registration and mentoring" },
  { m: "Nov", t: "Bootcamp Episodes 1 and 2" },
  { m: "Dec", t: "Abstract stage" },
  { m: "Jan", t: "Bootcamp Episode 3, proposal stage" },
  { m: "Feb", t: "Proposal coaching" },
  { m: "Mar", t: "Bootcamp Episode 4, final pitching" },
  { m: "Apr", t: "Awards, revisions for national submission" },
  { m: "May", t: "National PKM registration" },
] as const;
export const TIMELINE_NOTE = "Reference months only. Final dates follow the academic calendar and the PKM 2027 guidelines.";
