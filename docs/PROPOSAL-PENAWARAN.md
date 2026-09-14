# PROPOSAL PENAWARAN
## PsyEngine — Platform Tes Psikologi Digital

| | |
|---|---|
| **Dokumen** | Proposal Penawaran Komersial |
| **Produk** | PsyEngine |
| **Versi sistem** | Produksi-siap (MVP+ hardening) |
| **Tanggal** | 7 September 2026 |
| **Repo** | `mbx92/psy-engine` |
| **Status** | Penawaran jual putus (buyout) |

---

## 1. Ringkasan eksekutif

**PsyEngine** adalah platform web untuk penyelenggaraan tes psikologi secara digital (rekrutmen, asesmen karier, dan asesmen organisasi). Sistem mencakup:

1. **Admin** — kelola peserta, jenis tes, sesi, undangan, verifikasi, laporan, dan psikogram.
2. **Peserta** — mengerjakan tes lewat tautan token (tanpa akun), dengan timer, auto-save, dan hasil.
3. **Psikolog / examiner** — susun psikogram (draft ke final) dengan tautan publik opsional.

Stack modern (Nuxt 3, PostgreSQL, Docker/Coolify) memudahkan deployment on-premise atau cloud, dengan kontrol akses berbasis peran (RBAC).

Dokumen ini menguraikan ruang lingkup, modul yang tersedia, **model harga jual putus (one-time buyout)**, asumsi implementasi, jadwal go-live, serta ketentuan pembayaran. Harga utama ditetapkan di muka: **Rp 10.000.000** (sepuluh juta rupiah) untuk penyerahan sistem beserta dukungan go-live dasar.

---

## 2. Masalah yang diselesaikan

| Tantangan umum | Solusi PsyEngine |
|---|---|
| Tes kertas / Excel tersebar | Satu alur digital: undangan → pengerjaan → skor → laporan |
| Sulit melacak status peserta | Lifecycle sesi: pending → in_progress → completed → verified / abandoned |
| Skor manual rentan salah | Skoring otomatis dari konfigurasi JSONB per jenis tes |
| Laporan tidak seragam | Laporan sesi + radar/bar chart + export CSV + psikogram terstruktur |
| Akses tidak terkontrol | JWT + RBAC (admin / superadmin + permission granular) |

---
## 3. Ruang lingkup produk (yang sudah ada)

### 3.1 Modul administrasi

- **Dashboard** — statistik sesi/peserta dengan chart
- **Peserta** — CRUD, import CSV massal
- **Jenis tes** — CRUD (aktif/nonaktif); konfigurasi soal dan skoring via JSON (seed: CFIT Scale 2, PAPI Kostick, EPPS)
- **Sesi** — buat sesi + token unik, filter, bulk create, verifikasi dengan catatan, timeline log kejadian
- **Undangan** — URL undangan dapat disalin; alur join/open invitation
- **Laporan** — detail skor dan interpretasi, radar (multi-dimensi), bar (skor tunggal), bandingkan sesi, export/print/CSV rentang tanggal
- **Psikogram** — draft/final, section terstruktur (kecerdasan, sikap kerja, kepribadian, kemampuan belajar), rekomendasi, token publik + expiry
- **Activity logs** — jejak aktivitas admin
- **Pengaturan** — profil pengguna, ganti password, kelola users / roles dan permissions

### 3.2 Modul peserta (publik)

- `/join` — masuk lewat undangan
- `/take/[token]` — konfirmasi peserta, instruksi, soal dinamis (4 tipe algoritma skoring), timer global (auto-submit saat habis), auto-save jawaban (refresh aman), submit → skor otomatis
- Tampilan hasil setelah selesai (sesuai alur yang diaktifkan)

### 3.3 Keamanan dan operasional

- Autentikasi JWT + hash password (bcrypt)
- Rate limit login/register (per IP, in-memory; Redis disarankan jika multi-instance)
- Validasi input API dengan Zod
- Projection aman (hash/token sensitif tidak bocor di response)
- Indeks DB pada kolom query berat
- Healthcheck `/api/health`
- Docker Compose + deploy Coolify (migrate → seed → start)

### 3.4 Tes bawaan (seed)

| Tes | Keterangan singkat |
|---|---|
| **CFIT Scale 2** | Inteligensi / skor tunggal (chart bar) |
| **PAPI Kostick** | Multi-dimensi kepribadian kerja (~20 dimensi, radar) |
| **EPPS** | Multi-dimensi kebutuhan/preferensi (radar) |

Jenis tes baru dapat ditambahkan lewat admin (konfigurasi JSON). Penambahan jenis tes di luar tiga seed di atas dapat dikerjakan oleh penyedia dengan tarif terpisah (lihat Bagian 6).

---

## 4. Batasan dan roadmap (transparansi ruang lingkup)

Agar ekspektasi jelas, item berikut **belum / sebagian** diimplementasikan saat ini:

