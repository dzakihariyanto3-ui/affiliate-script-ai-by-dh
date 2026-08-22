import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  GEMINI_MODEL,
  GEMINI_RESPONSE_MIME_TYPE,
  GEMINI_TEMPERATURE,
  GEMINI_TOP_P,
  GEMINI_MAX_OUTPUT_TOKENS,
} from "./config";

interface GeminiImagePart {
  inlineData: {
    mimeType: string;
    data: string;
  };
}

interface CallGeminiJSONParams {
  apiKey: string;
  prompt: string;
  images?: GeminiImagePart[];
}

function normalizeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes("api key not valid") ||
    normalized.includes("invalid api key") ||
    normalized.includes("api_key_invalid") ||
    normalized.includes("api key expired") ||
    normalized.includes("400") && normalized.includes("key") ||
    normalized.includes("403") ||
    normalized.includes("forbidden")
  ) {
    if (normalized.includes("permission") || normalized.includes("forbidden")) {
      return "API key tidak memiliki izin akses yang diperlukan.";
    }
    return "API key tidak valid. Pastikan Anda menyalin API key dengan benar dari Google AI Studio.";
  }

  if (
    normalized.includes("model") &&
    (normalized.includes("not found") ||
      normalized.includes("not available") ||
      normalized.includes("does not exist") ||
      normalized.includes("404"))
  ) {
    return "Model Gemini tidak tersedia untuk akun ini.";
  }

  if (
    normalized.includes("429") ||
    normalized.includes("quota") ||
    normalized.includes("resource exhausted") ||
    normalized.includes("rate limit")
  ) {
    return "Batas kuota/rate limit Gemini tercapai. Silakan coba beberapa saat lagi.";
  }

  if (
    normalized.includes("503") ||
    normalized.includes("500") ||
    normalized.includes("overloaded") ||
    normalized.includes("internal server error") ||
    normalized.includes("timed out") ||
    normalized.includes("timeout")
  ) {
    return "Layanan Gemini sedang sibuk atau tidak merespons. Silakan coba beberapa saat lagi.";
  }

  if (
    normalized.includes("network") ||
    normalized.includes("fetch") ||
    normalized.includes("connection") ||
    normalized.includes("econnrefused") ||
    normalized.includes("etimedout")
  ) {
    return "Koneksi ke server Gemini gagal. Periksa koneksi internet Anda.";
  }

  return `Gagal menghubungi Gemini: ${message.replace(/AIzaSy[A-Za-z0-9_-]+/g, "[API_KEY_HIDDEN]")}`;
}

const CANDIDATE_MODELS = [
  GEMINI_MODEL,
  "gemini-3.6-flash",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
];

export async function callGeminiJSON({
  apiKey,
  prompt,
  images = [],
}: CallGeminiJSONParams): Promise<any> {
  const cleanKey = apiKey ? apiKey.trim() : "";
  if (!cleanKey) {
    throw new Error("API key belum diisi.");
  }

  const genAI = new GoogleGenerativeAI(cleanKey);
  const parts: any[] = [{ text: prompt }];

  for (const image of images) {
    parts.push(image);
  }

  // Hilangkan duplikasi model list
  const modelsToTry = Array.from(new Set(CANDIDATE_MODELS));
  let lastError: unknown = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: GEMINI_TEMPERATURE,
          topP: GEMINI_TOP_P,
          maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
          responseMimeType: GEMINI_RESPONSE_MIME_TYPE,
        },
      });

      const result = await model.generateContent({
        contents: [{ role: "user", parts }],
      });

      const text = result.response.text();
      const trimmed = text
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "");

      return JSON.parse(trimmed);
    } catch (error) {
      lastError = error;
      const errMsg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      
      // Jika errornya bukan karena model tidak ditemukan, jangan lanjut ke model lain (misal invalid key, rate limit)
      const isModelNotFound = errMsg.includes("not found") || errMsg.includes("404") || errMsg.includes("not available");
      if (!isModelNotFound) {
        break;
      }
    }
  }

  const safeError = lastError instanceof Error ? lastError.message : String(lastError);
  console.error("Gemini API Error:", safeError.replace(/AIzaSy[A-Za-z0-9_-]+/g, "[REDACTED]"));
  throw new Error(normalizeErrorMessage(lastError));
}