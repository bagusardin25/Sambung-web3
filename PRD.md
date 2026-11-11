# PRD — Sambung

**Cerita berantai on-chain di BOT Chain.**
Versi 1.1 · 11 November 2026 · Project 1 dari 5 (BOT Chain Ecosystem Support Program)

**Status: M2 selesai (55%).** Contract dan test selesai, UI lengkap dan alur penuh sudah diuji di chain lokal. Berikutnya: testnet.

---

## 1. Ringkasan

Sambung adalah DApp tempat banyak wallet menulis satu cerita bersama, satu kalimat per giliran. Seseorang membuka cerita dengan judul dan kalimat pembuka; wallet lain menyambungnya. Tidak ada yang boleh menulis dua kali berturut-turut, dan satu wallet hanya boleh mengisi sepertiga cerita, sehingga setiap cerita yang selesai pasti ditulis minimal tiga orang. Saat kalimat terakhir masuk, cerita tersegel permanen di BOT Chain dan pindah ke Perpustakaan, tempat pembaca bisa memberi tepuk tangan.

Nama "Sambung" berarti *menyambung*. Identitas visualnya memakai idiom **benang merah**: setiap kalimat adalah simpul pada satu benang merah yang menghubungkan para penulis.

| | |
|---|---|
| Kategori | Social |
| Jaringan | BOT Chain Mainnet (chain ID 677) |
| Bentuk | Satu smart contract + satu web app |
| Token | Tidak ada. Tidak ada biaya selain gas |
| Bahasa UI | Inggris (verifikator internasional); nama dan motif Indonesia |

## 2. Latar belakang dan tujuan

### Masalah
Direktori BOT Chain sudah berisi 1.195 project, dan sebagian besar DApp kecil di sana bersifat satu arah: satu wallet menulis catatan, check-in, atau pesan untuk dirinya sendiri. Hampir tidak ada yang *membutuhkan* orang lain agar berfungsi, sehingga tidak ada alasan mengajak teman.

### Tujuan produk
1. Memberi pengalaman kolaboratif yang baru terasa lengkap kalau dipakai beberapa wallet.
2. Menghasilkan artefak yang layak dibagikan: cerita selesai dengan daftar penulisnya, permanen dan bisa diverifikasi di explorer.
3. Memenuhi seluruh kriteria eligibility program tanpa aktivitas buatan.

### Bukan tujuan (v1)
- Tidak ada token, NFT, hadiah, atau taruhan.
- Tidak ada cerita privat atau terenkripsi; semua teks publik.
- Tidak ada edit atau hapus kalimat.
- Tidak ada backend, database, atau indexer.
- Tidak ada AI penulis.

## 3. Pengguna sasaran

| Persona | Kebutuhan | Yang didapat |
|---|---|---|
| **Pembuka cerita** | Punya ide premis, ingin lihat dibawa ke mana oleh orang lain | Membuka cerita dalam satu transaksi dan membagikan tautannya |
| **Penyambung** | Ingin ikut tanpa komitmen panjang | Menulis satu kalimat, selesai dalam satu transaksi |
| **Pembaca** | Ingin membaca cerita jadi | Perpustakaan cerita tersegel, bisa diurutkan dan diberi tepuk tangan |
| **Komunitas kecil** (kelas, grup Telegram, tim) | Aktivitas bersama yang ringan | Satu cerita pendek selesai oleh 3 orang dalam beberapa menit |

Pembaca tidak perlu wallet. Wallet baru diminta saat menulis atau bertepuk tangan.

## 4. Pemetaan ke kriteria program

| Kriteria | Cara dipenuhi |
|---|---|
| Akun X aktif, 5 post | Akun X khusus Sambung. Draft post disiapkan di tahap akhir. **Dikerjakan olehmu.** |
| Pengumuman mainnet | Post dengan kalimat wajib "Officially launched on BOT Chain Mainnet." |
| BOT Chain di website | Footer menampilkan nama BOT Chain dengan tautan ke `https://botchain.ai` dan `https://scan.botchain.ai` |
| Produk usable | Frontend lengkap, connect wallet, fungsi inti berjalan |
| Independen dan orisinal | Tidak ada cerita kolaboratif di direktori; contract, desain, dan copy ditulis dari nol |
| 3 wallet, 5 transaksi | Cerita terpendek butuh 6 transaksi dari minimal 3 wallet — terpenuhi oleh satu cerita yang selesai |
| Deployment + verification | Contract di-deploy ke mainnet dan source-nya diverifikasi di scan.botchain.ai |

## 5. Lingkup fitur

### 5.1 Masuk v1

