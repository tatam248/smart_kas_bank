# PANDUAN LENGKAP DEPLOYMENT KEUANGAN CERDAS
### Panduan Publikasi Aplikasi Web ke Vercel dan Netlify

Aplikasi **KEUANGAN CERDAS** dibangun menggunakan arsitektur modern **Single Page Application (SPA)** berbasis **React + Vite + Tailwind CSS**. Aplikasi ini sangat ringan, cepat, dan dapat di-host secara **100% GRATIS** di platform cloud global seperti **Vercel** maupun **Netlify**.

File konfigurasi otomatis telah disiapkan di repositori ini:
- `vercel.json` (Konfigurasi routing SPA & build untuk Vercel)
- `netlify.toml` (Konfigurasi build & redirects untuk Netlify)
- `public/_redirects` (Cadangan routing static fallback)

---

## DAFTAR ISI
1. [Persiapan Repositori GitHub](#1-persiapan-repositori-github)
2. [Cara Deploy ke Vercel (Rekomendasi Utama)](#2-cara-deploy-ke-vercel-rekomendasi-utama)
3. [Cara Deploy ke Netlify](#3-cara-deploy-ke-netlify)
4. [Konfigurasi Google OAuth & Authorized Domains (WAJIB)](#4-konfigurasi-google-oauth--authorized-domains-wajib)
5. [Menghubungkan Custom Domain Sendiri](#5-menghubungkan-custom-domain-sendiri)
6. [Troubleshooting & Solusi Error](#6-troubleshooting--solusi-error)

---

## 1. Persiapan Repositori GitHub

Sebelum melakukan deploy, pastikan seluruh kode sumber aplikasi telah berada di akun GitHub Anda:

1. Buka terminal komputer Anda di folder proyek ini.
2. Buat repositori baru di [GitHub.com](https://github.com/new) (misal dengan nama `keuangan-cerdas`).
3. Jalankan perintah git berikut:
   ```bash
   git init
   git add .
   git commit -m "Initial commit Keuangan Cerdas"
   git branch -M main
   git remote add origin https://github.com/USERNAME-ANDA/keuangan-cerdas.git
   git push -u origin main
   ```

---

## 2. Cara Deploy ke Vercel (Rekomendasi Utama)

Vercel adalah platform hosting tercepat dan paling optimal untuk aplikasi berbasis Vite.

### Langkah-langkah:
1. Buka situs [vercel.com](https://vercel.com) dan masuk menggunakan akun **GitHub** Anda.
2. Di halaman Dashboard Vercel, klik tombol **"Add New..."** lalu pilih **"Project"**.
3. Di daftar repositori GitHub yang muncul, cari repositori `keuangan-cerdas` lalu klik **"Import"**.
4. Pada formulir konfigurasi project:
   - **Project Name**: `keuangan-cerdas` (atau sesuaikan keinginan Anda)
   - **Framework Preset**: Pilih **Vite** (biasanya terdeteksi otomatis)
   - **Root Directory**: `./` (biarkan default)
   - **Build and Output Settings**:
     - *Build Command*: `npm run build`
     - *Output Directory*: `dist`
     - *Install Command*: `npm install`
5. Klik tombol **"Deploy"**.
6. Tunggu proses build berlangsung sekitar 30–60 detik.
7. 🎉 **Selamat!** Aplikasi Anda sudah aktif dan online dengan URL publik, contohnya:
   `https://keuangan-cerdas-xxx.vercel.app`

---

## 3. Cara Deploy ke Netlify

Netlify adalah alternatif populer yang sangat stabil dengan CDN global.

### Langkah-langkah:
1. Buka situs [netlify.com](https://netlify.com) dan login dengan akun **GitHub** Anda.
2. Di dashboard Netlify, klik tombol **"Add new site"** -> **"Import an existing project"**.
3. Pilih penyedia Git: **GitHub**.
4. Otorisasikan Netlify untuk membaca repositori Anda, lalu pilih repositori `keuangan-cerdas`.
5. Pada bagian **Site configuration**:
   - **Branch to deploy**: `main`
   - **Base directory**: (kosongkan)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. File `netlify.toml` yang sudah tersedia di proyek ini akan otomatis mengatur seluruh konfigurasi pengalihan SPA (*Single Page Application*).
7. Klik tombol **"Deploy Keuangan Cerdas"**.
8. Dalam waktu kurang dari 1 menit, website Anda sudah aktif di URL publik Netlify, contohnya:
   `https://keuangan-cerdas-xxx.netlify.app`

---

## 4. Konfigurasi Google OAuth & Authorized Domains (WAJIB)

Agar fitur **Koneksi Gmail API & Google Sign-In** dapat berfungsi pada domain baru Anda (di Vercel atau Netlify) tanpa kendala `auth/unauthorized-domain`, Anda perlu menambahkan domain Anda ke daftar domain resmi Firebase.

### Langkah-langkah:
1. Buka [Firebase Console](https://console.firebase.google.com/).
2. Masuk menggunakan akun Google Anda dan pilih project: **`gen-lang-client-0750668339`** (atau ID project Firebase Anda).
3. Di menu sebelah kiri, klik **Build** -> **Authentication**.
4. Pilih tab **Settings** (di sebelah tab Users).
5. Gulir ke bagian **Authorized domains** (Domain resmi).
6. Klik tombol **Add domain**.
7. Masukkan domain baru Anda **tanpa** awalan `https://` dan tanpa garis miring di akhir.
   - Contoh untuk Vercel: `keuangan-cerdas.vercel.app`
   - Contoh untuk Netlify: `keuangan-cerdas.netlify.app`
8. Klik **Add**.
9. Selesai! Sekarang pengguna dapat langsung melakukan login Google dan sinkronisasi notifikasi email bank di situs produksi Anda.

---

## 5. Menghubungkan Custom Domain Sendiri (Opsional)

Jika Anda ingin menggunakan domain Anda sendiri (misalnya `keuangan.tokoanda.com` atau `keuangancerdas.id`):

### Di Vercel:
1. Buka Project Anda di dashboard Vercel.
2. Masuk ke tab **Settings** -> **Domains**.
3. Masukkan nama domain Anda lalu klik **Add**.
4. Ikuti instruksi DNS yang diberikan Vercel (buat CNAME Record ke `cname.vercel-dns.com` di panel domain Anda).
5. Sertifikat SSL HTTPS otomatis diterbitkan gratis oleh Vercel.
6. Daftarkan custom domain tersebut di **Firebase Authorized domains** (seperti Langkah 4 di atas).

### Di Netlify:
1. Masuk ke tab **Site configuration** -> **Domain management**.
2. Klik **Add a domain**.
3. Masukkan nama domain Anda dan ikuti panduan konfigurasi DNS Netlify.
4. Daftarkan domain tersebut di **Firebase Authorized domains**.

---

## 6. Troubleshooting & Solusi Error

| Masalah / Error | Penyebab | Solusi |
|---|---|---|
| **Halaman 404 saat di-refresh pada sub-menu** | Server belum mengarahkan rute SPA ke `index.html`. | File `vercel.json` dan `netlify.toml` sudah disediakan di repo ini untuk mengatasi hal tersebut secara otomatis. |
| **`auth/unauthorized-domain` saat klik masuk Google** | Domain produksi Vercel/Netlify belum didaftarkan di Firebase. | Ikuti [Langkah 4](#4-konfigurasi-google-oauth--authorized-domains-wajib) di atas untuk menambahkan domain Anda ke Authorized Domains Firebase. |
| **Build error saat `npm run build`** | Versi Node.js di cloud terlalu rendah. | Di dashboard Vercel/Netlify, pastikan Node.js Version disetel ke versi 18.x atau 20.x (LTS). |
| **Perubahan kode tidak muncul** | Cache browser atau belum di-push. | Lakukan `git push origin main`, Vercel dan Netlify akan otomatis mendeteksi pembaruan dan mem-build ulang dalam hitungan detik. |

---

*Dokumen ini disusun untuk sistem KEUANGAN CERDAS - Automatic Bank Transaction, Financial Journal & Reporting System.*
