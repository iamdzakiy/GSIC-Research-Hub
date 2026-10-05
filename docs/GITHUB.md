# Memasukkan perubahan ini ke repo GitHub yang sudah ada

Aman dilakukan lewat **branch + Pull Request**, sehingga `main` tidak tersentuh sampai Anda puas.

```bash
# 1. Siapkan repo lokal yang up-to-date
cd gsic-hub
git checkout main && git pull
git checkout -b feat/portal-v2

# 2. Terapkan paket (idempoten; aman diulang)
unzip portal-refactor.zip -d /tmp
bash /tmp/portal-refactor/apply.sh

# 3. Env + database
cp .env.portal.example .env.portal.tmp      # salin variabel baru ke .env / .env.local, lalu hapus file tmp
npx prisma migrate deploy                   # atau: npm run db:push  (4 migrasi: 20261005..20261007)
npx tsx scripts/seed-portal.ts              # pranala + artikel blog awal (butuh 1 akun admin)

# 4. Cek lokal
npm run build && npm run dev

# 5. Commit & push
git add -A
git status                                  # pastikan .env TIDAK ikut
git commit -m "feat: portal v2 (directory, links, rapor, dashboard, gallery)"
git push -u origin feat/portal-v2
```

Lalu buka Pull Request `feat/portal-v2 -> main` di GitHub. Jika memakai Vercel, setiap PR otomatis mendapat **Preview URL**; uji di sana sebelum merge.

## Urutan aman di produksi
1. Tambahkan env baru di Vercel (`SMTP_*`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, opsional `NEXT_PUBLIC_TEASER_VIDEO_URL`).
2. Jalankan migrasi database **sebelum** deploy kode (semua migrasi bersifat penambahan kolom/tabel, tidak menghapus data).
3. Supabase -> Auth -> URL Configuration: tambah `https://<domain>/auth/callback**`.
4. Merge PR, lalu jalankan seed sekali.

## Rollback
`git revert <merge-commit>` mengembalikan kode. Migrasi hanya menambah, jadi data lama tetap aman dan kode lama tetap berjalan.

## Catatan keamanan yang ikut diperbaiki
* `GET /api/test-results` sebelumnya publik; kini hanya admin (semua) atau pemilik (milik sendiri).
* Skor tes sebelumnya dihitung di browser dan dikirim apa adanya; kini dihitung server dari soal tersimpan, `userId` dipaksa dari token, satu kali pengerjaan per tes, post-test mensyaratkan pre-test.
* Respons `GET /api/tests` masih memuat `correctAnswer` ke browser. Pemisahan kunci jawaban dari soal untuk peserta adalah langkah lanjutan yang disarankan.