**F1 — Membuka cerita.**
Isian: judul (3–64 byte), genre, panjang cerita, kalimat pembuka. Kalimat pembuka dihitung sebagai kalimat pertama milik pembuka.

| Panjang | Jumlah kalimat | Kuota per wallet |
|---|---|---|
| Short | 6 | 2 |
| Classic | 12 | 4 |
| Long | 18 | 6 |

Genre: Open, Mystery, Romance, Comedy, Horror, Sci-Fi, Folklore.

**F2 — Menyambung cerita.**
Satu kalimat, 1–280 byte. Dua aturan ditegakkan oleh contract:
- *Aturan giliran*: penulis kalimat terakhir tidak boleh menulis kalimat berikutnya.
- *Aturan kuota*: satu wallet maksimal menulis sepertiga dari panjang cerita.

**F3 — Segel otomatis.**
Begitu kalimat terakhir masuk, cerita tersegel. Tidak ada lagi yang bisa menulis di cerita itu.

**F4 — Tepuk tangan.**
Satu wallet bisa memberi satu tepuk tangan per cerita tersegel. Penulis cerita itu tidak bisa bertepuk tangan untuk ceritanya sendiri.

**F5 — Nama pena.**
Wallet bisa memasang nama pena (maksimal 32 byte) yang tampil di samping kalimatnya. Tanpa nama pena, yang tampil adalah alamat yang dipendekkan.

**F6 — Perpustakaan.**
Daftar cerita tersegel, bisa diurutkan menurut terbaru atau tepuk tangan terbanyak, dan disaring per genre.

**F7 — Meja saya.**
Halaman pribadi: nama pena, jumlah kalimat yang ditulis, jumlah cerita yang dibuka, dan daftar cerita yang pernah diikuti.

**F8 — Moderasi ringan.**
Pemilik contract bisa menandai cerita sebagai tersembunyi. Frontend tidak menampilkan cerita tersembunyi; datanya tetap ada di chain. Ini jaring pengaman untuk konten yang melanggar, karena situs ini akan ditautkan dari kanal resmi.

**F9 — Statistik langsung.**
Jumlah cerita, cerita tersegel, total kalimat, dan jumlah penulis unik, dibaca langsung dari contract.

### 5.2 Tidak masuk v1 (kandidat v2)
- Toggle bahasa Indonesia/Inggris.
- Kartu gambar cerita untuk dibagikan ke X.
- Penyegelan dini untuk cerita yang mangkrak.
- Mint cerita selesai sebagai NFT.

## 6. Alur pengguna

### 6.1 Membuka cerita
1. Buka situs → **Start a story**.
2. Kalau belum terhubung, pilih wallet. Kalau jaringan salah, situs menawarkan pindah atau menambah BOT Chain (677).
3. Isi judul, genre, panjang, kalimat pembuka. Penghitung byte tampil langsung.
4. Konfirmasi di wallet → menunggu → masuk ke halaman cerita baru.
5. Salin tautan cerita untuk dibagikan.

### 6.2 Menyambung
1. Buka tautan cerita atau pilih dari daftar **Being written**.
2. Baca kalimat yang sudah ada. Indikator menunjukkan posisi, misalnya "7 dari 12".
3. Kotak tulis menampilkan status giliran:
   - boleh menulis;
   - "kamu menulis kalimat terakhir, tunggu orang lain";
   - "kuotamu di cerita ini habis";
   - cerita sudah tersegel.
4. Tulis, kirim, konfirmasi. Kalimat baru muncul sebagai simpul berikutnya di benang.
5. Kalau itu kalimat terakhir, halaman berubah menjadi tampilan cerita tersegel.

### 6.3 Membaca dan bertepuk tangan
1. Buka **Library**, pilih cerita.
2. Baca tanpa wallet.
3. Tekan **Applaud** → hubungkan wallet bila perlu → konfirmasi.

### 6.4 Keadaan yang ditangani
Tanpa wallet terpasang · jaringan salah · transaksi ditolak pengguna · transaksi gagal di chain · RPC lambat atau gagal · daftar kosong · cerita tidak ditemukan · cerita tersembunyi · saldo BOT tidak cukup untuk gas.

## 7. Halaman dan layar

| Rute | Isi |
|---|---|
| `#/` Beranda | Hero dengan potongan cerita yang sedang ditulis, cara kerja tiga langkah, statistik langsung, daftar cerita terbuka, CTA |
| `#/story/:id` Cerita | Judul, genre, progres, benang kalimat dengan penulisnya, kotak tulis atau panel tersegel, daftar penulis, tautan bagikan |
| `#/new` Buka cerita | Form empat isian dengan pratinjau |
| `#/library` Perpustakaan | Cerita tersegel, urut dan saring |
| `#/desk` Meja saya | Nama pena, statistik pribadi, cerita yang diikuti |
| Footer (semua halaman) | "Built on BOT Chain" dengan tautan wajib, alamat contract ke explorer, akun X |

