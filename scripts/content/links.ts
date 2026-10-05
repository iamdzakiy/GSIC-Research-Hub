// Official homepages only. Verify before launch; edit in Admin > Links.
export type SeedLink = [category: string, title: string, url: string, description: string, tags: string[], featured?: boolean];

export const SEED_LINKS: SeedLink[] = [
  // Beasiswa
  ["Beasiswa", "LPDP — Lembaga Pengelola Dana Pendidikan", "https://lpdp.kemenkeu.go.id", "Beasiswa pemerintah untuk S2/S3 dalam dan luar negeri.", ["beasiswa", "pemerintah"], true],
  ["Beasiswa", "Beasiswa Unggulan Kemdikbud", "https://beasiswaunggulan.kemdikbud.go.id", "Beasiswa untuk mahasiswa dan lulusan berprestasi.", ["beasiswa"]],
  ["Beasiswa", "Chevening Scholarships", "https://www.chevening.org", "Beasiswa pemerintah Inggris untuk studi master di UK.", ["uk", "s2"], true],
  ["Beasiswa", "Fulbright", "https://www.fulbright.org", "Program pertukaran dan beasiswa pendidikan ke Amerika Serikat.", ["usa"]],
  ["Beasiswa", "DAAD", "https://www.daad.de/en/", "Beasiswa dan informasi studi di Jerman.", ["jerman"]],
  ["Beasiswa", "Erasmus+", "https://erasmus-plus.ec.europa.eu", "Program mobilitas dan beasiswa Uni Eropa.", ["eropa"]],
  ["Beasiswa", "Study in Japan", "https://www.studyinjapan.go.jp/en/", "Portal resmi informasi studi dan beasiswa di Jepang.", ["jepang"]],
  ["Beasiswa", "Study in Korea", "https://www.studyinkorea.go.kr", "Portal resmi studi dan beasiswa pemerintah Korea (GKS).", ["korea"]],
  ["Beasiswa", "Scholarship Portal", "https://www.scholarshipportal.com", "Pencarian beasiswa internasional.", ["agregator"]],
  ["Beasiswa", "Studyportals", "https://www.studyportals.com", "Pencarian program studi dan beasiswa global.", ["agregator"]],
  // Riset
  ["Riset & Jurnal", "SINTA — Science and Technology Index", "https://sinta.kemdiktisaintek.go.id", "Indeks publikasi dan peneliti Indonesia.", ["jurnal", "indonesia"]],
  ["Riset & Jurnal", "Garuda — Garba Rujukan Digital", "https://garuda.kemdiktisaintek.go.id", "Portal rujukan jurnal ilmiah Indonesia.", ["jurnal"]],
  ["Riset & Jurnal", "Google Scholar", "https://scholar.google.com", "Mesin pencari literatur ilmiah.", ["literatur"], true],
  ["Riset & Jurnal", "arXiv", "https://arxiv.org", "Repositori preprint sains, teknik, dan matematika.", ["preprint"]],
  ["Riset & Jurnal", "bioRxiv", "https://www.biorxiv.org", "Preprint ilmu hayati.", ["preprint", "biologi"]],
  ["Riset & Jurnal", "PubMed", "https://pubmed.ncbi.nlm.nih.gov", "Basis data literatur biomedis.", ["biomedis"]],
  ["Riset & Jurnal", "Semantic Scholar", "https://www.semanticscholar.org", "Pencarian literatur dengan ringkasan berbasis AI.", ["literatur"]],
  ["Riset & Jurnal", "DOAJ", "https://doaj.org", "Direktori jurnal akses terbuka.", ["open access"]],
  ["Riset & Jurnal", "ORCID", "https://orcid.org", "Pengenal unik peneliti; daftarkan sejak dini.", ["identitas"]],
  ["Riset & Jurnal", "ResearchGate", "https://www.researchgate.net", "Jejaring peneliti dan berbagi publikasi.", ["jejaring"]],
  ["Riset & Jurnal", "IEEE Xplore", "https://ieeexplore.ieee.org", "Literatur teknik dan teknologi.", ["teknik"]],
  ["Riset & Jurnal", "Directory of Open Access Books", "https://www.doabooks.org", "Buku akademik akses terbuka.", ["buku"]],
  // Karier
  ["Karier & Magang", "Kampus Merdeka", "https://kampusmerdeka.kemdikbud.go.id", "Magang dan studi independen bersertifikat.", ["magang"], true],
  ["Karier & Magang", "Glints", "https://glints.com", "Lowongan kerja dan magang.", ["lowongan"]],
  ["Karier & Magang", "Kalibrr", "https://www.kalibrr.com", "Lowongan kerja dan magang.", ["lowongan"]],
  ["Karier & Magang", "JobStreet Indonesia", "https://www.jobstreet.co.id", "Portal lowongan kerja.", ["lowongan"]],
  ["Karier & Magang", "LinkedIn", "https://www.linkedin.com", "Jejaring profesional dan lowongan.", ["jejaring"]],
  ["Karier & Magang", "Google Summer of Code", "https://summerofcode.withgoogle.com", "Program kontribusi open source bagi mahasiswa.", ["open source"]],
  ["Karier & Magang", "Major League Hacking", "https://mlh.io", "Komunitas hackathon mahasiswa.", ["hackathon"]],
  // Kompetisi
  ["Kompetisi", "Devpost", "https://devpost.com", "Hackathon dan kompetisi pengembang.", ["hackathon"]],
  ["Kompetisi", "Kaggle", "https://www.kaggle.com", "Kompetisi data science dan dataset terbuka.", ["data"], true],
  ["Kompetisi", "iGEM", "https://igem.org", "Kompetisi biologi sintetis mahasiswa internasional.", ["biologi"]],
  ["Kompetisi", "Puspresnas", "https://puspresnas.kemdikbud.go.id", "Pusat prestasi nasional: info kompetisi mahasiswa.", ["nasional"]],
  // Tools
  ["Tools & Template", "Overleaf", "https://www.overleaf.com", "Editor LaTeX kolaboratif untuk makalah dan CV.", ["latex"]],
  ["Tools & Template", "Zotero", "https://www.zotero.org", "Pengelola referensi gratis.", ["sitasi"], true],
  ["Tools & Template", "Mendeley", "https://www.mendeley.com", "Pengelola referensi dan jejaring peneliti.", ["sitasi"]],
  ["Tools & Template", "Canva", "https://www.canva.com", "Desain poster, CV, dan presentasi.", ["desain"]],
  ["Tools & Template", "Notion", "https://www.notion.so", "Catatan dan manajemen proyek.", ["produktivitas"]],
  ["Tools & Template", "GitHub", "https://github.com", "Hosting kode dan kolaborasi proyek.", ["kode"]],
  ["Tools & Template", "Figma", "https://www.figma.com", "Desain antarmuka kolaboratif.", ["desain"]],
  ["Tools & Template", "Grammarly", "https://www.grammarly.com", "Pemeriksa tata bahasa Inggris.", ["menulis"]],
  // Kampus
  ["Kampus ITB", "Institut Teknologi Bandung", "https://www.itb.ac.id", "Situs resmi ITB.", ["itb"]],
  ["Kampus ITB", "Perpustakaan Pusat ITB", "https://www.lib.itb.ac.id", "Akses koleksi dan basis data pustaka ITB.", ["itb", "pustaka"]],
  // Belajar
  ["Belajar & Kursus", "Coursera", "https://www.coursera.org", "Kursus daring dari universitas dunia.", ["kursus"]],
  ["Belajar & Kursus", "edX", "https://www.edx.org", "Kursus daring dari universitas dunia.", ["kursus"]],
  ["Belajar & Kursus", "Khan Academy", "https://www.khanacademy.org", "Pelajaran gratis matematika dan sains.", ["dasar"]],
  ["Belajar & Kursus", "MIT OpenCourseWare", "https://ocw.mit.edu", "Materi kuliah MIT gratis.", ["kuliah"]],
  ["Belajar & Kursus", "freeCodeCamp", "https://www.freecodecamp.org", "Belajar pemrograman secara gratis.", ["kode"]],
  // Komunitas
  ["Komunitas", "Indonesia Mengajar", "https://indonesiamengajar.org", "Gerakan pendidikan dan kepemimpinan.", ["komunitas"]],
];
