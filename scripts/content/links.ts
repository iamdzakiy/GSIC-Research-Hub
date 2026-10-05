// Official homepages only. Verify before launch; edit in Admin > Links.
export type SeedLink = [category: string, title: string, url: string, description: string, tags: string[], featured?: boolean];

export const SEED_LINKS: SeedLink[] = [
  ["Scholarships", "LPDP — Lembaga Pengelola Dana Pendidikan", "https://lpdp.kemenkeu.go.id", "Indonesian government scholarships for master's and doctoral study in Indonesia and abroad.", ["scholarship", "government"], true],
  ["Scholarships", "Beasiswa Unggulan Kemdikbud", "https://beasiswaunggulan.kemdikbud.go.id", "Indonesian government scholarships for high-achieving students and graduates.", ["scholarship"]],
  ["Scholarships", "Chevening Scholarships", "https://www.chevening.org", "UK government scholarships for master's study in the United Kingdom.", ["uk", "s2"], true],
  ["Scholarships", "Fulbright", "https://www.fulbright.org", "Exchange and scholarship programs for study in the United States.", ["usa"]],
  ["Scholarships", "DAAD", "https://www.daad.de/en/", "Scholarships and study information for Germany.", ["germany"]],
  ["Scholarships", "Erasmus+", "https://erasmus-plus.ec.europa.eu", "European Union mobility and scholarship program.", ["europe"]],
  ["Scholarships", "Study in Japan", "https://www.studyinjapan.go.jp/en/", "Official portal for study and scholarship information in Japan.", ["japan"]],
  ["Scholarships", "Study in Korea", "https://www.studyinkorea.go.kr", "Official portal for study in Korea, including the Korean government scholarship (GKS).", ["korea"]],
  ["Scholarships", "Scholarship Portal", "https://www.scholarshipportal.com", "Search engine for international scholarships.", ["aggregator"]],
  ["Scholarships", "Studyportals", "https://www.studyportals.com", "Search engine for study programs and scholarships worldwide.", ["aggregator"]],
  // Research
  ["Research & Journals", "SINTA — Science and Technology Index", "https://sinta.kemdiktisaintek.go.id", "Index of Indonesian publications and researchers.", ["journal", "indonesia"]],
  ["Research & Journals", "Garuda — Garba Rujukan Digital", "https://garuda.kemdiktisaintek.go.id", "Reference portal for Indonesian scholarly journals.", ["journal"]],
  ["Research & Journals", "Google Scholar", "https://scholar.google.com", "Search engine for scholarly literature.", ["literature"], true],
  ["Research & Journals", "arXiv", "https://arxiv.org", "Preprint repository for science, engineering, and mathematics.", ["preprint"]],
  ["Research & Journals", "bioRxiv", "https://www.biorxiv.org", "Preprint server for the life sciences.", ["preprint", "biology"]],
  ["Research & Journals", "PubMed", "https://pubmed.ncbi.nlm.nih.gov", "Database of biomedical literature.", ["biomedical"]],
  ["Research & Journals", "Semantic Scholar", "https://www.semanticscholar.org", "Literature search tool that generates paper summaries.", ["literature"]],
  ["Research & Journals", "DOAJ", "https://doaj.org", "Directory of open access journals.", ["open access"]],
  ["Research & Journals", "ORCID", "https://orcid.org", "Persistent unique identifier for researchers.", ["identity"]],
  ["Research & Journals", "ResearchGate", "https://www.researchgate.net", "Network for researchers to share publications.", ["networking"]],
  ["Research & Journals", "IEEE Xplore", "https://ieeexplore.ieee.org", "Engineering and technology literature.", ["engineering"]],
  ["Research & Journals", "Directory of Open Access Books", "https://www.doabooks.org", "Directory of open access academic books.", ["books"]],
  // Careers
  ["Careers & Internships", "Kampus Merdeka", "https://kampusmerdeka.kemdikbud.go.id", "Government internship and independent study programs for students.", ["internship"], true],
  ["Careers & Internships", "Glints", "https://glints.com", "Job and internship listings.", ["jobs"]],
  ["Careers & Internships", "Kalibrr", "https://www.kalibrr.com", "Job and internship listings.", ["jobs"]],
  ["Careers & Internships", "JobStreet Indonesia", "https://www.jobstreet.co.id", "Job listings portal.", ["jobs"]],
  ["Careers & Internships", "LinkedIn", "https://www.linkedin.com", "Professional network and job listings.", ["networking"]],
  ["Careers & Internships", "Google Summer of Code", "https://summerofcode.withgoogle.com", "Open source contribution program for students.", ["open source"]],
  ["Careers & Internships", "Major League Hacking", "https://mlh.io", "Student hackathon community.", ["hackathon"]],
  // Competitions
  ["Competitions", "Devpost", "https://devpost.com", "Hackathons and developer competitions.", ["hackathon"]],
  ["Competitions", "Kaggle", "https://www.kaggle.com", "Data science competitions and open datasets.", ["data"], true],
  ["Competitions", "iGEM", "https://igem.org", "International student synthetic biology competition.", ["biology"]],
  ["Competitions", "Puspresnas", "https://puspresnas.kemdikbud.go.id", "National student achievement center with information on student competitions.", ["national"]],
  // Tools
  ["Tools & Templates", "Overleaf", "https://www.overleaf.com", "Collaborative online LaTeX editor for papers and CVs.", ["latex"]],
  ["Tools & Templates", "Zotero", "https://www.zotero.org", "Free reference manager.", ["citations"], true],
  ["Tools & Templates", "Mendeley", "https://www.mendeley.com", "Reference manager and researcher network.", ["citations"]],
  ["Tools & Templates", "Canva", "https://www.canva.com", "Design tool for posters, CVs, and presentations.", ["design"]],
  ["Tools & Templates", "Notion", "https://www.notion.so", "Note-taking and project management tool.", ["productivity"]],
  ["Tools & Templates", "GitHub", "https://github.com", "Code hosting and project collaboration.", ["code"]],
  ["Tools & Templates", "Figma", "https://www.figma.com", "Collaborative interface design tool.", ["design"]],
  ["Tools & Templates", "Grammarly", "https://www.grammarly.com", "English grammar checker.", ["writing"]],
  // Campus
  ["ITB Campus", "Institut Teknologi Bandung", "https://www.itb.ac.id", "Official website of Institut Teknologi Bandung.", ["itb"]],
  ["ITB Campus", "Perpustakaan Pusat ITB", "https://www.lib.itb.ac.id", "Access to ITB library collections and databases.", ["itb", "library"]],
  // Learning
  ["Learning & Courses", "Coursera", "https://www.coursera.org", "Online courses from universities worldwide.", ["courses"]],
  ["Learning & Courses", "edX", "https://www.edx.org", "Online courses from universities worldwide.", ["courses"]],
  ["Learning & Courses", "Khan Academy", "https://www.khanacademy.org", "Free lessons in mathematics and science.", ["basics"]],
  ["Learning & Courses", "MIT OpenCourseWare", "https://ocw.mit.edu", "Free MIT course materials.", ["lectures"]],
  ["Learning & Courses", "freeCodeCamp", "https://www.freecodecamp.org", "Free programming lessons.", ["code"]],
  // Community
  ["Communities", "Indonesia Mengajar", "https://indonesiamengajar.org", "Education and leadership movement.", ["community"]],
];
