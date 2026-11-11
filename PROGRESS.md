# Progres — Sambung

Catatan status project agar bisa dilanjutkan kapan saja tanpa membaca ulang percakapan.
Terakhir diperbarui: **11 November 2026**.

## Status sekarang

**Milestone M2 selesai — 55%.** Contract dan UI lengkap, alur penuh teruji di chain lokal. Belum ada yang di-deploy ke jaringan publik.

Pekerjaan dijeda di sini karena langkah berikutnya menunggu repo dan wallet deployer dari pemilik project.

| Tahap | Isi | Progres | Status |
|---|---|---|---|
| M0 | PRD | 5% | Selesai |
| M1 | Smart contract + test | 25% | Selesai |
| M2 | UI/UX lengkap, alur penuh di chain lokal | 55% | Selesai |
| M3 | Deploy testnet (968) + uji wallet sungguhan | 70% | **Berikutnya** |
| M4 | Deploy mainnet (677) + verifikasi source | 85% | Belum |
| M5 | Vercel produksi, pengumuman X, aktivitas on-chain, audit checklist | 100% | Belum |

## Yang sudah jadi

### Dokumen
- [PRD.md](PRD.md) versi 1.1 — scope, fitur, alur, spesifikasi contract, tahapan.
- [README.md](README.md) — cara menjalankan, deploy, setting Vercel, dan 9 screenshot (desktop, 768 px, 375 px) di `docs/screenshots/`.

### Smart contract (`contracts/`)
- `contracts/Sambung.sol` — Solidity 0.8.24, target EVM `paris`, optimizer 200 runs, tanpa dependensi, tanpa fungsi payable.
- `test/Sambung.test.js` — **36 test lulus**.
- `scripts/deploy.js` — deploy ke jaringan mana pun, lalu menulis alamat ke `deployments/<network>.json` dan `web/src/config/deployments.json`.
- `scripts/seed.js` — mengisi cerita contoh; hanya mau jalan di chain lokal.
- `scripts/export-abi.js` — menulis ABI ke `web/src/config/abi.ts`.
- `hardhat.config.js` — jaringan `localhost`, `botchainTestnet` (968), `botchain` (677).

Aturan yang ditegakkan contract: tidak boleh menulis dua kali berturut-turut, kuota sepertiga per wallet, segel otomatis di kalimat terakhir, satu tepuk tangan per wallet, penulis tidak bisa bertepuk untuk ceritanya sendiri, pemilik hanya bisa menyembunyikan cerita.

### Frontend (`web/`)
Vite + React + TypeScript + viem. Lima halaman dan satu dialog:

| Rute | Halaman | File |
|---|---|---|
| `#/` | Beranda | `src/pages/Home.tsx` |
| `#/story/:id` | Cerita (baca, tulis, segel, tepuk tangan) | `src/pages/StoryPage.tsx` |
| `#/new` | Buka cerita | `src/pages/NewStory.tsx` |
| `#/library` | Perpustakaan | `src/pages/Library.tsx` |
| `#/desk` | Meja saya | `src/pages/Desk.tsx` |
| — | Dialog wallet | `src/components/WalletDialog.tsx` |

- Footer memuat "Built on BOT Chain" dengan tautan `https://botchain.ai` dan `https://scan.botchain.ai`, plus alamat contract.
- Wallet: deteksi EIP-6963 dengan cadangan `window.ethereum`; menawarkan pindah atau menambah jaringan BOT Chain.
- Data dibaca lewat fungsi view, bukan event, karena RPC mainnet mematikan `eth_getLogs`.
- Jaringan aktif diatur `VITE_CHAIN`; default `local` saat `npm run dev` dan `mainnet` saat `npm run build`.

## Yang sudah diverifikasi

Semua dijalankan pada 11 November 2026.

| Pemeriksaan | Hasil |
|---|---|
| `npm test` di `contracts/` | 36 lulus |
| `npm run typecheck` di `web/` | Lulus |
| `npm run build` di `web/` | Lulus |
| Buka cerita baru lewat UI | Berhasil, diarahkan ke halaman cerita |
| Tulis kalimat terakhir | Berhasil, cerita tersegel |
| Tepuk tangan dari wallet lain | Berhasil, hitungan naik |
| Simpan nama pena | Berhasil, tampil di header |
| Validasi form judul kosong | Pesan error muncul |
| Dialog tanpa wallet terpasang | Menampilkan petunjuk pasang wallet |
| Keyboard: Tab, Escape, fokus kembali | Berfungsi, cincin fokus terlihat |
| Viewport 375 px, 768 px, desktop | Tanpa scroll horizontal |
| Build produksi tanpa alamat mainnet | Menampilkan pemberitahuan "belum di-deploy" |
| Kode wallet dev di bundle produksi | Tidak ada |
| Kontras warna | 22 pasangan lulus WCAG AA |

### Biaya gas terukur (20 gwei)

