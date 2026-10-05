// ============================================================
// Per-type configuration + "Quick Overview" builder (pure; no DB).
// ============================================================
import { formatDateId, TYPE_LABEL } from "@/lib/opportunity-status";
import { readList, quickFact, type QuickFact } from "@/lib/validation/opportunity";

export type OppType = "scholarship" | "competition" | "research" | "career";
export const OPP_TYPE_ORDER: OppType[] = ["scholarship", "competition", "research", "career"];

export interface TypeConfig {
  label: string;
  plural: string;
  blurb: string;
  /** Headings used on the detail page (vary by type so copy reads naturally). */
  headings: { about: string; eligibility: string; benefits: string; apply: string };
  applyCta: string;
  /** Suggested "Informasi Tambahan" rows & checklists the admin editor can pre-fill. */
  presetFacts: string[];
  presetDocs: string[];
  presetSteps: { title: string; description: string }[];
}

export const TYPE_CONFIG: Record<OppType, TypeConfig> = {
  scholarship: {
    label: "Beasiswa", plural: "Beasiswa", blurb: "Dukungan biaya pendidikan dan hidup, dalam & luar negeri.",
    headings: { about: "Tentang Beasiswa", eligibility: "Kriteria Penerima", benefits: "Cakupan Beasiswa", apply: "Cara Mendaftar" },
    applyCta: "Daftar Beasiswa",
    presetFacts: ["IPK minimal", "Cakupan biaya hidup", "Ikatan dinas / kewajiban", "Institusi tujuan"],
    presetDocs: ["KTP / KTM", "Transkrip nilai", "Surat rekomendasi", "Esai motivasi", "CV"],
    presetSteps: [
      { title: "Siapkan dokumen", description: "Pindai dokumen persyaratan dalam format PDF sesuai ketentuan." },
      { title: "Buat akun di portal penyelenggara", description: "Gunakan email aktif yang rutin Anda cek." },
      { title: "Lengkapi formulir & unggah berkas", description: "Periksa kembali isian sebelum mengirim." },
      { title: "Kirim sebelum batas waktu", description: "Simpan bukti pengiriman / nomor pendaftaran." },
      { title: "Ikuti tahapan seleksi", description: "Pantau pengumuman lewat email dan kanal resmi." },
    ],
  },
  competition: {
    label: "Kompetisi", plural: "Kompetisi", blurb: "Lomba karya tulis, inovasi, bisnis, dan teknologi tingkat nasional & internasional.",
    headings: { about: "Tentang Kompetisi", eligibility: "Syarat Peserta", benefits: "Hadiah & Penghargaan", apply: "Cara Mengikuti" },
    applyCta: "Daftar Kompetisi",
    presetFacts: ["Ukuran tim", "Total hadiah", "Kategori lomba", "Biaya pendaftaran", "Format babak"],
    presetDocs: ["Proposal / abstrak", "Identitas tim", "Surat keterangan mahasiswa aktif", "Bukti pembayaran"],
    presetSteps: [
      { title: "Bentuk tim", description: "Pastikan komposisi tim memenuhi ketentuan." },
      { title: "Registrasi tim", description: "Daftarkan tim melalui tautan resmi." },
      { title: "Kirim karya / proposal", description: "Ikuti panduan format dan batas waktu pengumpulan." },
      { title: "Ikuti babak seleksi & final", description: "Siapkan presentasi dan demonstrasi." },
    ],
  },
  research: {
    label: "Research Grant", plural: "Research Grant", blurb: "Hibah riset, program peneliti muda, dan kolaborasi laboratorium.",
    headings: { about: "Tentang Program Riset", eligibility: "Kriteria Pengusul", benefits: "Dukungan & Pendanaan", apply: "Cara Mengajukan" },
    applyCta: "Ajukan Proposal",
    presetFacts: ["Bidang riset", "Skema pendanaan", "Maks. dana per proyek", "Luaran wajib", "Institusi pelaksana"],
    presetDocs: ["Proposal riset", "CV peneliti", "Rencana anggaran biaya", "Surat dukungan pembimbing"],
    presetSteps: [
      { title: "Tentukan skema & topik", description: "Pastikan topik sesuai prioritas riset penyelenggara." },
      { title: "Susun proposal & RAB", description: "Ikuti template resmi, perhatikan batas halaman." },
      { title: "Lengkapi persetujuan pembimbing / institusi", description: "" },
      { title: "Unggah proposal", description: "Kirim melalui sistem resmi sebelum batas waktu." },
      { title: "Review & wawancara", description: "Bersiap mempresentasikan proposal." },
    ],
  },
  career: {
    label: "Karier", plural: "Karier & Magang", blurb: "Magang, program trainee, fellowship, dan lowongan untuk mahasiswa & fresh graduate.",
    headings: { about: "Tentang Posisi", eligibility: "Kualifikasi", benefits: "Kompensasi & Fasilitas", apply: "Cara Melamar" },
    applyCta: "Lamar Sekarang",
    presetFacts: ["Tipe pekerjaan", "Rentang gaji / stipend", "Skema kerja", "Durasi kontrak", "Level pengalaman"],
    presetDocs: ["CV", "Portofolio", "Transkrip nilai", "Cover letter"],
    presetSteps: [
      { title: "Perbarui CV & portofolio", description: "Sesuaikan dengan deskripsi posisi." },
      { title: "Kirim lamaran", description: "Gunakan tautan resmi perusahaan." },
      { title: "Tes & asesmen", description: "Biasanya berupa tes online / studi kasus." },
      { title: "Wawancara", description: "HR dan user interview." },
      { title: "Penawaran (offering)", description: "" },
    ],
  },
};

