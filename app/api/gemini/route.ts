import { NextRequest, NextResponse } from "next/server";
import { callGeminiJSON, listCompatibleGeminiModels } from "@/lib/gemini/client";
import {
  buildAnalyzePrompt,
  buildSetupPrompt,
  buildGeneratePrompt,
  buildRegenerateHookPrompt,
  buildRegenerateNarasiPrompt,
  buildRegenerateCtaPrompt,
} from "@/lib/prompt-engine";
import {
  validateProductAnalysis,
  validateSetupShooting,
  validateGeneratedResult,
} from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body: any = await request.json();
    const { action, apiKey, model: requestedModel, ...payload } = body || {};
    const cleanKey = typeof apiKey === "string" ? apiKey.trim() : "";

    if (!cleanKey) {
      return NextResponse.json(
        { success: false, message: "API key belum diisi." },
        { status: 400 }
      );
    }

    if (action === "test") {
      const models = await listCompatibleGeminiModels(cleanKey);

      if (!models || models.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Tidak ditemukan model Gemini yang kompatibel untuk API ini.",
          },
          { status: 400 }
        );
      }

      const testData = await callGeminiJSON({
        apiKey: cleanKey,
        prompt: 'Jawab hanya dengan JSON: {"status": "ok"}',
      });

      if (testData && typeof testData === "object") {
        return NextResponse.json({
          success: true,
          data: { ok: true },
        });
      }

      return NextResponse.json(
        { success: false, message: "Respons API tidak sesuai." },
        { status: 502 }
      );
    }

    if (action === "analyze") {
      const images = payload.images;

      if (!Array.isArray(images) || images.length !== 5) {
        return NextResponse.json(
          { success: false, message: "Pastikan tepat 5 foto tersedia." },
          { status: 400 }
        );
      }

      const prompt = buildAnalyzePrompt();
      const data = await callGeminiJSON({
        apiKey: cleanKey,
        prompt,
        images,
        model: requestedModel,
      });

      const validation = validateProductAnalysis(data);

      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            message: `Hasil analisis tidak valid: ${validation.errors.join(" ")}`,
          },
          { status: 502 }
        );
      }

      return NextResponse.json({ success: true, data: validation.data });
    }

    if (action === "setup") {
      const { analysis, conditions } = payload;

      if (!analysis || !conditions) {
        return NextResponse.json(
          {
            success: false,
            message: "Data analisis atau kondisi shooting tidak lengkap.",
          },
          { status: 400 }
        );
      }

      const prompt = buildSetupPrompt(analysis, conditions);
      const data = await callGeminiJSON({
        apiKey: cleanKey,
        prompt,
        model: requestedModel,
      });

      const validation = validateSetupShooting(data);

      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            message: `Setup shooting tidak valid: ${validation.errors.join(" ")}`,
          },
          { status: 502 }
        );
      }

      return NextResponse.json({ success: true, data: validation.data });
    }

    if (action === "generate") {
      const { analysis, setup, dubbing, jumlahScript } = payload;

      if (!analysis || !setup || !dubbing || typeof jumlahScript !== "number") {
        return NextResponse.json(
          { success: false, message: "Data tidak lengkap untuk generate script." },
          { status: 400 }
        );
      }

      if (jumlahScript < 1 || jumlahScript > 10) {
        return NextResponse.json(
          { success: false, message: "Jumlah script harus antara 1 dan 10." },
          { status: 400 }
        );
      }

      const prompt = buildGeneratePrompt({
        analysis,
        setup,
        dubbing,
        jumlahScript,
      });

      const rawData = await callGeminiJSON({
        apiKey: cleanKey,
        prompt,
        model: requestedModel,
      });

      // Inject analisisProduk dan setupShooting dari input yang sudah di-lock
      // (AI tidak lagi mengembalikan keduanya dalam schema baru)
      const dataToValidate = {
        ...(Array.isArray(rawData)
          ? { scripts: rawData }
          : typeof rawData === "object" && rawData !== null
          ? rawData
          : {}),
        analisisProduk: analysis,
        setupShooting: setup,
      };

      const validation = validateGeneratedResult(dataToValidate, jumlahScript);

      if (!validation.valid || !validation.data) {
        return NextResponse.json(
          {
            success: false,
            message: `Hasil generate tidak valid: ${validation.errors.join(" ")}`,
          },
          { status: 502 }
        );
      }

      return NextResponse.json({ success: true, data: validation.data });
    }

    if (action === "regenerate_hook") {
      const { analysis, setup, narasi, cta, angle, previousHook } = payload;

      if (!analysis || !setup || typeof narasi !== "string" || typeof cta !== "string") {
        return NextResponse.json(
          { success: false, message: "Data tidak lengkap untuk regenerasi hook." },
          { status: 400 }
        );
      }

      const prompt = buildRegenerateHookPrompt({
        analysis,
        setup,
        narasi,
        cta,
        angle: angle || "",
        previousHook: typeof previousHook === "string" ? previousHook : undefined,
      });

      const data = await callGeminiJSON({
        apiKey: cleanKey,
        prompt,
        model: requestedModel,
        temperature: 0.9,
      });

      const hook = typeof data?.hook === "string" ? data.hook.trim() : "";
      if (!hook) {
        return NextResponse.json(
          { success: false, message: "Gagal menghasilkan hook baru dari AI." },
          { status: 502 }
        );
      }

      return NextResponse.json({ success: true, data: { hook } });
    }

    if (action === "regenerate_narasi") {
      const { analysis, setup, hook, cta, angle, dubbing, previousNarasi } = payload;

      if (!analysis || !setup || typeof hook !== "string" || typeof cta !== "string") {
        return NextResponse.json(
          { success: false, message: "Data tidak lengkap untuk regenerasi narasi." },
          { status: 400 }
        );
      }

      const prompt = buildRegenerateNarasiPrompt({
        analysis,
        setup,
        hook,
        cta,
        angle: angle || "",
        dubbing: dubbing === "Suara AI" ? "Suara AI" : "Suara sendiri",
        previousNarasi: typeof previousNarasi === "string" ? previousNarasi : undefined,
      });

      const data = await callGeminiJSON({
        apiKey: cleanKey,
        prompt,
        model: requestedModel,
        temperature: 0.9,
      });

      const narasi = typeof data?.narasi === "string" ? data.narasi.trim() : "";
      const footage = Array.isArray(data?.footage) ? data.footage.map(String) : [];

      if (!narasi) {
        return NextResponse.json(
          { success: false, message: "Gagal menghasilkan narasi baru dari AI." },
          { status: 502 }
        );
      }

      return NextResponse.json({ success: true, data: { narasi, footage } });
    }

    if (action === "regenerate_cta") {
      const { analysis, setup, hook, narasi, angle, previousCta } = payload;

      if (!analysis || typeof hook !== "string" || typeof narasi !== "string") {
        return NextResponse.json(
          { success: false, message: "Data tidak lengkap untuk regenerasi CTA." },
          { status: 400 }
        );
      }

      const prompt = buildRegenerateCtaPrompt({
        analysis,
        setup,
        hook,
        narasi,
        angle: angle || "",
        previousCta: typeof previousCta === "string" ? previousCta : undefined,
      });

      const data = await callGeminiJSON({
        apiKey: cleanKey,
        prompt,
        model: requestedModel,
        temperature: 0.9,
      });

      const cta = typeof data?.cta === "string" ? data.cta.trim() : "";
      if (!cta) {
        return NextResponse.json(
          { success: false, message: "Gagal menghasilkan CTA baru dari AI." },
          { status: 502 }
        );
      }

      return NextResponse.json({ success: true, data: { cta } });
    }

    return NextResponse.json(
      { success: false, message: "Aksi tidak dikenali." },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan pada server.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}