| Aksi | Gas | BOT |
|---|---|---|
| Deploy | 2.147.544 | 0,043 |
| Buka cerita | 435.189 | 0,0087 |
| Tambah kalimat | 297.689 | 0,0060 |
| Tepuk tangan | 77.843 | 0,0016 |

## Yang belum dikerjakan

### M3 — Testnet
- [ ] **Kamu:** setup repo git dari folder `sambung/` dan hubungkan ke Vercel (Root Directory `web`).
- [ ] **Kamu:** siapkan wallet deployer, ambil BOT testnet di `https://faucet.botchain.ai/basic`.
- [ ] **Kamu:** salin `contracts/.env.example` menjadi `.env`, isi `PRIVATE_KEY`.
- [ ] **Kamu:** jalankan `npm run deploy:testnet` di `contracts/`.
- [ ] **Saya:** uji dengan MetaMask atau BO Wallet sungguhan di testnet (`VITE_CHAIN=testnet`).
- [ ] **Saya:** cari tahu cara verifikasi source di explorer BOT Chain, lalu lengkapi konfigurasi `hardhat-verify` atau siapkan unggah manual.

### M4 — Mainnet
- [ ] **Kamu:** buat group project. **Wajib sebelum deploy mainnet.**
- [ ] **Kamu:** isi BOT mainnet (± 0,05 BOT cukup untuk deploy) lewat B DEX atau bridge.
- [ ] **Kamu:** jalankan `npm run deploy:mainnet`, lalu commit `deployments/botchain.json` dan `web/src/config/deployments.json`.
- [ ] **Saya:** verifikasi source contract di `scan.botchain.ai`.

### M5 — Peluncuran
- [ ] **Kamu:** buat akun X Sambung; isi URL-nya di `web/src/config/site.ts` (`xUrl`).
- [ ] **Saya:** draft minimal 5 post, termasuk pengumuman dengan kalimat "Officially launched on BOT Chain Mainnet."
- [ ] **Kamu:** publikasikan post.
- [ ] **Kamu:** ajak 2–3 tester dengan wallet sendiri untuk menyelesaikan satu cerita Short (memenuhi 3 wallet dan 5 transaksi).
- [ ] **Saya:** gambar Open Graph untuk pratinjau tautan.
- [ ] **Saya:** audit akhir terhadap checklist eligibility di dokumen program.

## Hal yang diketahui dan belum ditangani

- **Wallet sungguhan belum diuji.** Alur tulis sejauh ini diuji lewat akun node Hardhat, bukan ekstensi wallet.
- **Linter menyisakan 3 peringatan**, tanpa error (`set-state-in-effect` dua kali, `only-export-components` sekali).
- **Bundle JS 585 kB (176 kB gzip)**, sebagian besar dari viem. Belum dipecah.
- **Daftar cerita memuat maksimal 200 cerita terbaru.** Cukup untuk awal; perlu paginasi bila tumbuh.
- **Cerita mangkrak tidak bisa disegel dini.** Dicatat sebagai kandidat v2 di PRD.
- **Statistik beranda ikut menghitung cerita yang disembunyikan.**
- **Kriteria ketujuh program** belum tercantum di materi.

## Keputusan yang sudah diambil

| Keputusan | Alasan |
|---|---|
| Project contract memakai JavaScript, bukan TypeScript | Menghindari ketergantungan ts-node pada TypeScript 7 |
| Hash routing (`#/story/3`) | Tidak perlu konfigurasi rewrite di Vercel |
| Tanpa WalletConnect | Tidak perlu project ID; EIP-6963 sudah mencakup MetaMask dan BO Wallet |
| Font di-host sendiri (`@fontsource`) | Tanpa permintaan ke pihak ketiga |
| UI berbahasa Inggris | Verifikator program internasional |
| Target EVM `paris` | Bytecode aman di versi node BOT Chain mana pun |
| Wallet dev tanpa private key | Node Hardhat yang menandatangani; tidak ikut build produksi |
| Deploy dijalankan pemilik project | Private key tidak pernah keluar dari mesin pemilik |

## Cara melanjutkan

Chain lokal tidak menyimpan data: setiap kali node dihentikan, deploy dan seed harus diulang.

```bash
cd contracts
npx hardhat node
```

```bash
cd contracts
npm run deploy:local
npm run seed:local
```

```bash
cd web
npm run dev
```

Buka `http://localhost:5173`, klik **Connect wallet**, pilih salah satu "Dev wallet".

Kalau contract diubah, jalankan `npm run export-abi` di `contracts/` supaya frontend memakai ABI terbaru.

## Informasi jaringan

| | Mainnet | Testnet |
|---|---|---|
| Chain ID | 677 | 968 |
| RPC | `https://rpc.botchain.ai` | `https://rpc.bohr.life` |
| Explorer | `https://scan.botchain.ai` | `https://scan.bohr.life` |

Alamat contract: belum ada di testnet maupun mainnet.
