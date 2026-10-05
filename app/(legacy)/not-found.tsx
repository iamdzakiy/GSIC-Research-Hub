import Link from "next/link";
import StateScreen from "@/components/portal/StateScreen";

export default function NotFound() {
  return (
    <StateScreen code="404" title="Halaman tidak ditemukan" message="Tautan mungkin sudah berubah atau peluang tersebut telah dihapus. Coba cari di direktori peluang.">
      <Link href="/opportunities" className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">Lihat peluang</Link>
    </StateScreen>
  );
}
