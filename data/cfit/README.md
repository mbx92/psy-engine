# Sumber norma CFIT

`norms.json` disalin tanpa perubahan dari proyek lama:

`D:\dev\gym-new\gym-membership-backend\docs\soalPsikolog\data\cfit-norms.json`

Seeder yang merujuk sumber tersebut: `src/seeders/20251208164520-cfit-norms.js`.
Salinan frontend `gym-membership-fe/docs/cfit-norms.json` mempunyai SHA-256 identik:
`a12d581180724afc85b486ca6fced833acd94d1c13a127f9a41ed48fe59acedd`.

Ada 14 kelompok umur. Kelompok `13-9_dewasa` mencakup 165–999 bulan dan skor mentah 14–43; skor mentah 30 dipetakan menjadi IQ 96. Ini juga cocok dengan hasil QA sintetis pada server tanggal 14 September 2026. Temuan ini membuktikan konsistensi implementasi dengan tabel lama, bukan validasi psikometrik independen terhadap tabel tersebut.

Import menggunakan `npm run db:seed-cfit-norms` dengan DATABASE_URL tujuan yang benar. Seeder mempertahankan baris `cfit_iq` yang sudah ada dan mencatat hash sumber. Data berada di folder server, bukan `public`.

Scoring memilih kelompok umur pada tanggal mulai tes, kemudian mencari skor mentah yang tepat. Umur/skor di luar cakupan tidak diinterpolasi: jawaban tetap disimpan dan hasil meminta review admin. Kelengkapan norma di luar rentang yang tersedia perlu dikonfirmasi oleh pemilik instrumen.
