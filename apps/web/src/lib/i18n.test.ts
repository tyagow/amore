import { describe, expect, it } from "vitest";
import { normalizeLocale, translateText } from "./i18n";

describe("i18n locale utilities", () => {
  it("normalizes supported browser and stored locale values", () => {
    expect(normalizeLocale("pt-BR")).toBe("pt-BR");
    expect(normalizeLocale("pt_BR")).toBe("pt-BR");
    expect(normalizeLocale("pt")).toBe("pt-BR");
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale(undefined)).toBe("en");
  });

  it("keeps English copy unchanged", () => {
    expect(translateText("Send", "en")).toBe("Send");
  });

  it("translates known app copy to pt-BR", () => {
    expect(translateText("Send", "pt-BR")).toBe("Enviar");
    expect(translateText("Fix before send", "pt-BR")).toBe(
      "Corrigir antes de enviar",
    );
    expect(translateText("Review tone with AI", "pt-BR")).toBe(
      "Revisar tom com IA",
    );
    expect(translateText("Write", "pt-BR")).toBe("Escrever");
    expect(translateText("Improve", "pt-BR")).toBe("Melhorar");
    expect(translateText("Guide", "pt-BR")).toBe("Guias");
    expect(translateText("Voice message", "pt-BR")).toBe("Mensagem de voz");
    expect(translateText("Play voice message", "pt-BR")).toBe(
      "Reproduzir mensagem de voz",
    );
  });

  it("leaves unknown dynamic content unchanged", () => {
    expect(translateText("Jaluza", "pt-BR")).toBe("Jaluza");
  });
});