export const isOppType = (t: string): t is OppType => t in TYPE_CONFIG;
export const typeLabel = (t: string) => (isOppType(t) ? TYPE_CONFIG[t].label : TYPE_LABEL[t] ?? t);

export const FUNDING_LABEL: Record<string, string> = {
  fully_funded: "Pendanaan penuh (fully funded)",
  partially_funded: "Pendanaan sebagian",
  tuition_only: "Biaya pendidikan saja",
  stipend: "Stipend / uang saku",
  prize_money: "Hadiah uang",
  paid: "Berbayar (digaji)",
  unpaid: "Tanpa gaji",
  self_funded: "Biaya mandiri",
};
export const FUNDING_SHORT: Record<string, string> = {
  fully_funded: "Fully funded", partially_funded: "Sebagian", tuition_only: "Biaya kuliah", stipend: "Stipend",
  prize_money: "Hadiah uang", paid: "Digaji", unpaid: "Tanpa gaji", self_funded: "Mandiri",
};
export const MODE_LABEL: Record<string, string> = { onsite: "Tatap muka (onsite)", online: "Daring (online)", hybrid: "Hybrid" };
export const MODE_SHORT: Record<string, string> = { onsite: "Onsite", online: "Online", hybrid: "Hybrid" };

// ---------------------------------------------------------------- quick overview

export interface DetailSource {
  title: string;
  organizer: string;
  type: string;
  scope: string;
  levels: string[];
  fieldsOfStudy: string[];
  openDate: Date | string | null;
  deadline: Date | string;
  programStart: Date | string | null;
  programEnd: Date | string | null;
  quota: number | null;
  fundingType: string | null;
  fundingAmount: string | null;
  attendanceMode: string | null;
  city: string | null;
  country: string | null;
  location: string | null;
  ageMin: number | null;
  ageMax: number | null;
  nationality: string | null;
  minGpa: number | null;
  duration: string | null;
  language: string | null;
  quickFacts: unknown;
}

export interface Fact { label: string; value: string }
export interface FactGroup { title: string; facts: Fact[] }

const TZ = "Asia/Jakarta";

/** "9 Oktober 2026" or "9 Oktober 2026, 23.59 WIB" when a time of day was set. */
export function formatDateTimeId(d: Date | string): string {
  const date = new Date(d);
  const day = formatDateId(date);
  const hm = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ }).format(date);
  return /^00[.:]00$/.test(hm) ? day : `${day}, ${hm.replace(":", ".")} WIB`;
}

