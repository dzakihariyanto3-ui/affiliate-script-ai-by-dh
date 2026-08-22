import { GeneratedResult, Script } from "./types";

export function formatScript(script: Script, index: number): string {
  const lines: string[] = [];

  lines.push(`Script ${String(index + 1).padStart(2, "0")}`);
  lines.push("");
  lines.push("Angle:");
  lines.push(script.angle);
  lines.push("");
  lines.push("Hook:");
  lines.push(script.hook);
  lines.push("");
  lines.push("Narasi:");
  lines.push(script.narasi);
  lines.push("");
  lines.push("Footage:");
  lines.push("");

  script.footage.forEach((item, i) => {
    lines.push(`${i + 1}. ${item}`);
  });

  lines.push("");
  lines.push("CTA:");
  lines.push(script.cta);
  lines.push("");
  lines.push("Caption:");
  lines.push(script.caption);
  lines.push("");

  const hashtags = script.hashtags
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .join(" ");

  lines.push(hashtags);

  return lines.join("\n");
}

export function formatAllResult(result: GeneratedResult): string {
  const lines: string[] = [];

  lines.push("Hasil Analisis");
  lines.push("");
  lines.push("Produk:");
  lines.push(result.analisisProduk.produk);
  lines.push("");
  lines.push("Target pengguna:");
  lines.push(result.targetPengguna);
  lines.push("");
  lines.push("Masalah utama:");
  lines.push(result.masalahUtama);
  lines.push("");
  lines.push("Benefit utama:");
  lines.push(result.benefitUtama);
  lines.push("");
  lines.push("Angle penjualan:");
  lines.push(result.anglePenjualan);
  lines.push("");
  lines.push("Setup shooting:");
  lines.push("");
  lines.push(`Lokasi: ${result.setupShooting.lokasi}`);
  lines.push(`Equipment: ${result.setupShooting.equipment}`);
  lines.push(`Properti: ${result.setupShooting.properti}`);
  lines.push(`Penampilan: ${result.setupShooting.penampilan}`);
  lines.push(`Keterbatasan: ${result.setupShooting.keterbatasan}`);
  lines.push("");

  result.scripts.forEach((script, index) => {
    lines.push(formatScript(script, index));
    lines.push("");
  });

  return lines.join("\n");
}