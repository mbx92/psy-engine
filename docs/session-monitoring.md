# Monitoring sesi

Buka **Monitoring** dari menu workspace atau tombol pada halaman **Sessions**.
Alamat langsung: `/admin/monitoring`. Halaman memakai seluruh lebar layar tanpa sidebar,
dengan tombol layar penuh dan tautan kembali ke daftar sesi.

Monitoring membutuhkan login dan izin `sessions:read`, termasuk pada API.
Semua sesi pending/in progress serta sesi yang diperbarui dalam 24 jam terakhir
masuk dalam pantauan. Filter awal menampilkan sesi aktif. Pencarian, filter jenis tes,
filter perlu diperiksa, dan paginasi membantu memantau banyak peserta.

## Informasi yang ditampilkan

- Nama peserta, jenis tes, status sesi, dan waktu mulai.
- Nomor soal yang sedang dilihat peserta (mengikuti urutan di browser, termasuk soal acak),
  petunjuk subtes, serta progres jawaban yang sudah tersimpan di server.
- Sinyal koneksi, tab terlihat/tersembunyi, dan status penyimpanan dari browser peserta.
- 60 aktivitas terbaru dalam 24 jam: mulai/selesai sesi, perpindahan soal,
  progres penyimpanan, perpindahan tab, dan laporan gagal menyimpan.
- Waktu sinkron terakhir dan lama respons permintaan monitoring.

## Pembaruan dan batas pengamatan

Dashboard mengambil snapshot setiap 3 detik setelah permintaan sebelumnya selesai.
Browser peserta mengirim heartbeat setiap 15 detik, serta setelah perpindahan soal,
perubahan status penyimpanan, dan perubahan visibilitas tab (debounce 300 ms).
Halaman tes yang sudah terbuka sebelum fitur dirilis perlu dimuat ulang agar mengirim heartbeat.

Sinyal yang berusia lebih dari 45 detik ditandai **Tidak ada sinyal**; penyebabnya bisa
koneksi, tab/perangkat ditangguhkan, atau halaman ditutup. Ini bukan kepastian offline.
**Belum ada sinyal** berarti belum menerima heartbeat, bukan peserta bermasalah.
Tab tersembunyi, sinyal terlambat, dan kegagalan simpan masuk filter **Perlu diperiksa**.
Sesi yang sudah berakhir tidak mendapat peringatan koneksi.

Jika dashboard gagal memperbarui, data terakhir dipertahankan dengan peringatan jelas
dan pembaruan dicoba kembali otomatis. Tampilan memantau aktivitas aplikasi tes;
tidak merekam layar atau aktivitas aplikasi lain di perangkat peserta.

Telemetry memakai `sessions.metadata.monitoring` dan riwayat `session_logs` yang sudah
ada, sehingga tidak membutuhkan migrasi atau seed baru. Heartbeat rutin tidak memenuhi
activity log umum; hanya perubahan bermakna masuk riwayat sesi. Endpoint snapshot
tidak mengirim token undangan, isi jawaban, atau kunci penilaian.

Pemeriksaan logika koneksi: `node scripts/test-session-monitoring.mjs`.