export function formatAge(min: number | null, max: number | null): string | null {
  if (min != null && max != null) return `${min}–${max} tahun`;
  if (min != null) return `Minimal ${min} tahun`;
  if (max != null) return `Maksimal ${max} tahun`;
  return null;
}

export function formatPlace(city: string | null, country: string | null, fallback?: string | null): string | null {
  const s = [city, country].filter(Boolean).join(", ");
  return s || fallback || null;
}

export function buildQuickOverview(o: DetailSource): FactGroup[] {
  const range = o.programStart ? `${formatDateId(o.programStart)}${o.programEnd ? ` – ${formatDateId(o.programEnd)}` : ""}` : null;
  const funding = [o.fundingType ? FUNDING_LABEL[o.fundingType] : null, o.fundingAmount].filter(Boolean).join(" · ");

  const groups: FactGroup[] = [
    {
      title: "Informasi Program",
      facts: [
        { label: "Nama program", value: o.title },
        { label: "Penyelenggara", value: o.organizer },
        { label: "Tipe", value: typeLabel(o.type) },
        { label: "Kategori", value: o.scope === "internal" ? "Internal (ITB)" : "Eksternal" },
        { label: "Bahasa", value: o.language ?? "" },
        { label: "Durasi", value: o.duration ?? "" },
        { label: "Pelaksanaan", value: range ?? "" },
      ],
    },
    {
      title: "Lokasi & Format",
      facts: [
        { label: "Format", value: o.attendanceMode ? MODE_LABEL[o.attendanceMode] ?? "" : "" },
        { label: "Kota", value: o.city ?? "" },
        { label: "Negara", value: o.country ?? "" },
        { label: "Lokasi", value: !o.city && !o.country ? o.location ?? "" : "" },
      ],
    },
    {
      title: "Pendanaan & Kuota",
      facts: [
        { label: "Jenis pendanaan", value: funding },
        { label: "Kuota penerima", value: o.quota != null ? `${o.quota.toLocaleString("id-ID")} orang` : "" },
      ],
    },
    {
      title: "Persyaratan Dasar",
      facts: [
        { label: "Jenjang", value: o.levels.join(", ") },
        { label: "Bidang studi", value: o.fieldsOfStudy.join(", ") },
        { label: "Usia", value: formatAge(o.ageMin, o.ageMax) ?? "" },
        { label: "Kewarganegaraan", value: o.nationality ?? "" },
        { label: "IPK minimal", value: o.minGpa != null ? o.minGpa.toFixed(2).replace(".", ",") : "" },
      ],
    },
    {
      title: "Tanggal Penting",
      facts: [
        { label: "Pendaftaran dibuka", value: o.openDate ? formatDateTimeId(o.openDate) : "" },
        { label: "Batas pendaftaran", value: formatDateTimeId(o.deadline) },
      ],
    },
  ];

  const extras: QuickFact[] = readList(quickFact, o.quickFacts);
  if (extras.length) groups.push({ title: "Informasi Tambahan", facts: extras.map((f) => ({ label: f.label, value: f.value })) });

  return groups
    .map((g) => ({ ...g, facts: g.facts.filter((f) => f.value && f.value.trim()) }))
    .filter((g) => g.facts.length > 0);
}

/** Human-readable basic criteria derived from structured fields (shown first under "Kriteria"). */
export function deriveBasicCriteria(o: Pick<DetailSource, "levels" | "fieldsOfStudy" | "ageMin" | "ageMax" | "nationality" | "minGpa">): string[] {
  const out: string[] = [];
  if (o.levels.length) out.push(`Mahasiswa / lulusan jenjang ${o.levels.join(", ")}`);
  if (o.fieldsOfStudy.length) out.push(`Bidang studi: ${o.fieldsOfStudy.join(", ")}`);
  const age = formatAge(o.ageMin, o.ageMax);
  if (age) out.push(`Usia ${age.charAt(0).toLowerCase()}${age.slice(1)}`);
  if (o.nationality) out.push(`Kewarganegaraan: ${o.nationality}`);
  if (o.minGpa != null) out.push(`IPK minimal ${o.minGpa.toFixed(2).replace(".", ",")}`);
  return out;
}
