import { NextRequest, NextResponse } from "next/server";
import { callGeminiJSON, listCompatibleGeminiModels } from "@/lib/gemini/client";
import {
  buildAnalyzePrompt,
  buildSetupPrompt,
  buildGeneratePrompt,
  buildRegenerateFullScriptPrompt,
  buildRegenerateHookPrompt,
  buildRegenerateNarasiPrompt,
  buildRegenerateCtaPrompt,
  FINAL_CTAS,
  getNextCta,
} from "@/lib/prompt-engine";
import { normalizeForMatch } from "@/lib/format";
import {
  validateProductAnalysis,
  validateSetupShooting,
  validateGeneratedResult,
  validateScript,
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

      // Pastikan CTA setiap script adalah salah satu dari 6 CTA final tanpa duplikasi dalam satu batch
      const usedCtas = new Set<string>();
      const sequenceIndices = [0, 2, 4, 1, 3, 5]; // Rotasi: 1A, 2A, 3A, 1B, 2B, 3B
      validation.data.scripts = validation.data.scripts.map((script, idx) => {
        const rawCta = script.cta || "";
        const matched = FINAL_CTAS.find(
          (c) => normalizeForMatch(c.text) === normalizeForMatch(rawCta)
        );
        let finalCtaText = matched ? matched.text : "";
        if (!finalCtaText || usedCtas.has(finalCtaText)) {
          const seqIdx = sequenceIndices[idx % sequenceIndices.length];
          finalCtaText = FINAL_CTAS[seqIdx].text;
          if (usedCtas.has(finalCtaText)) {
            const available = FINAL_CTAS.find((c) => !usedCtas.has(c.text));
            if (available) finalCtaText = available.text;
          }
        }
        usedCtas.add(finalCtaText);
        return {
          ...script,
          cta: finalCtaText,
        };
      });

      return NextResponse.json({ success: true, data: validation.data });
    }

    if (action === "regenerate_full_script") {
      const {
        analysis,
        setup,
        dubbing,
        durasi,
        mode,
        currentScript,
        forbiddenAngles,
      } = payload;

      if (!analysis || !setup || !dubbing || !currentScript) {
        return NextResponse.json(
          { success: false, message: "Data tidak lengkap untuk regenerasi script utuh." },
          { status: 400 }
        );
      }

      const prompt = buildRegenerateFullScriptPrompt({
        analysis,
        setup,
        dubbing: dubbing === "Suara AI" ? "Suara AI" : "Suara sendiri",
        mode: mode === "same_angle" ? "same_angle" : "total",
        currentScript,
        forbiddenAngles: Array.isArray(forbiddenAngles) ? forbiddenAngles : [],
        durasi: typeof durasi === "string" ? durasi : "30-45 detik",
      });

      const rawData = await callGeminiJSON({
        apiKey: cleanKey,
        prompt,
        model: requestedModel,
      });

      // Handle rawData if wrapped in { scripts: [...] } or direct script object
      const candidateScript = Array.isArray(rawData?.scripts) && rawData.scripts.length > 0
        ? rawData.scripts[0]
        : (typeof rawData === "object" && rawData !== null ? rawData : null);

      if (!candidateScript) {
        return NextResponse.json(
          { success: false, message: "Gagal menghasilkan script utuh dari AI." },
          { status: 502 }
        );
      }

      // Validasi single script menggunakan validateScript
      const validation = validateScript(candidateScript, 0);
      if (validation.errors.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: `Hasil regenerasi script tidak valid: ${validation.errors.join(" ")}`,
          },
          { status: 502 }
        );
      }

      const validated = validation.script;

      // Pastikan CTA script adalah salah satu dari 6 CTA final
      const rawCta = validated.cta || "";
      const matched = FINAL_CTAS.find(
        (c) => normalizeForMatch(c.text) === normalizeForMatch(rawCta)
      );
      if (matched) {
        validated.cta = matched.text;
      } else {
        validated.cta = getNextCta(currentScript.cta);
      }

      // Jika mode === "same_angle", pastikan angle terkunci pada angle lama
      if (mode === "same_angle") {
        validated.angle = currentScript.angle;
      }

      return NextResponse.json({ success: true, data: { script: validated } });
    }

    if (action === "regenerate_hook") {
      const {
        analysis,
        setup,
        narasi: rawNarasi,
        cta: rawCta,
        angle: rawAngle,
        footage: rawFootage,
        caption: rawCaption,
        previousHook,
        currentScript,
      } = payload;

      const narasi = typeof currentScript?.narasi === "string" ? currentScript.narasi : (typeof rawNarasi === "string" ? rawNarasi : "");
      const cta = typeof currentScript?.cta === "string" ? currentScript.cta : (typeof rawCta === "string" ? rawCta : "");
      const angle = typeof currentScript?.angle === "string" ? currentScript.angle : (typeof rawAngle === "string" ? rawAngle : "");
      const footage = Array.isArray(currentScript?.footage) ? currentScript.footage : (Array.isArray(rawFootage) ? rawFootage : []);
      const caption = typeof currentScript?.caption === "string" ? currentScript.caption : (typeof rawCaption === "string" ? rawCaption : "");

      if (!analysis || !setup || !narasi || !cta) {
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
        angle,
        footage,
        caption,
        previousHook: typeof previousHook === "string" ? previousHook : (typeof currentScript?.hook === "string" ? currentScript.hook : undefined),
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

      // Timpa hanya bagian hook di sisi server, bagian lain dipertahankan persis
      const baseScript = currentScript && typeof currentScript === "object" ? currentScript : {
        angle,
        narasi,
        cta,
        footage,
        caption,
      };
      const updatedScript = {
        ...baseScript,
        hook,
      };

      return NextResponse.json({ success: true, data: { hook, script: updatedScript } });
    }

    if (action === "regenerate_narasi") {
      const {
        analysis,
        setup,
        hook: rawHook,
        cta: rawCta,
        angle: rawAngle,
        caption: rawCaption,
        dubbing: rawDubbing,
        previousNarasi,
        currentScript,
      } = payload;

      const hook = typeof currentScript?.hook === "string" ? currentScript.hook : (typeof rawHook === "string" ? rawHook : "");
      const cta = typeof currentScript?.cta === "string" ? currentScript.cta : (typeof rawCta === "string" ? rawCta : "");
      const angle = typeof currentScript?.angle === "string" ? currentScript.angle : (typeof rawAngle === "string" ? rawAngle : "");
      const caption = typeof currentScript?.caption === "string" ? currentScript.caption : (typeof rawCaption === "string" ? rawCaption : "");
      const dubbing = rawDubbing === "Suara AI" ? "Suara AI" : "Suara sendiri";

      if (!analysis || !setup || !hook || !cta) {
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
        angle,
        caption,
        dubbing,
        previousNarasi: typeof previousNarasi === "string" ? previousNarasi : (typeof currentScript?.narasi === "string" ? currentScript.narasi : undefined),
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

      // Timpa hanya narasi & footage di sisi server, bagian lain dipertahankan persis
      const baseScript = currentScript && typeof currentScript === "object" ? currentScript : {
        angle,
        hook,
        cta,
        caption,
      };
      const updatedScript = {
        ...baseScript,
        narasi,
        footage: footage.length > 0 ? footage : (baseScript.footage || []),
      };

      return NextResponse.json({ success: true, data: { narasi, footage, script: updatedScript } });
    }

    if (action === "regenerate_cta") {
      const {
        analysis,
        setup,
        hook: rawHook,
        narasi: rawNarasi,
        angle: rawAngle,
        footage: rawFootage,
        caption: rawCaption,
        previousCta,
        targetType,
        currentScript,
      } = payload;

      const hook = typeof currentScript?.hook === "string" ? currentScript.hook : (typeof rawHook === "string" ? rawHook : "");
      const narasi = typeof currentScript?.narasi === "string" ? currentScript.narasi : (typeof rawNarasi === "string" ? rawNarasi : "");
      const angle = typeof currentScript?.angle === "string" ? currentScript.angle : (typeof rawAngle === "string" ? rawAngle : "");
      const footage = Array.isArray(currentScript?.footage) ? currentScript.footage : (Array.isArray(rawFootage) ? rawFootage : []);
      const caption = typeof currentScript?.caption === "string" ? currentScript.caption : (typeof rawCaption === "string" ? rawCaption : "");
      const effectivePrevCta = typeof previousCta === "string" ? previousCta : (typeof currentScript?.cta === "string" ? currentScript.cta : undefined);

      if (!analysis || !hook || !narasi) {
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
        angle,
        footage,
        caption,
        previousCta: effectivePrevCta,
        targetType: typeof targetType === "number" ? targetType : undefined,
      });

      const data = await callGeminiJSON({
        apiKey: cleanKey,
        prompt,
        model: requestedModel,
        temperature: 0.9,
      });

      const rawCta = typeof data?.cta === "string" ? data.cta.trim() : "";
      // Cocokkan dengan salah satu dari 6 CTA final untuk memastikan salinan 100% persis
      const matched = FINAL_CTAS.find(
        (c) => normalizeForMatch(c.text) === normalizeForMatch(rawCta)
      );
      const cta = matched ? matched.text : getNextCta(effectivePrevCta, targetType);

      if (!cta) {
        return NextResponse.json(
          { success: false, message: "Gagal menghasilkan CTA baru dari AI." },
          { status: 502 }
        );
      }

      // Timpa hanya CTA di sisi server, bagian lain dipertahankan persis
      const baseScript = currentScript && typeof currentScript === "object" ? currentScript : {
        angle,
        hook,
        narasi,
        footage,
        caption,
      };
      const updatedScript = {
        ...baseScript,
        cta,
      };

      return NextResponse.json({ success: true, data: { cta, script: updatedScript } });
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