| Item | Status | Catatan |
|---|---|---|
| Visual question builder | Belum | Editor memakai textarea JSON (fungsional untuk admin teknis) |
| Timer per subtes CFIT | Parsial | Label subtes ada; timer masih global per tes |
| Pagination soal (`questionsPerPage`) | Belum | Renderer 1 soal per layar |
| Tab konfigurasi sistem (nama app, dark mode) | Belum | Settings fokus profil/security/users/roles |
| Pagination list API | Ditunda | Cukup untuk skala data saat ini |
| OpenAPI UI (Swagger/Scalar) | Belum | Flag experimental ada, UI belum |

Item di atas dapat dimasukkan sebagai **add-on / fase 2** (estimasi terpisah setelah discovery).

---

## 5. Arsitektur teknis

| Lapisan | Teknologi |
|---|---|
| Frontend / full-stack | Nuxt 3 (Vue 3), server API Nitro |
| Basis data | PostgreSQL + Drizzle ORM |
| Validasi | Zod |
| Auth | JWT + bcrypt, RBAC (roles & permissions) |
| Deploy | Docker Compose / Coolify |
| Observabilitas | Healthcheck, activity logs, rate limiting |

Alur utama: Admin membuat peserta & sesi → undangan/token dikirim → peserta mengerjakan di `/take/[token]` → skor otomatis → laporan & psikogram.

---
## 6. Penawaran harga — jual putus (buyout)

Model komersial yang ditawarkan adalah **jual putus (one-time buyout)**: satu pembayaran untuk penyerahan sistem beserta dukungan go-live dasar. Tidak ada paket bertingkat A–D sebagai penawaran utama.

### 6.1 Harga jual putus

| Komponen | Harga (IDR) |
|---|---|
| **Jual putus PsyEngine** (lisensi & handover + go-live dasar) | **Rp 10.000.000** |
| **Jenis tes tambahan** (di luar 3 seed: CFIT, PAPI, EPPS) | **Rp 2.500.000** / jenis tes |

**Total harga jual putus: Rp 10.000.000** (sepuluh juta rupiah).

### 6.2 Yang termasuk dalam Rp 10.000.000

- Akses repositori / artefak deploy (Docker) dan kode sumber PsyEngine
- Dokumentasi instalasi, env, migrasi, dan seed
- Seed tes bawaan: **CFIT Scale 2**, **PAPI Kostick**, **EPPS** (struktur teknis engine; konten soal / norma / kunci jawaban berlisensi menjadi tanggung jawab klien — lihat Bagian 8)
- Deploy ke infrastruktur klien (Coolify/VPS/cloud yang disediakan klien) atau panduan setara
- Konfigurasi env, SSL, dan backup DB dasar
- Briefing teknis + pelatihan admin (hingga 2 sesi remote)
- Import CSV peserta contoh + bulk session untuk uji alur
- Hardening checklist (JWT, rate limit, projection aman)
- Support stabilisasi pasca go-live terbatas (sesuai SOW, sekitar masa jadwal ~3 minggu hingga serah terima)

### 6.3 Yang tidak termasuk (kecuali disepakati terpisah)

- Kustomisasi fitur baru / item roadmap (visual builder, timer subtes, SSO, branding mendalam, dsb.)
- Hosting berbayar jangka panjang di akun penyedia
- Pelatihan pengguna akhir berkelanjutan di luar sesi yang disebutkan
- Pengadaan lisensi konten psikometrik dari penerbit resmi
- Retainer operasional bulanan (opsional — lihat 6.5)

### 6.4 Jenis tes tambahan

Setiap **jenis tes baru** yang diminta di luar tiga seed bawaan (CFIT Scale 2, PAPI Kostick, EPPS) ditagih **Rp 2.500.000 (dua juta lima ratus ribu rupiah) per jenis tes**. Lingkup mencakup konfigurasi struktur soal/skoring di engine sesuai spesifikasi yang disepakati; penyediaan konten berlisensi tetap tanggung jawab klien.

### 6.5 Add-on opsional (bukan penawaran utama)

Atas permintaan klien, dapat ditawarkan secara terpisah:

- **Kustomisasi / integrasi** — branding UI, template laporan/psikogram, email gateway, SSO/webhook, atau item roadmap; estimasi setelah discovery singkat.
- **Retainer operasional** — monitoring, patch keamanan, bantuan admin terbatas, review backup; ditagih bulanan sesuai kesepakatan tertulis (bukan bagian dari harga jual putus).

Lingkup final add-on ditulis dalam SOW / lampiran kontrak.

---
## 7. Deliverables

| No | Deliverable | Termasuk jual putus |
|---|---|---|
| 1 | Kode sumber / image deploy PsyEngine + skrip migrate/seed | Ya |
| 2 | Dokumentasi instalasi & operasional (env, Docker/Coolify) | Ya |
| 3 | Instance produksi terkonfigurasi (jika infrastruktur klien siap) | Ya |
| 4 | Akun admin awal + panduan RBAC | Ya |
| 5 | Materi pelatihan singkat (slide / catatan sesi) | Ya |
| 6 | Laporan go-live & checklist keamanan dasar | Ya |
| 7 | Konfigurasi jenis tes tambahan (jika dipesan) | Tarif per jenis tes |
| 8 | Artefak kustomisasi / retainer (jika dipesan) | Add-on terpisah |

