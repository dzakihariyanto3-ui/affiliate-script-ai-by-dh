import {
  CreatorConditions,
  ProductAnalysis,
  SetupShooting,
} from "./types";

export function buildAnalyzePrompt(): string {
  return `
Kamu adalah AI expert product researcher & content strategist khusus untuk creator affiliate TikTok di Indonesia.

Pengguna akan mengirimkan tepat 5 foto produk.

TUGAS UTAMA:
Analisis dan identifikasi seluruh informasi produk secara faktual, tajam, dan akurat berdasarkan tampilan visual dan teks pada 5 foto yang diberikan.

PRINSIP ANALISIS & KONVERSI BENEFIT:
1. JANGAN MENGARANG FAKTA: Dilarang mengarang spesifikasi, angka, durasi, harga, penghematan, performa, sertifikasi, garansi, testimoni, klaim medis, klaim teknis, atau perbandingan yang tidak tertera pada foto/data produk. Dilarang membuat klaim absolut yang tidak didukung data produk. Lebih baik klaim sederhana yang benar daripada klaim menarik tetapi tidak dapat dibuktikan.
2. KETEPATAN MASALAH & SEBAB-AKIBAT: Jangan mengubah masalah produk menjadi masalah lain. Pastikan masalah, fitur, dan manfaat tetap murni sesuai produk. Setiap benefit harus memiliki hubungan sebab-akibat yang jelas dan logis dengan fitur visual atau cara penggunaan produk.
3. IDENTIFIKASI TARGET & MASALAH: Tentukan siapa pembeli yang paling membutuhkan produk ini dan apa rasa repot / rasa kesal / kebutuhan spesifik yang dapat dibantu oleh produk ini.
4. ATURAN FALLBACK DATA:
   - Jika informasi tertentu tidak terlihat jelas: isi dengan "Tidak terlihat jelas di foto".
   - Jika harga/promo tidak ada di foto: isi "hargaPromo": "Tidak tercantum di foto".
   - Jika catatan penting tidak ada: isi "informasiPenting": "Tidak ada catatan khusus".
5. Pastikan semua field array berisi minimal 1 string ringkas dan berbobot.

KEMBALIKAN HANYA JSON MURNI DENGAN STRUKTUR PERSIS BERIKUT:
{
  "produk": "Nama produk yang terlihat",
  "kategoriProduk": "Kategori produk",
  "fungsiUtama": "Fungsi utama produk",
  "fitur": ["Fitur 1", "Fitur 2"],
  "spesifikasi": ["Spesifikasi 1", "Spesifikasi 2"],
  "caraPenggunaan": ["Langkah 1", "Langkah 2"],
  "targetPengguna": "Target pengguna spesifik yang paling relevan",
  "masalahYangDiselesaikan": "Masalah nyata / rasa repot yang diselesaikan produk ini",
  "manfaat": ["Manfaat nyata 1 bagi pengguna", "Manfaat nyata 2 bagi pengguna"],
  "keunggulan": ["Keunggulan 1 dibanding cara lama", "Keunggulan 2"],
  "informasiPenting": "Informasi penting atau tidak ada catatan khusus",
  "hargaPromo": "Harga/promo jika ada atau tidak tercantum di foto"
}

Seluruh teks harus dalam Bahasa Indonesia natural tanpa emoji.
`.trim();
}