## 8. Arah desain

- **Tiga atribut:** literer, hangat, tenang.
- **Motif:** benang merah vertikal dengan simpul di tiap kalimat. Benang ini adalah satu-satunya elemen berwarna kuat di halaman.
- **Tipografi:** serif untuk teks cerita dan judul, sans untuk kontrol, mono untuk alamat dan angka.
- **Warna:** kertas krem, tinta gelap, merah benang sebagai aksen tunggal.
- **Kepadatan:** rendah. Halaman cerita adalah halaman baca, bukan dashboard.
- **Gerak:** benang "ditarik" saat kalimat baru masuk; dimatikan bila pengguna memilih reduced motion.
- **Yang dihindari:** gradien neon, glassmorphism, kartu serba-bulat, emoji sebagai ikon — tampilan generik DApp.

Target viewport: 375 px sampai 1440 px. Kontras teks minimal WCAG AA. Semua aksi bisa dijalankan dengan keyboard.

## 9. Spesifikasi smart contract

**Contract:** `Sambung.sol` · Solidity 0.8.24 · EVM target `paris` · tanpa dependensi eksternal · tanpa fungsi payable.

### 9.1 Fungsi tulis

| Fungsi | Aturan |
|---|---|
| `startStory(title, genre, maxLines, openingLine)` | Judul 3–64 byte; genre 0–6; `maxLines` 6, 12, atau 18; kalimat 1–280 byte |
| `addLine(storyId, text)` | Cerita ada dan belum tersegel; bukan penulis terakhir; kuota belum habis; 1–280 byte. Menyegel bila kalimat terakhir |
| `applaud(storyId)` | Cerita tersegel; belum pernah bertepuk; bukan penulis cerita itu |
| `setPenName(name)` | 0–32 byte; kosong berarti menghapus |
| `setHidden(storyId, hidden)` | Hanya pemilik |
| `transferOwnership(newOwner)` | Hanya pemilik |

### 9.2 Fungsi baca

Publik RPC mainnet mematikan `eth_getLogs`, jadi seluruh data dibaca lewat fungsi view, bukan event.

`storyCount` · `getStory(id)` · `getStories(cursor, limit)` · `getStoriesByIds(ids[])` · `getLines(id)` · `writeStatus(id, wallet)` · `linesBy(id, wallet)` · `linesByMany(ids[], wallet)` · `hasApplauded(id, wallet)` · `profileOf(wallet)` · `getPenNames(wallets[])` · `storiesOf(wallet)` · `stats()`

### 9.3 Event
`StoryStarted` · `LineAdded` · `StorySealed` · `Applauded` · `PenNameSet` · `StoryHiddenSet` · `OwnershipTransferred` — untuk keterbacaan di explorer.

### 9.4 Keamanan
- Tidak ada dana yang disimpan atau dipindahkan, sehingga tidak ada risiko reentrancy atau kehilangan dana.
- Pemilik hanya bisa menyembunyikan cerita; tidak bisa mengubah atau menghapus teks.
- Panjang semua string dibatasi di contract agar biaya gas terprediksi.
- Custom error untuk setiap penolakan, supaya frontend bisa menampilkan pesan yang tepat.

### 9.5 Biaya terukur (gas 20 gwei, BOT ≈ $12,6)

Diukur dari test suite dengan kalimat 140 byte.

| Aksi | Gas | BOT | ± USD |
|---|---|---|---|
| Deploy contract | 2.147.544 | 0,043 | $0,54 |
| Membuka cerita | 435.189 | 0,0087 | $0,11 |
| Menyambung satu kalimat | 297.689 | 0,0060 | $0,075 |
| Tepuk tangan | 77.843 | 0,0016 | $0,02 |

Satu cerita Short dari awal sampai tersegel menghabiskan sekitar 0,039 BOT (± $0,49) dibagi di antara para penulisnya.

## 10. Arsitektur teknis

```
sambung/
├── PRD.md
├── README.md
├── contracts/            Hardhat 2 + ethers + chai (JavaScript)
│   ├── contracts/Sambung.sol
│   ├── test/Sambung.test.js
│   ├── scripts/deploy.js, seed.js, export-abi.js
│   ├── hardhat.config.js
│   └── .env.example      (PRIVATE_KEY diisi olehmu, tidak pernah di-commit)
└── web/                  Vite + React + TypeScript + viem
    ├── index.html
    ├── public/
    └── src/
        ├── config/       chain, alamat contract, ABI
        ├── lib/          wallet (EIP-1193 + EIP-6963), client baca, format
        ├── components/
        ├── pages/
        └── styles/
```

