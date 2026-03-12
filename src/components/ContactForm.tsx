import { useState } from "react";
import type { FormEvent } from "react";

const FORMSPREE_ID = "xzdjewne";

export default function ContactForm() {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    const form = e.currentTarget;
    const data = new FormData(form);

    const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      setStatus("success");
      form.reset();
    } else {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="text-[var(--color-accent)]">Thanks! I'll be in touch.</p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 w-full max-w-md"
    >
      <input
        type="text"
        name="name"
        placeholder="Your name"
        required
        className="bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-md px-4 py-2 text-white placeholder:text-neutral-500 focus:outline-none focus:border-[var(--color-accent)]/50 focus:shadow-[0_0_10px_rgba(251,146,60,0.1)] transition-all"
      />
      <input
        type="email"
        name="email"
        placeholder="Your email"
        required
        className="bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-md px-4 py-2 text-white placeholder:text-neutral-500 focus:outline-none focus:border-[var(--color-accent)]/50 focus:shadow-[0_0_10px_rgba(251,146,60,0.1)] transition-all"
      />
      <textarea
        name="message"
        placeholder="Tell me about your idea"
        rows={4}
        required
        className="bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-md px-4 py-2 text-white placeholder:text-neutral-500 focus:outline-none focus:border-[var(--color-accent)]/50 focus:shadow-[0_0_10px_rgba(251,146,60,0.1)] transition-all resize-none"
      />
      <button
        type="submit"
        disabled={status === "submitting"}
        className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-rose)] text-white font-semibold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer cta-glow"
      >
        {status === "submitting" ? "Sending..." : "Send message"}
      </button>
      {status === "error" && (
        <p className="text-red-400 text-sm">
          Something went wrong. Try again or email me directly.
        </p>
      )}
    </form>
  );
}