export function buildSetupPrompt(
  analysis: ProductAnalysis,
  conditions: CreatorConditions
): string {
  return `
Kamu adalah AI Creative Director & Konten Strategist untuk solo creator affiliate TikTok di Indonesia.

Berikut data produk yang sudah dianalisis:
${JSON.stringify(analysis, null, 2)}

Berikut kondisi shooting nyata yang dimiliki creator:
${JSON.stringify(conditions, null, 2)}

TUGAS UTAMA:
Rancang 1 (satu) Setup Shooting yang TERKUNCI untuk digunakan pada seluruh naskah script dalam proyek ini.

PRINSIP SETUP SHOOTING TERKUNCI (SOLO CREATOR):
1. REALISTIS 100% UNTUK 1 ORANG: Seluruh proses rekaman harus bisa dilakukan sendirian oleh satu orang tanpa kru, tanpa asisten, dan tanpa juru kamera tambahan.
2. TIDAK MENAMBAH ALAT/LOKASI: Gunakan hanya alat, lokasi, properti, dan kondisi penampilan yang dinyatakan tersedia oleh creator. Jangan meminta alat baru atau tempat baru.
3. KONSISTENSI VISUAL: Setup ini mengunci fondasi fisik (lokasi, alat utama, properti, gaya penampilan, dan batas keterbatasan) agar eksekusi produksi creator cepat, hemat waktu, dan terarah.

KEMBALIKAN HANYA JSON MURNI DENGAN STRUKTUR PERSIS BERIKUT:
{
  "lokasi": "Deskripsi lokasi shooting tetap yang dimiliki creator",
  "equipment": "Peralatan shooting utama yang dimiliki creator",
  "properti": "Properti/barang pendukung yang dimiliki creator",
  "penampilan": "Format penampilan (apakah wajah tampil, tangan saja, atau POV)",
  "keterbatasan": "Keterbatasan shooting yang harus dipatuhi"
}

Seluruh teks harus dalam Bahasa Indonesia natural tanpa emoji.
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
Kamu adalah Master Copywriter & Scriptwriter video pendek affiliate TikTok terbaik di Indonesia, spesialis membuat naskah video yang sangat natural, persuasif, enak didengar, dan menghasilkan konversi tinggi untuk solo creator.

DATA PRODUK FAKTUAL:
${JSON.stringify(analysis, null, 2)}

SETUP SHOOTING TERKUNCI (Wajib Dipatuhi):
${JSON.stringify(setup, null, 2)}

METODE DUBBING: ${dubbing}
JUMLAH SCRIPT YANG DIHASILKAN: ${jumlahScript}

=======================================================
LOGIKA DASAR SEBELUM MENULIS SETIAP SCRIPT:
Sebelum menulis, tentukan dengan jelas fondasi berikut untuk setiap naskah:
1. Moment of Need (Kapan/di momen apa produk ini sangat dibutuhkan oleh pengguna)
2. 1 Masalah Utama (Rasa repot / rasa kesal spesifik yang ingin diselesaikan, tanpa melenceng dari fungsi asli produk)
3. 1 Core Selling Idea (Ide pokok pesan yang membuat produk ini menarik)
4. 1 Benefit Utama (Manfaat konkret terbesar yang terhubung langsung secara sebab-akibat dengan fitur produk)
5. Alasan Membeli (Mengapa produk ini layak dipertimbangkan dibanding cara lama)
=======================================================

ATURAN KUALITAS NASKAH (WAJIB DIPATUHI SECARA KETAT):

1. FAKTA & KEJUJURAN KLAIM:
- Dilarang keras mengarang angka, durasi, harga, penghematan, hasil, performa, testimoni, atau perbandingan yang tidak diberikan user/foto.
- PRINSIP: Lebih baik klaim sederhana yang benar daripada klaim menarik tetapi tidak dapat dibuktikan.
- Dilarang membuat klaim absolut yang tidak didukung data produk (tanpa kata "paling bagus sedunia", "pasti sembuh", dsb).
- Dilarang mengarang pengalaman penggunaan pribadi fiktif (seperti "saya sudah pakai 6 bulan", testimoni buatan, angka hasil fiktif, klaim medis, atau garansi palsu).
- Gunakan sudut pandang objektif yang aman & persuasif: "Yang paling ngebantu dari produk ini...", "Biar nggak ribet pas...", "Desainnya ini fokus di kemudahan...".

2. KETEPATAN MASALAH:
- Jangan mengubah masalah produk menjadi masalah lain hanya demi membuat hook lebih menarik.
- Pastikan masalah yang diangkat, fitur yang disorot, dan manfaat yang dijelaskan tetap murni sesuai produk aslinya.

3. SEBAB-AKIBAT LOGIS (FEATURE-TO-BENEFIT):
- Setiap benefit harus punya hubungan sebab-akibat yang jelas dan masuk akal dengan fitur atau cara penggunaan produk.
- Jangan memaksakan benefit atau klaim yang tidak berhubungan dengan fungsi nyata produk.
- Jangan hanya mengatakan produk bagus, praktis, atau berkualitas. Tunjukkan situasi nyata dan alasan logis yang membuat produk tersebut berguna.

4. NATURAL + PERSUASIF (UJI VOICE NOTE):
- Gunakan bahasa percakapan Indonesia yang natural seperti sedang mengobrol atau berbicara kepada teman.
- JIKA SEBUAH KALIMAT TERDENGAR SEPERTI IKLAN, BROSUR, MARKETPLACE, ARTIKEL, ATAU COPYWRITING KAKU: TULIS ULANG.
- Jangan menjelaskan bahwa "produk ini bagus" secara eksplisit. Ceritakan situasi dan fungsinya secara jujur, sehingga penonton MENYIMPULKAN SENDIRI bahwa produk ini berguna.
- Hindari menumpuk kata jualan. Gunakan susunan kalimat yang mengalir dan ritme yang bervariasi.
- Hindari bahasa terlalu baku/formal, dan hindari slang berlebihan.
- JANGAN MEMAKSAKAN kata penghubung klise (seperti "nah", "jadi", "makanya", "yuk simak") di awal setiap kalimat.
- Seluruh teks naskah, hook, arahan footage, CTA, dan caption TIDAK BOLEH mengandung emoji apa pun.

5. VARIASI HOOK ANTI-KLISE & HINDARI TEMPLATE AFFILIATE:
- Hook 3 detik pertama harus memikat dan menghentikan scrolling tanpa clickbait palsu.
- HINDARI kata template affiliate seperti "rahasia", "wajib", "mumpung", "dijamin", "pasti", "racun tiktok" jika tidak diperlukan atau tidak didukung fakta.
- HINDARI formula klise pembuka: "Kalau kamu...", "Buat kamu yang...", "Wajib punya ini...", "Jangan beli ini sebelum nonton...".
- Variasikan jenis hook di setiap script: Problem relatable, Curiosity visual, Situasi nyata, Insight menarik, Hasil transformasi, atau Sudut pandang contrarian.

6. MULTI-SCRIPT VARIATION (${jumlahScript} Script Berbeda):
${
  jumlahScript > 1
    ? `- Jika membuat lebih dari 1 script, setiap script dari ke-${jumlahScript} naskah WAJIB berbeda minimal pada 2 (dua) aspek utama berikut:
  * Situasi (momen/kondisi pemakaian nyata yang diangkat)
  * Masalah (titik repot/pain point spesifik yang disorot)
  * Benefit (fokus 1 manfaat utama yang ditonjolkan)
  * Hook (pembuka 3 detik pertama)
  * Demonstrasi (fokus aksi visual produk yang diperagakan)`
    : `- Buat script dengan angle penjualan dan 1 fokus manfaat yang paling tajam dan relevan.`
}

7. ATURAN SETUP SHOOTING TERKUNCI & FOOTAGE SEBAGAI BUKTI VISUAL:
- Seluruh script dalam proyek ini menggunakan Setup Shooting yang sama (lokasi, equipment, properti, dan penampilan creator tetap terkunci).
- Footage harus menjadi bukti visual langsung dari narasi kata demi kata (jika narasi menyebut masalah → peragakan masalah; jika menyebut fitur/fungsi → tunjukkan aksi produknya).
- 100% footage harus realistis direkam sendirian oleh 1 orang tanpa bantuan kru.

8. ATURAN METODE DUBBING (${dubbing}):
${
  dubbing === "Suara sendiri"
    ? `- Gaya lisan conversational yang mengalir bebas, santai, bernafas alami, dan mudah diucapkan oleh creator tanpa belitan lidah.`
    : `- Kalimat lebih terstruktur, ringkas, jelas, satu ide pokok per kalimat, dengan jeda tanda baca yang rapi agar intonasi Text-to-Speech AI terdengar jernih dan tidak kaku.`
}

9. DURASI & PANJANG KATA (TARGET 30–45 DETIK, MAX 60 DETIK):
- Panjang narasi harus realistis dibacakan dalam durasi 30 hingga 45 detik (maksimal absolut 60 detik).
- Standar kecepatan bicara santai bahasa Indonesia adalah sekitar 130–150 kata per menit (~70 hingga 120 kata per script).
- Alur struktur narasi: Hook Pembuka → Situasi Masalah → Solusi Produk → 1 Manfaat Utama & Demonstrasi Visual → Alasan Membeli → Call To Action.

10. FOOTAGE VISUAL:
- Wajib menyertakan minimal 4 instruksi adegan visual yang konkret, jelas, dan menjadi bukti visual dari narasi.
- Jangan membuat instruksi footage yang generik atau abstrak.

11. CALL TO ACTION (CTA NATURAL SESUAI TINGKAT NIAT BELI):
- CTA harus natural dan sesuai tingkat niat beli calon pembeli, bukan template hard selling yang memaksa (misal: mengarahkan ke keranjang kuning secara wajar sesuai solusi yang baru saja dijelaskan).

12. CAPTION & TEPAT 5 HASHTAG:
- Caption: Wajib TEPAT 1 (satu) kalimat pendek yang menjual, persuasif, natural, dan tidak hiperbola.
- Hashtags: Wajib TEPAT 5 (lima) tagar relevan yang diawali dengan tanda pagar (#).

13. QUALITY SELF-CHECK INTERNAL SEBELUM MENGEMBALIKAN OUTPUT:
Setelah draft naskah selesai, lakukan pemeriksaan internal berikut:
- Apakah terdengar seperti manusia asli saat dibacakan?
- Apakah nyaman diucapkan tanpa belitan lidah?
- Apakah tidak seperti iklan kaku, brosur, atau marketplace?
- Apakah 1 benefit utamanya jelas dan memiliki sebab-akibat yang nyata dengan fitur?
- Apakah faktanya aman, tanpa klaim palsu/angka buatan/testimoni fiktif?
- Apakah masalahnya tepat sesuai produk?
- Apakah footage menjadi bukti visual narasi?
- Apakah setup shooting tetap konsisten terkunci?
- Apakah durasi pembacaan narasi maksimal 60 detik?
JIKA GAGAL PADA SALAH SATU POIN DI ATAS, TULIS ULANG SEBELUM MENGEMBALIKAN OUTPUT FINAL.

=======================================================
KEMBALIKAN HANYA JSON MURNI DENGAN STRUKTUR PERSIS BERIKUT:
{
  "analisisProduk": ${JSON.stringify(analysis)},
  "targetPengguna": "${analysis.targetPengguna || 'Target pengguna produk'}",
  "masalahUtama": "${analysis.masalahYangDiselesaikan || 'Masalah utama yang diselesaikan'}",
  "benefitUtama": "Benefit utama produk yang paling kuat",
  "anglePenjualan": "Strategi angle penjualan utama",
  "setupShooting": ${JSON.stringify(setup)},
  "scripts": [
    {
      "angle": "Judul angle spesifik script ini (berbeda untuk setiap script)",
      "hook": "Kalimat pembuka 3 detik pertama yang memikat dan anti-klise",
      "narasi": "Naskah narasi lengkap yang mengalir natural, enak didengar, dan persuasif (durasi 30-45 detik)",
      "footage": [
        "Instruksi visual adegan 1 yang selaras dengan hook/masalah",
        "Instruksi visual adegan 2 yang menunjukkan detail produk",
        "Instruksi visual adegan 3 yang memperagakan solusi/manfaat",
        "Instruksi visual adegan 4 yang menutup dengan produk dan aksi"
      ],
      "cta": "Ajakan aksi yang natural dan tidak memaksa",
      "caption": "Satu kalimat caption yang menarik dan menjual",
      "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
    }
  ]
}

PASTIKAN JUMLAH ELEMEN PADA ARRAY "scripts" PERSIS SEBANYAK ${jumlahScript}.
`.trim();
}