- **Wallet:** deteksi EIP-6963 sehingga MetaMask, BO Wallet, dan wallet EVM lain muncul sebagai pilihan. Tanpa WalletConnect, jadi tidak perlu project ID.
- **Baca data:** langsung ke `https://rpc.botchain.ai` (CORS terbuka, sudah dicek).
- **Routing:** hash router, tanpa konfigurasi rewrite di Vercel.
- **Hosting:** Vercel, root directory `web`.
- **Konfigurasi jaringan:** `VITE_CHAIN` = `local` | `testnet` | `mainnet`; alamat contract per jaringan di satu file.
- **Wallet dev:** hanya di mode development pada chain lokal, untuk menguji alur tulis tanpa ekstensi. Tidak menyimpan private key (node Hardhat yang menandatangani) dan tidak ikut ke build produksi.

## 11. Kebutuhan non-fungsional

| Aspek | Target |
|---|---|
| Performa | Halaman beranda tampil tanpa menunggu RPC; data mengisi setelahnya |
| Ketahanan | Kegagalan RPC menampilkan pesan dan tombol coba lagi, bukan halaman kosong |
| Aksesibilitas | Navigasi keyboard, fokus terlihat, label form, kontras AA, reduced motion |
| Keamanan frontend | Teks dari chain selalu dirender sebagai teks, tidak pernah sebagai HTML |
| SEO dan berbagi | Judul, deskripsi, dan gambar Open Graph |

## 12. Tahapan dan progres

| Tahap | Isi | Progres |
|---|---|---|
| M0 | PRD — selesai | 5% |
| M1 | Smart contract + 36 test lulus — selesai | 25% |
| M2 | **UI/UX lengkap, alur penuh berjalan di chain lokal — selesai** | **55%** |
| M3 | Deploy testnet (968) + uji dengan wallet sungguhan | 70% |
| M4 | Deploy mainnet (677) + verifikasi source | 85% |
| M5 | Vercel produksi, pengumuman X, aktivitas on-chain, audit checklist | 100% |

**Titik lapor:** di akhir M2 saya berhenti dan memberi tahu kamu, supaya kamu bisa menyiapkan repo dan menghubungkannya.

## 13. Pembagian kerja

| Saya | Kamu |
|---|---|
| PRD, contract, test, frontend, script deploy | Membuat group project **sebelum** deploy mainnet |
| Uji lokal dan panduan uji testnet | Setup repo dan menghubungkan ke Vercel |
| Draft post X dan teks pengumuman | Membuat akun X dan mempublikasikan post |
| Panduan verifikasi contract | Menjalankan deploy dengan private key-mu sendiri |
| Audit checklist eligibility | Mengisi BOT untuk gas; mengajak 2–3 tester |

## 14. Risiko

| Risiko | Mitigasi |
|---|---|
| Konten tidak pantas tersimpan permanen | Flag tersembunyi oleh pemilik; peringatan "teks bersifat publik dan permanen" di form |
| Cerita mangkrak karena kurang penulis | Panjang Short (6 kalimat); tautan bagikan di setiap cerita; beranda menonjolkan cerita yang hampir selesai |
| Verifikator menilai mirip project lain | Mekanik giliran dan kuota tidak ada di direktori; desain dan copy khas |
| Aktivitas dari wallet sendiri tidak dihitung | Ajak tester sungguhan dengan wallet yang didanai terpisah |
| RPC publik lambat | Data dibaca per halaman, bukan sekaligus; ada keadaan memuat dan coba lagi |
| Metode verifikasi di scan.botchain.ai belum dipastikan | Dicek di M3 pada testnet; cadangan berupa unggah source manual |

## 15. Kriteria terima

1. Tiga wallet berbeda bisa menyelesaikan satu cerita Short dari awal sampai tersegel.
2. Contract menolak: menulis dua kali berturut-turut, melebihi kuota, menulis di cerita tersegel, tepuk tangan ganda, tepuk tangan oleh penulis sendiri.
3. Semua test contract lulus.
4. Halaman cerita terbaca nyaman di 375 px dan 1440 px tanpa scroll horizontal.
5. Pembaca tanpa wallet bisa membuka beranda, cerita, dan perpustakaan.
6. Footer memuat nama BOT Chain dan kedua tautan wajib.
7. Contract terverifikasi di scan.botchain.ai dan alamatnya tampil di situs.

## 16. Hal yang masih terbuka

- Nama akun X dan domain (saat ini direncanakan subdomain Vercel).
- Apakah UI perlu versi bahasa Indonesia di v1.
- Kriteria ketujuh program, yang belum tercantum di materi.
