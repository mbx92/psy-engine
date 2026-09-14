# Catatan penerapan perbaikan

Perbaikan hanya dikerjakan pada repo lokal. Server `10.100.10.100:8880` masih memakai versi sebelumnya; QA server menggunakan tiga peserta sintetis yang dicatat dalam `server-baseline.json`.

1. Cadangkan database tujuan sebelum migrasi. Hindari pergantian versi saat peserta masih mengerjakan tes: sesi subtes lama belum memiliki deadline server.
2. Set `JWT_SECRET` acak minimal 32 karakter. Nilai kosong, pendek, `change-in-production`, atau placeholder `replace-with` ditolak pada runtime produksi. Jangan menyalin contoh secret sebagai nilai aktual.
3. Jalankan `npm run db:migrate` dengan `DATABASE_URL` tujuan (atau migration otomatis entrypoint). Migrasi 0012 menambah `auth_sessions`; pengguna perlu login ulang karena token lama tidak memiliki ID sesi yang tersimpan.
4. Jalankan `npm run db:seed-cfit-norms` bila norma CFIT belum ada. Seeder menjaga norma `cfit_iq` yang sudah tersedia. Tidak perlu memaksa seeder soal: seed bawaan berisi soal contoh pendek. Pertahankan definisi soal server 46/90/225 yang sudah ada.
5. LAN QA dapat memakai `AUTH_COOKIE_SECURE=false`. Saat memakai Cloudflare Tunnel, gunakan `AUTH_COOKIE_SECURE=true` dan `APP_ORIGIN=https://hostname-publik-yang-tepat` tanpa trailing slash. Verifikasi origin, cookie Secure/HttpOnly, login, logout, dan alur ketiga tes pada hostname publik sebelum penerimaan akhir.
6. Ulangi QA setelah versi ini benar-benar diterapkan. Build Node berhasil bukan bukti image Docker/tunnel telah diuji. Uji kapasitas, recovery database, dan validitas psikometrik tidak tercakup dalam pemeriksaan regresi ini.

## Uji yang dapat diulang

`npm test` menjalankan unit regresi dan monitoring. `npm run build` membangun aplikasi.

`scripts/qa-api.mjs` menerima `QA_BASE_URL`, `QA_EMAIL`, `QA_PASSWORD`. Script membuat peserta dan sesi sintetis; jalankan hanya pada lingkungan yang disetujui. Mode `QA_LEGACY=true` hanya untuk membandingkan server lama.

`scripts/qa-local-integrity.mjs` hanya ditujukan pada loopback 8890 dan database terpisah bernama `psy_qa_*` melalui `.temp/qa-state.json`. Script mengubah akun uji, deadline, dan norma sementara untuk menguji penanganan kegagalan. Jangan arahkan ke database operasional.

Norma hasil penelusuran dan cakupannya dijelaskan dalam `data/cfit/README.md`. Skor/umur yang tidak ada dalam tabel disimpan untuk review admin, tanpa IQ perkiraan.