---

## 8. Asumsi: tanggung jawab klien vs penyedia

### 8.1 Tanggung jawab klien

- **Lisensi konten tes psikologi** — PsyEngine adalah **mesin teknis** (engine). Hak penggunaan soal, norma, kunci jawaban, dan interpretasi resmi (CFIT, PAPI Kostick, EPPS, atau tes lain) adalah **tanggung jawab klien**. Penyedia tidak menjual atau mensublisensikan materi psikometrik berhak cipta.
- Menyediakan infrastruktur (server/VPS/Coolify/cloud), domain, SSL, dan akses deploy yang diperlukan.
- Menunjuk PIC bisnis & teknis; menyiapkan data peserta (CSV) dan kebijakan internal privasi data.
- Memastikan kepatuhan hukum setempat terkait asesmen dan perlindungan data pribadi.
- Menyetujui konten seed yang akan dipakai di produksi (atau menggantinya dengan konten berlisensi klien).

### 8.2 Tanggung jawab penyedia

- Menyerahkan dan mengimplementasikan **PsyEngine** sesuai lingkup jual putus yang disepakati.
- Menjamin kualitas teknis engine: skoring sesuai konfigurasi JSON, RBAC/JWT, deploy Docker, validasi Zod, rate limit, laporan, psikogram.
- Dokumentasi teknis dan pelatihan sesuai lingkup jual putus.
- Tidak mengklaim kepemilikan atas hasil asesmen individual milik klien; data operasional klien tetap milik klien.

### 8.3 Di luar lingkup (kecuali disepakati tertulis)

- Pengadaan lisensi alat psikologi dari penerbit resmi
- Audit hukum / sertifikasi klinis
- Pengembangan visual question builder atau item roadmap tanpa adendum
- Hosting berbayar jangka panjang di akun penyedia (kecuali retainer khusus)

---

## 9. Jadwal indikatif — go-live (~3 minggu)

| Minggu | Aktivitas utama | Hasil |
|---|---|---|
| **Minggu 1** | Kick-off, akses infra, deploy staging, migrasi DB, seed, konfigurasi env/SSL | Staging hidup; admin dapat login |
| **Minggu 2** | Import peserta uji, bulk session, uji alur `/take/[token]`, skoring & laporan, penyesuaian kecil | UAT internal / klien |
| **Minggu 3** | Perbaikan temuan UAT, pelatihan admin, cut-over produksi, checklist go-live, serah terima | Produksi live + dokumen serah terima |

Jadwal dapat bergeser jika akses infrastruktur, konten tes, atau keputusan UAT tertunda di sisi klien.

---
## 10. Ketentuan pembayaran (usulan)

Skema standar **40% / 40% / 20%** atas harga jual putus **Rp 10.000.000** (dapat disesuaikan dalam kontrak):

| Tahap | Persentase | Nominal indikatif | Pemicu |
|---|---|---|---|
| Tanda tangan / kick-off | **40%** | Rp 4.000.000 | PO / kontrak ditandatangani; invoice 1 |
| Milestone UAT / staging siap | **40%** | Rp 4.000.000 | Staging diterima untuk UAT; invoice 2 |
| Go-live & serah terima | **20%** | Rp 2.000.000 | Produksi live + dokumen serah terima; invoice 3 |

- Jenis tes tambahan (**Rp 2.500.000** / jenis) dapat ditagih saat pemesanan atau digabung ke invoice milestone terkait.
- Mata uang: Rupiah (IDR), kecuali disepakati lain.
- Pajak (PPN/PPh) mengikuti ketentuan berlaku dan dicantumkan pada invoice.
- Retainer opsional (jika ada) ditagih di muka per periode bulanan, terpisah dari jual putus.

---

## 11. Masa berlaku penawaran

Penawaran ini berlaku **30 hari** sejak tanggal dokumen (7 September 2026), kecuali diperpanjang tertulis. Harga jual putus dan tarif jenis tes tambahan sebagaimana tercantum pada Bagian 6 berlaku selama masa berlaku dokumen ini.

---

## 12. Penutup

PsyEngine siap mendukung digitalisasi alur asesmen psikologi secara terkontrol, aman, dan dapat di-deploy mandiri. Dengan model **jual putus Rp 10.000.000**, klien memperoleh handover kode, tiga seed tes bawaan, dokumentasi, serta dukungan go-live dasar hingga serah terima.

Kami terbuka untuk diskusi singkat guna menyesuaikan SOW, jenis tes tambahan, atau add-on opsional.

Hormat kami,  
**Tim Penyedia PsyEngine**  
Dokumen penawaran — 7 September 2026

---

*Lampiran opsional (disediakan terpisah atas permintaan): daftar endpoint utama, skema RBAC, contoh CSV import, screenshot UI.*
