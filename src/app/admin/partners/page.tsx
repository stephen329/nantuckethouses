"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Plus, Trash2, Save, GripVertical, Upload } from "lucide-react";
import Link from "next/link";
import type { Partner } from "@/types";

const EMPTY_PARTNER: Partner = {
  id: "",
  name: "",
  tagline: "",
  description: "",
  ctaText: "Learn More",
  ctaLink: "",
  featured: false,
  category: "real-estate",
};

export default function PartnersAdmin() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/partners")
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load partners: ${r.status}`);
        return r.json();
      })
      .then(setPartners)
      .catch((err) => setMessage(`Error loading partners: ${err.message}`))
      .finally(() => setLoading(false));
  }, []);

  function update(index: number, patch: Partial<Partner>) {
    setPartners((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...patch } : p))
    );
    setDirty(true);
  }

  function addPartner() {
    const id = `partner-${Date.now()}`;
    setPartners((prev) => [...prev, { ...EMPTY_PARTNER, id }]);
    setDirty(true);
  }

  function removePartner(index: number) {
    setPartners((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  }

  const [uploading, setUploading] = useState<number | null>(null);
  const fileInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  async function handleImageUpload(index: number, file: File) {
    setUploading(index);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Upload failed");
        return;
      }
      update(index, { image: data.url });
      setMessage("");
    } catch {
      setMessage("Upload failed. Check the console.");
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/partners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partners),
      });
      if (!res.ok) throw new Error("Save failed");
      setDirty(false);
      setMessage("Saved successfully. Changes will appear after page reload / redeploy.");
    } catch {
      setMessage("Error saving. Check the console.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      {/* Header */}
      <section className="bg-[var(--atlantic-navy)] py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-white/50 hover:text-white/80 text-xs mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin
          </Link>
          <h1 className="text-white text-2xl sm:text-3xl">Partners & Initiatives</h1>
          <p className="text-white/50 mt-1 text-sm">
            Manage featured partners displayed across the site.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {loading && (
          <p className="text-sm text-[var(--nantucket-gray)]">Loading partners...</p>
        )}

        {/* Partner cards */}
        {partners.map((partner, i) => (
          <div
            key={partner.id}
            className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-[var(--nantucket-gray)]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--nantucket-gray)] font-sans">
                  Partner {i + 1}
                </span>
                {partner.featured && (
                  <span className="text-[10px] bg-[var(--privet-green)]/10 text-[var(--privet-green)] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Featured
                  </span>
                )}
              </div>
              <button
                onClick={() => removePartner(i)}
                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Remove partner"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-[var(--atlantic-navy)]/60 uppercase tracking-wider font-sans mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={partner.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  className="w-full rounded-md border border-[var(--cedar-shingle)]/20 px-3 py-2 text-sm text-[var(--atlantic-navy)] focus:border-[var(--privet-green)] focus:ring-1 focus:ring-[var(--privet-green)] outline-none"
                />
              </div>

              {/* ID */}
              <div>
                <label className="block text-xs font-semibold text-[var(--atlantic-navy)]/60 uppercase tracking-wider font-sans mb-1">
                  ID (slug)
                </label>
                <input
                  type="text"
                  value={partner.id}
                  onChange={(e) => update(i, { id: e.target.value })}
                  className="w-full rounded-md border border-[var(--cedar-shingle)]/20 px-3 py-2 text-sm text-[var(--atlantic-navy)] font-mono focus:border-[var(--privet-green)] focus:ring-1 focus:ring-[var(--privet-green)] outline-none"
                />
              </div>

              {/* Tagline */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--atlantic-navy)]/60 uppercase tracking-wider font-sans mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={partner.tagline}
                  onChange={(e) => update(i, { tagline: e.target.value })}
                  className="w-full rounded-md border border-[var(--cedar-shingle)]/20 px-3 py-2 text-sm text-[var(--atlantic-navy)] focus:border-[var(--privet-green)] focus:ring-1 focus:ring-[var(--privet-green)] outline-none"
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--atlantic-navy)]/60 uppercase tracking-wider font-sans mb-1">
                  Description
                </label>
                <textarea
                  value={partner.description}
                  onChange={(e) => update(i, { description: e.target.value })}
                  rows={3}
                  className="w-full rounded-md border border-[var(--cedar-shingle)]/20 px-3 py-2 text-sm text-[var(--atlantic-navy)] focus:border-[var(--privet-green)] focus:ring-1 focus:ring-[var(--privet-green)] outline-none resize-y"
                />
              </div>

              {/* CTA Text */}
              <div>
                <label className="block text-xs font-semibold text-[var(--atlantic-navy)]/60 uppercase tracking-wider font-sans mb-1">
                  CTA Text
                </label>
                <input
                  type="text"
                  value={partner.ctaText}
                  onChange={(e) => update(i, { ctaText: e.target.value })}
                  className="w-full rounded-md border border-[var(--cedar-shingle)]/20 px-3 py-2 text-sm text-[var(--atlantic-navy)] focus:border-[var(--privet-green)] focus:ring-1 focus:ring-[var(--privet-green)] outline-none"
                />
              </div>

              {/* CTA Link */}
              <div>
                <label className="block text-xs font-semibold text-[var(--atlantic-navy)]/60 uppercase tracking-wider font-sans mb-1">
                  CTA Link
                </label>
                <input
                  type="text"
                  value={partner.ctaLink}
                  onChange={(e) => update(i, { ctaLink: e.target.value })}
                  placeholder="/page or https://..."
                  className="w-full rounded-md border border-[var(--cedar-shingle)]/20 px-3 py-2 text-sm text-[var(--atlantic-navy)] focus:border-[var(--privet-green)] focus:ring-1 focus:ring-[var(--privet-green)] outline-none"
                />
              </div>

              {/* External URL */}
              <div>
                <label className="block text-xs font-semibold text-[var(--atlantic-navy)]/60 uppercase tracking-wider font-sans mb-1">
                  External URL (optional)
                </label>
                <input
                  type="text"
                  value={partner.externalUrl || ""}
                  onChange={(e) =>
                    update(i, {
                      externalUrl: e.target.value || undefined,
                    })
                  }
                  placeholder="https://example.org"
                  className="w-full rounded-md border border-[var(--cedar-shingle)]/20 px-3 py-2 text-sm text-[var(--atlantic-navy)] focus:border-[var(--privet-green)] focus:ring-1 focus:ring-[var(--privet-green)] outline-none"
                />
              </div>

              {/* Image */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--atlantic-navy)]/60 uppercase tracking-wider font-sans mb-1">
                  Image / Logo
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={partner.image || ""}
                    onChange={(e) =>
                      update(i, {
                        image: e.target.value || undefined,
                      })
                    }
                    placeholder="/images/partner-logo.png or https://..."
                    className="flex-1 rounded-md border border-[var(--cedar-shingle)]/20 px-3 py-2 text-sm text-[var(--atlantic-navy)] focus:border-[var(--privet-green)] focus:ring-1 focus:ring-[var(--privet-green)] outline-none"
                  />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    ref={(el) => {
                      if (el) fileInputRefs.current.set(i, el);
                    }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(i, file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current.get(i)?.click()}
                    disabled={uploading === i}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[var(--privet-green)] border border-[var(--privet-green)]/30 rounded-md hover:bg-[var(--privet-green)]/5 disabled:opacity-50 transition-colors shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {uploading === i ? "Uploading..." : "Upload"}
                  </button>
                </div>
                {partner.image && (
                  <div className="mt-2 p-3 bg-[var(--sandstone)] rounded-md flex items-center gap-3">
                    <img
                      src={partner.image}
                      alt={partner.name}
                      className="max-h-16 object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => update(i, { image: undefined })}
                      className="text-xs text-red-400 hover:text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-[var(--atlantic-navy)]/60 uppercase tracking-wider font-sans mb-1">
                  Category
                </label>
                <select
                  value={partner.category}
                  onChange={(e) =>
                    update(i, {
                      category: e.target.value as Partner["category"],
                    })
                  }
                  className="w-full rounded-md border border-[var(--cedar-shingle)]/20 px-3 py-2 text-sm text-[var(--atlantic-navy)] focus:border-[var(--privet-green)] focus:ring-1 focus:ring-[var(--privet-green)] outline-none"
                >
                  <option value="housing">Housing</option>
                  <option value="real-estate">Real Estate</option>
                  <option value="development">Development</option>
                </select>
              </div>

              {/* Featured toggle */}
              <div className="flex items-center gap-3 sm:col-span-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={partner.featured}
                    onChange={(e) => update(i, { featured: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[var(--nantucket-gray)]/30 peer-focus:outline-none rounded-full peer peer-checked:bg-[var(--privet-green)] transition-colors after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
                <span className="text-sm text-[var(--atlantic-navy)]">
                  Featured (show hero banner)
                </span>
              </div>

              {/* Stephen's Note */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--atlantic-navy)]/60 uppercase tracking-wider font-sans mb-1">
                  Stephen&apos;s Note (optional)
                </label>
                <textarea
                  value={partner.stephenNote || ""}
                  onChange={(e) =>
                    update(i, {
                      stephenNote: e.target.value || undefined,
                    })
                  }
                  rows={2}
                  placeholder="Personal note shown in the Featured Partner banner..."
                  className="w-full rounded-md border border-[var(--cedar-shingle)]/20 px-3 py-2 text-sm text-[var(--atlantic-navy)] focus:border-[var(--privet-green)] focus:ring-1 focus:ring-[var(--privet-green)] outline-none resize-y"
                />
              </div>
            </div>
          </div>
        ))}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={addPartner}
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--privet-green)] hover:text-[var(--privet-green)]/80 border border-[var(--privet-green)]/30 hover:border-[var(--privet-green)]/50 px-4 py-2.5 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Partner
          </button>

          <button
            onClick={save}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-2 text-sm font-medium text-white bg-[var(--privet-green)] hover:bg-[var(--privet-green)]/90 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 rounded-md transition-colors"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {message && (
          <p
            className={`text-sm ${message.includes("Error") ? "text-red-600" : "text-[var(--privet-green)]"}`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
