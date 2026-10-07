# Pengaturan rate limit

Menu **Settings → Rate Limit** menyediakan pengaturan terpisah untuk login dan klaim undangan. Pengguna dengan `settings:read` dapat melihatnya; `settings:update` diperlukan untuk menyimpan.

Nilai awal: login 10 permintaan per 15 menit, klaim undangan 20 permintaan per 15 menit. Setiap kebijakan dapat diaktifkan/dinonaktifkan, maksimum diisi 1–10.000, dan periode 1–1.440 menit. Semua permintaan pada endpoint tersebut dihitung, termasuk yang berhasil atau gagal validasi. Permintaan di atas batas menerima HTTP 429 dan header `Retry-After` dalam detik.

Jalankan migrasi `0013_rate_limit_settings` sebelum menjalankan versi baru. Konfigurasi tersimpan di database; menyimpan pengaturan langsung memulai jendela waktu baru. Tombol “Gunakan Nilai Awal” hanya mengisi formulir; klik Simpan untuk menerapkan.

Kuota dihitung per alamat IP dan per proses Nitro. Pengguna di balik NAT dapat berbagi kuota. Counter kembali kosong setelah restart; konfigurasi tetap tersimpan. Deployment multi-replica memerlukan counter terpusat agar batas berlaku gabungan.

`TRUST_PROXY=false` secara default mengabaikan `X-Forwarded-For`. Aktifkan hanya jika reverse proxy terpercaya mengendalikan header tersebut dan backend tidak dapat diakses langsung oleh klien. Sesuaikan konfigurasi proxy saat memakai Cloudflare Tunnel.

Validasi: `npm test`. Uji integrasi lokal: `node scripts/qa-rate-limits.mjs` menggunakan akun pada `.temp/qa-state.json` dari lingkungan QA terpisah. Pengujian mengubah konfigurasi sementara lalu memulihkannya.
