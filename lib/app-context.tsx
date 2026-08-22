"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from "react";
import { ApiStatus, GeneratedResult } from "./types";

interface AppContextValue {
  apiKey: string;
  setApiKey: (key: string) => void;
  status: ApiStatus;
  statusMessage: string;
  testConnection: (key?: string) => Promise<boolean>;
  projectResult: GeneratedResult | null;
  setProjectResult: (result: GeneratedResult | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState("");
  const [status, setStatus] = useState<ApiStatus>("idle");
  const [statusMessage, setStatusMessage] = useState(
    "Masukkan API Gemini untuk mulai menggunakan fitur AI."
  );
  const [projectResult, setProjectResult] = useState<GeneratedResult | null>(null);

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    if (!key.trim()) {
      setStatus("idle");
      setStatusMessage("Masukkan API Gemini untuk mulai menggunakan fitur AI.");
    }
  }, []);

  const testConnection = useCallback(
    async (key?: string) => {
      const keyToTest = key ?? apiKey;

      if (!keyToTest.trim()) {
        setStatus("idle");
        setStatusMessage("Masukkan API Gemini untuk mulai menggunakan fitur AI.");
        return false;
      }

      setStatus("checking");
      setStatusMessage("Memeriksa koneksi…");

      try {
        const response = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "test", apiKey: keyToTest }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setStatus("connected");
          setStatusMessage("API Gemini berhasil terhubung dan siap digunakan.");
          setApiKeyState(keyToTest);
          return true;
        }

        setStatus("error");
        setStatusMessage(result.message || "API key tidak valid.");
        return false;
      } catch {
        setStatus("error");
        setStatusMessage("Layanan Gemini sedang tidak merespons.");
        return false;
      }
    },
    [apiKey]
  );

  return (
    <AppContext.Provider
      value={{
        apiKey,
        setApiKey,
        status,
        statusMessage,
        testConnection,
        projectResult,
        setProjectResult,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp harus digunakan di dalam AppProvider");
  }
  return context;
}