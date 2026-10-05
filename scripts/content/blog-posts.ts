// Original starter articles (general guidance, no program-specific claims). Edit freely in Admin > Blog.
export interface SeedPost { slug: string; title: string; excerpt: string; tags: string[]; content: string }

export const SEED_POSTS: SeedPost[] = [
  {
    slug: "cara-menulis-esai-motivasi-beasiswa",
    title: "How to Write a Clear, Convincing Scholarship Motivation Essay",
    excerpt: "A simple structure, common mistakes, and how to make your story specific instead of generic.",
    tags: ["ScholarshipGuide", "WritingTips"],
    content: `Selection committees read dozens or even hundreds of motivation essays. The ones that stand out are not the most dramatic. They are the **clearest**.

## A structure you can use
1. **Opening (1 paragraph):** one concrete moment or problem that drew you to this field.
2. **Evidence (2-3 paragraphs):** what you have already done, such as projects, research, or organizations, with numbers or results where you have them.
3. **Plan (1-2 paragraphs):** what you will study, why at this program or institution, and how you will use it after you graduate.
4. **Closing (3-4 sentences):** return to the opening and state what you will contribute.

## Common mistakes
- Repeating your CV as paragraphs.
- Generic statements such as "I want to build my nation" with no concrete step behind them.
- Not saying why you chose this particular program, so the essay could be sent anywhere.
- Ignoring the word limit and the format the committee asked for.

## Making it specific
Replace claims with events. Instead of "I am a good leader", write "I coordinated 12 members to finish a prototype in 6 weeks". Ask two people to read the draft: one who knows you and one who does not. If the second reader cannot restate your goal in one sentence, rework the opening and the plan.

Leave at least three days between your last draft and the submission, so you can reread it with a fresh head.`,
  },
  {
    slug: "checklist-dokumen-beasiswa",
    title: "Scholarship Document Checklist: Start Early, Not Three Days Before",
    excerpt: "The documents almost every application asks for, and small habits that prevent last-day panic.",
    tags: ["ScholarshipGuide", "Checklist"],
    content: `Many applicants are rejected not because they are unqualified, but because their documents arrived late or in the wrong format.

## Documents almost always required
- National ID and student ID (clear scans, nothing cropped)
- Academic transcript and, if needed, a letter confirming you are an active student
- Curriculum vitae (one to two pages)
- Motivation essay or study plan
- Recommendation letters (ask **at least 2 weeks** ahead)
- Language certificate (IELTS, TOEFL, ITP) if relevant
- Proof of achievements or organizational experience

## Habits that save you
1. **One master folder.** Keep every file there with consistent names, for example \`FullName_Transcript.pdf\`.
2. **Read the official guide twice.** File size, format, and upload order often differ between programs.
3. **Schedule submission for three days before the deadline.** Portals tend to be slow on the last day.
4. **Keep proof of submission.** Save a screenshot and the confirmation email.

On each opportunity page in GSIC Hub, the "Documents" section lists what is required so you can tick items off one by one.`,
  },
  {
    slug: "memulai-riset-dari-nol",
    title: "Starting Research from Zero: From a Question to a One-Page Proposal",
    excerpt: "Practical steps for students without a topic yet: find a gap, write a question, and draft a short proposal.",
    tags: ["ResearchTips", "Proposal"],
    content: `Research starts with a small question you can actually answer, not with a big topic that sounds impressive.

## 1. Find a gap
Read 5-10 recent review articles in a field you like. Note the "future work" or "limitations" sections. The gaps are there.

## 2. Write the question
A good question is **specific, measurable, and feasible** with the time and tools you have. A weak example: "How does AI help healthcare?" A better one: "How accurately does model X detect Y on the publicly available dataset Z?"

## 3. Write a one-page proposal
- **Background** (3-4 sentences)
- **Question and objective**
- **Short method** (data, tools, analysis)
- **Output** (report, prototype, article)
- **Schedule** (by month)

## 4. Find a supervisor
Send a short email: who you are, what your question is, why it fits their field, and attach the one-page proposal. Keep it polite, specific, and brief.

Use **Zotero** or Mendeley from day one so your reference list does not become a problem at the end.`,
  },
  {
    slug: "strategi-persiapan-kompetisi-8-minggu",
    title: "An 8-Week Plan for Preparing a Competition Entry",
    excerpt: "A weekly schedule, team roles, and a submission checklist for research paper and innovation competitions.",
    tags: ["CompPrep", "Teamwork"],
    content: `Competitions are usually won by teams that are **organized**, not only by the smartest ones.

## 8-week timeline
| Week | Focus |
|---|---|
| 1 | Read the guidelines, choose a topic, assign roles |
| 2-3 | Initial research, validate the problem, outline the solution |
| 4-5 | Core development (prototype, experiment, or draft) |
| 6 | Testing and mentor feedback |
| 7 | Polish documents and slides; record a video if required |
| 8 | Practice the presentation and submit two days early |

## Team roles
Name one **coordinator** (schedule and deadlines), one **technical lead**, and one **documents and presentation lead**. Roles can rotate, but everyone should know who owns each task.

## Submission checklist
- File format and size match the guidelines
- Team name, institution, and members are consistent across all documents
- Every source is cited
- One person outside the team reads the entry and tests the links

Two 15-minute meetings a week work better than one long meeting.`,
  },
  {
    slug: "cv-akademik-vs-cv-industri",
    title: "Academic CV vs Industry CV: Which One to Use",
    excerpt: "Differences in content, length, and emphasis, so your CV fits its purpose: scholarship, research, or career.",
    tags: ["CareerPrep", "WritingTips"],
    content: `One CV for every purpose is almost always less effective.

## Industry CV (1 page)
Focus on **impact**. Use the pattern: *action verb + what you did + measurable result*. Put internships, projects, and technical skills that match the job posting first.

## Academic CV (2+ pages)
Focus on your **research record**: education, publications, presentations, grants, awards, research experience, and methods you know. Length is fine as long as it is well structured.

## Scholarship CV
A mix of both: academic achievement, leadership, and community contribution. Match it to the values the funder emphasizes.

## General tips
- Use one clean font, adequate margins, and no photo unless requested.
- List items from newest to oldest.
- Save as PDF with a professional file name.
- Update it whenever you finish something, not when a vacancy appears.

If you use LaTeX, Overleaf provides clean CV templates that are easy to modify.`,
  },
  {
    slug: "mencari-pembimbing-dan-mentor-riset",
    title: "Finding a Supervisor or Mentor: How to Write an Email That Gets a Reply",
    excerpt: "A short, specific email is far more likely to be answered. Here is the format, plus mistakes to avoid.",
    tags: ["ResearchTips", "Networking"],
    content: `Lecturers and researchers receive many emails. Make yours easy to answer.

## Email structure
1. **Clear subject:** "[Major] student - research interest in [topic]"
2. **Introduction** (1-2 sentences): your name, major, and year.
3. **Why them:** name one publication or project of theirs that you read, and one specific thing that interested you.
4. **A concrete request:** for example, a 20-minute conversation or a chance to join as a research assistant.
5. **Attachments:** your CV and a one-page proposal.
6. **A polite closing** and thanks.

## Avoid
- Mass emails with the wrong name.
- Questions already answered on the lab website.
- Asking for "any topic".
- Following up too soon or too late: one polite reminder after 7-10 days is enough.

If you get no reply, it is not a personal rejection. Try another researcher and improve your proposal.`,
  },
  {
    slug: "menyiapkan-wawancara-beasiswa-dan-magang",
    title: "Preparing for Scholarship and Internship Interviews",
    excerpt: "Questions that almost always come up, how to answer using the STAR structure, and practice that works.",
    tags: ["ScholarshipGuide", "CareerPrep", "Interview"],
    content: `An interview tests two things: **how clearly you think** and **whether you fit**.

## Questions that almost always come up
- Tell us about yourself.
- Why this program or company?
- Describe a failure and what you learned from it.
- Where do you see yourself in five years?
- What questions do you have for us?

## The STAR method
Answer behavioral questions with **S**ituation, **T**ask, **A**ction, **R**esult. Make sure the Action part explains what *you* did, not only what the team did.

## Practice
1. Record yourself answering the five questions above, then watch it back.
2. Practice with a friend for 20 minutes and ask for feedback on clarity, not only content.
3. Prepare 2-3 thoughtful questions for the interviewers.

Arrive early, test your connection and microphone if the interview is online, and be honest. It is better to admit you do not know and then explain how you would find out.`,
  },
  {
    slug: "mengelola-waktu-kuliah-riset-dan-organisasi",
    title: "Managing Time Across Classes, Research, and Organizations Without Burning Out",
    excerpt: "A simple system built on weekly priorities so deadlines do not pile up.",
    tags: ["ResearchTips", "Productivity"],
    content: `The problem is rarely a lack of time. It is usually unclear priorities.

## Weekly review (30 minutes, Sunday)
1. Write down every deadline in the next two weeks.
2. Pick the **three most important outcomes** for this week.
3. Block focused work time in your calendar for those three before accepting other commitments.

## Practical rules
- **Do the hard task first**, when your energy is best.
- **Break tasks down** into steps of 30-90 minutes.
- **Limit commitments:** taking on one new role means dropping one old role.
- **Schedule breaks:** enough sleep does more for you than one extra late-night hour.

## Tools
A calendar (export .ics files from GSIC opportunity pages), a simple task list, and a reference manager. Three tools are enough; more usually become a distraction.

Review monthly: what can you stop, delegate, or reschedule?`,
  },
];
