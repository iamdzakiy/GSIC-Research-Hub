import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); });

describe("sendMail via Resend", () => {
  it("posts to the Resend API with the configured sender", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("MAIL_FROM", "GSIC Hub <no-reply@example.org>");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => "" });
    vi.stubGlobal("fetch", fetchMock);
    const { sendMail } = await import("@/lib/mailer");
    await sendMail({ to: "a@gmail.com", subject: "Hi", html: "<p>x</p>", text: "x" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    const body = JSON.parse(init.body);
    expect(body.from).toBe("GSIC Hub <no-reply@example.org>");
    expect(body.to).toEqual(["a@gmail.com"]);
  });

  it("asks for MAIL_FROM when the key is set without a sender", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("MAIL_FROM", "");
    vi.stubEnv("SMTP_FROM", "");
    const { sendMail, MailConfigError } = await import("@/lib/mailer");
    await expect(sendMail({ to: "a@gmail.com", subject: "s", html: "h", text: "t" })).rejects.toBeInstanceOf(MailConfigError);
  });

  it("raises a config error when no provider is set", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("SMTP_HOST", "");
    const { sendMail, MailConfigError } = await import("@/lib/mailer");
    await expect(sendMail({ to: "a@gmail.com", subject: "s", html: "h", text: "t" })).rejects.toBeInstanceOf(MailConfigError);
  });
});
