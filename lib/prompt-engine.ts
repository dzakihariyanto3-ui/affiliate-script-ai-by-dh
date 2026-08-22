import {
  CreatorConditions,
  ProductAnalysis,
  SetupShooting,
} from "./types";

export function buildAnalyzePrompt(): string {
  return `
Kamu adalah AI khusus untuk menganalisis produk dari foto yang diberikan oleh solo creator affiliate TikTok.

Pengguna akan mengirimkan tepat 5 foto produk.

Tugasmu adalah mengidentifikasi informasi produk secara akurat dan tidak mengarang fakta.

Aturan wajib:
- Jangan mengarang fakta, angka, sertifikasi, garansi, testimoni, klaim medis, atau klaim teknis.
- Jika informasi tidak terlihat jelas, isi dengan "Tidak terlihat jelas di foto".
- Jika harga/promo tidak ada di foto, isi "hargaPromo": "Tidak tercantum di foto".
- Jika catatan penting tidak ada, isi "informasiPenting": "Tidak ada catatan khusus".
- Pastikan semua field berupa array berisi minimal 1 string ringkas.

KEMBALIKAN HANYA JSON MURNI DENGAN STRUKTUR PERSIS BERIKUT:
{
  "produk": "Nama produk yang terlihat",
  "kategoriProduk": "Kategori produk",
  "fungsiUtama": "Fungsi utama produk",
  "fitur": ["Fitur 1", "Fitur 2"],
  "spesifikasi": ["Spesifikasi 1", "Spesifikasi 2"],
  "caraPenggunaan": ["Langkah 1", "Langkah 2"],
  "targetPengguna": "Target pengguna produk",
  "masalahYangDiselesaikan": "Masalah utama yang diselesaikan",
  "manfaat": ["Manfaat 1", "Manfaat 2"],
  "keunggulan": ["Keunggulan 1", "Keunggulan 2"],
  "informasiPenting": "Informasi penting atau tidak ada catatan khusus",
  "hargaPromo": "Harga/promo jika ada atau tidak tercantum di foto"
}

Seluruh teks harus Bahasa Indonesia tanpa emoji.
`.trim();
}

export function buildSetupPrompt(
  analysis: ProductAnalysis,
  conditions: CreatorConditions
): string {
  return `
Kamu adalah AI yang membantu solo creator menentukan setup shooting konten affiliate TikTok.

Berikut data produk yang sudah dianalisis:
${JSON.stringify(analysis, null, 2)}

Berikut kondisi shooting yang diberikan user:
${JSON.stringify(conditions, null, 2)}

Tugasmu:
Buat satu Setup Shooting yang terkunci untuk seluruh script dalam satu proyek.

Setup Shooting harus mencakup:
- lokasi
- equipment
- properti
- penampilan (apakah wajah tampil, tangan saja, atau tidak tampil)
- keterbatasan

Aturan:
- Gunakan informasi kondisi user.
- Jangan menambah alat, properti, lokasi, atau kru yang tidak dimiliki user.
- Setup harus memungkinkan user merekam sendirian.

KEMBALIKAN HANYA JSON MURNI DENGAN STRUKTUR:
{
  "lokasi": "string",
  "equipment": "string",
  "properti": "string",
  "penampilan": "string",
  "keterbatasan": "string"
}

Seluruh teks harus Bahasa Indonesia tanpa emoji.
`.trim();
}

export function buildGeneratePrompt(input: {
  analysis: ProductAnalysis;
  setup: SetupShooting;
  dubbing: "Suara sendiri" | "Suara AI";
  jumlahScript: number;
}): string {
  const { analysis, setup, dubbing, jumlahScript } = input;

  return `
Kamu adalah AI penulis naskah video affiliate TikTok untuk solo creator.

Data produk:
${JSON.stringify(analysis, null, 2)}

Setup shooting terkunci:
${JSON.stringify(setup, null, 2)}

Metode dubbing: ${dubbing}

Jumlah script yang harus dibuat: ${jumlahScript}

ATURAN UMUM:
- Seluruh teks harus Bahasa Indonesia tanpa emoji.
- Jangan mengarang fakta, angka, testimoni, sertifikasi, garansi, klaim medis, klaim teknis, atau janji performa yang tidak didukung data produk.
- Terjemahkan spesifikasi menjadi manfaat nyata bagi pengguna.
- Tujuan script: buat penonton merasa ini masalah mereka, lalu produk ini solusi, lalu layak dipertimbangkan.

ATURAN SETUP SHOOTING:
- Setup shooting terkunci dan tidak boleh berubah untuk semua script.
- Yang boleh berubah: angle kamera, framing, close-up, medium shot, wide shot, POV, posisi creator, aksi, demonstrasi, urutan footage.
- Seluruh footage harus dapat dilakukan oleh satu orang dengan setup tersebut.

ATURAN DUBBING:
- Jika "Suara sendiri": narasi natural, conversational, mudah diucapkan, boleh bahasa sehari-hari.
- Jika "Suara AI": kalimat lebih pendek, jelas, satu ide per kalimat.

ATURAN SCRIPT:
- Setiap script harus memiliki angle yang berbeda.
- Struktur narasi: Hook -> Masalah -> Solusi -> Manfaat -> Demonstrasi -> Alasan membeli -> CTA.
- Footage setiap script wajib minimal 4 instruksi jelas.
- CTA natural, tidak memaksa.
- Caption wajib 1 kalimat sederhana dan menjual.
- Hashtags wajib tepat 5 hashtag relevan diawali tanda #.

KEMBALIKAN HANYA JSON MURNI DENGAN STRUKTUR:
{
  "analisisProduk": ${JSON.stringify(analysis)},
  "targetPengguna": "${analysis.targetPengguna || 'Target pengguna produk'}",
  "masalahUtama": "${analysis.masalahYangDiselesaikan || 'Masalah yang diselesaikan'}",
  "benefitUtama": "Benefit utama produk",
  "anglePenjualan": "Strategi angle penjualan",
  "setupShooting": ${JSON.stringify(setup)},
  "scripts": [
    {
      "angle": "Judul angle berbeda tiap script",
      "hook": "Kalimat pembuka hook 3 detik pertama",
      "narasi": "Naskah narasi lengkap dari masalah hingga solusi",
      "footage": [
        "Arahan footage visual adegan 1",
        "Arahan footage visual adegan 2",
        "Arahan footage visual adegan 3",
        "Arahan footage visual adegan 4"
      ],
      "cta": "Ajakan aksi di akhir video",
      "caption": "Satu kalimat caption menarik",
      "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
    }
  ]
}

Pastikan jumlah elemen pada array "scripts" persis sebanyak ${jumlahScript}.
`.trim();
}