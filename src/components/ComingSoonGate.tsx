"use client";

import { useState, FormEvent } from "react";

export function ComingSoonGate() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password === "congdon1931") {
      document.cookie =
        "site_access=granted; path=/; max-age=" + 60 * 60 * 24 * 30;
      window.location.href = "/";
    } else {
      setError(true);
      setPassword("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xs mx-auto">
      <label
        htmlFor="site-password"
        className="block text-xs font-semibold uppercase tracking-wider text-white/40 font-sans mb-2"
      >
        Enter Password
      </label>
      <div className="flex gap-2">
        <input
          id="site-password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          placeholder="Password"
          className="flex-1 rounded-md border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[var(--privet-green)] focus:ring-1 focus:ring-[var(--privet-green)] outline-none transition-colors"
          autoComplete="off"
        />
        <button
          type="submit"
          className="px-5 py-2.5 text-sm font-medium text-white bg-[var(--privet-green)] hover:bg-[var(--privet-green)]/80 rounded-md transition-colors"
        >
          Enter
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-400">
          Incorrect password. Please try again.
        </p>
      )}
    </form>
  );
}
