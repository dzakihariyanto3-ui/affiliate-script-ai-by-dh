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
  model?: string;
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

const DEFAULT_CANDIDATE_MODELS = [
  GEMINI_MODEL,
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "gemini-2.5-flash",
];

export async function listCompatibleGeminiModels(apiKey: string): Promise<string[]> {
  try {
    const cleanKey = apiKey ? apiKey.trim() : "";
    if (!cleanKey) return [];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`,
      { headers: { "Content-Type": "application/json" } }
    );

    if (!response.ok) {
      return DEFAULT_CANDIDATE_MODELS;
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.models)) {
      return DEFAULT_CANDIDATE_MODELS;
    }

    const compatible = data.models
      .filter((m: any) => {
        const name = (m.name || "").replace(/^models\//, "");
        const methods = m.supportedGenerationMethods || [];
        const isGenerateContent = methods.includes("generateContent");
        const isGemini = name.toLowerCase().includes("gemini");
        const isExcluded =
          name.includes("embedding") ||
          name.includes("aqa") ||
          name.includes("imagen") ||
          name.includes("tts") ||
          name.includes("whisper");
        return isGenerateContent && isGemini && !isExcluded;
      })
      .map((m: any) => (m.name || "").replace(/^models\//, ""));

    if (compatible.length > 0) {
      return Array.from(new Set(compatible));
    }

    return DEFAULT_CANDIDATE_MODELS;
  } catch (error) {
    console.error("Error listing Gemini models:", error);
    return DEFAULT_CANDIDATE_MODELS;
  }
}

export async function callGeminiJSON({
  apiKey,
  prompt,
  images = [],
  model: preferredModel,
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

  // Bangun daftar candidate models
  const rawCandidateList = (preferredModel && preferredModel !== "auto")
    ? [preferredModel, ...DEFAULT_CANDIDATE_MODELS]
    : DEFAULT_CANDIDATE_MODELS;

  const modelsToTry = Array.from(new Set(rawCandidateList));
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