"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Save, CheckCircle, MapPin } from "lucide-react";
import { NEIGHBORHOOD_MAP } from "@/lib/neighborhoods";

type District = Record<string, string>;
type ZoningData = {
  districts: Record<string, District>;
  neighborhoodDistricts: Record<string, string[]>;
};

const DISTRICT_FIELDS = [
  { key: "name", label: "District Name", placeholder: "e.g., Residential 1" },
  { key: "minLotSize", label: "Min Lot Size", placeholder: "e.g., 5,000 sq ft" },
  { key: "maxGroundCover", label: "Max Ground Cover", placeholder: "e.g., 30%" },
  { key: "maxHeight", label: "Max Height", placeholder: "e.g., 30 ft" },
  { key: "frontSetback", label: "Front Setback", placeholder: "e.g., 10 ft" },
  { key: "sideSetback", label: "Side Setback", placeholder: "e.g., 6 ft" },
  { key: "rearSetback", label: "Rear Setback", placeholder: "e.g., 15 ft" },
  { key: "hdcScrutiny", label: "HDC Scrutiny", placeholder: "Low / Moderate / High / Very High" },
  { key: "typicalPermitLag", label: "Typical Permit Lag", placeholder: "e.g., 3-6 months" },
  { key: "notes", label: "Notes", placeholder: "Description and context..." },
];

const inputClass = "w-full px-3 py-2 rounded-md border border-[var(--cedar-shingle)]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--privet-green)] bg-white";

export default function AdminZoningPage() {
  const [data, setData] = useState<ZoningData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [editingDistrict, setEditingDistrict] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<District>({});
  const [newCode, setNewCode] = useState("");
  const [tab, setTab] = useState<"districts" | "assignments">("districts");

  const fetchData = async () => {
    setIsLoading(true);
    const res = await fetch("/api/admin/zoning");
    const json = await res.json();
    setData(json);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const saveDistrict = async (code: string) => {
    setSaving(code);
    await fetch("/api/admin/zoning", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, district: editForm }),
    });
    setSaving(null);
    setSaved(code);
    setTimeout(() => setSaved(null), 2000);
    setEditingDistrict(null);
    fetchData();
  };

  const deleteDistrict = async (code: string) => {
    if (!confirm(`Delete district ${code}? This will also remove it from all neighborhood assignments.`)) return;

    // Optimistic update
    if (data) {
      const { [code]: _, ...remainingDistricts } = data.districts;
      const updatedNeighborhoods = { ...data.neighborhoodDistricts };
      for (const [name, codes] of Object.entries(updatedNeighborhoods)) {
        updatedNeighborhoods[name] = codes.filter((d) => d !== code);
      }
      setData({ districts: remainingDistricts, neighborhoodDistricts: updatedNeighborhoods });
    }

    await fetch("/api/admin/zoning", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
  };

  const toggleNeighborhoodDistrict = async (neighborhood: string, districtCode: string) => {
    if (!data) return;
    const current = data.neighborhoodDistricts[neighborhood] ?? [];
    const updated = current.includes(districtCode)
      ? current.filter((d) => d !== districtCode)
      : [...current, districtCode];

    // Optimistic update — instant UI feedback
    setData({
      ...data,
      neighborhoodDistricts: {
        ...data.neighborhoodDistricts,
        [neighborhood]: updated,
      },
    });

    // Persist to server
    await fetch("/api/admin/zoning", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ neighborhood, districts: updated }),
    });
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-[var(--sandstone)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--nantucket-gray)]" />
      </div>
    );
  }

  const districtCodes = Object.keys(data.districts).sort();

  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      <section className="bg-[var(--atlantic-navy)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-white/40 text-xs uppercase tracking-wider font-sans mb-1">Admin</p>
          <h1 className="text-white text-2xl sm:text-3xl">Zoning Districts &amp; Assignments</h1>
          <p className="text-white/50 mt-1 text-sm">Define district rules and assign one or more districts to each neighborhood.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white border border-[var(--cedar-shingle)]/15 p-1 rounded-lg mb-6 w-fit">
          <button onClick={() => setTab("districts")} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${tab === "districts" ? "bg-[var(--privet-green)] text-white" : "text-[var(--atlantic-navy)]/60 hover:bg-[var(--sandstone)]"}`}>
            Districts
          </button>
          <button onClick={() => setTab("assignments")} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${tab === "assignments" ? "bg-[var(--privet-green)] text-white" : "text-[var(--atlantic-navy)]/60 hover:bg-[var(--sandstone)]"}`}>
            Neighborhood Assignments
          </button>
        </div>

        {/* Districts Tab */}
        {tab === "districts" && (
          <div className="space-y-4">
            {districtCodes.map((code) => {
              const district = data.districts[code];
              const isEditing = editingDistrict === code;

              return (
                <div key={code} className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 bg-[var(--sandstone)]/50">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[var(--atlantic-navy)] font-mono">{code}</span>
                      <span className="text-sm text-[var(--nantucket-gray)]">{district.name}</span>
                      {saved === code && <CheckCircle className="w-4 h-4 text-[var(--privet-green)]" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (isEditing) { setEditingDistrict(null); } else { setEditingDistrict(code); setEditForm({ ...district }); }
                        }}
                        className="text-xs font-medium text-[var(--atlantic-navy)] hover:text-[var(--privet-green)] transition-colors"
                      >
                        {isEditing ? "Cancel" : "Edit"}
                      </button>
                      <button onClick={() => deleteDistrict(code)} className="text-xs text-red-500 hover:text-red-700">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="p-5 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {DISTRICT_FIELDS.map((field) => (
                          <div key={field.key}>
                            <label className="block text-xs font-medium text-[var(--atlantic-navy)]/60 mb-1 font-sans">{field.label}</label>
                            {field.key === "notes" ? (
                              <textarea
                                value={editForm[field.key] ?? ""}
                                onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                                placeholder={field.placeholder}
                                className={inputClass + " min-h-[60px]"}
                              />
                            ) : (
                              <input
                                type="text"
                                value={editForm[field.key] ?? ""}
                                onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                                placeholder={field.placeholder}
                                className={inputClass}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => saveDistrict(code)}
                        disabled={saving === code}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--privet-green)] text-white text-sm font-medium rounded-md hover:bg-[var(--privet-green)]/90 disabled:opacity-50"
                      >
                        {saving === code ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save
                      </button>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-[var(--nantucket-gray)]">
                      <span>Lot: {district.minLotSize}</span>
                      <span>Cover: {district.maxGroundCover}</span>
                      <span>Height: {district.maxHeight}</span>
                      <span>HDC: {district.hdcScrutiny}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add New District */}
            <div className="bg-white rounded-lg border border-dashed border-[var(--cedar-shingle)]/30 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--atlantic-navy)]/50 mb-3 font-sans">Add New District</p>
              <div className="flex items-end gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--atlantic-navy)]/60 mb-1 font-sans">District Code</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="e.g., R-10"
                    className={inputClass + " w-32"}
                  />
                </div>
                <button
                  onClick={() => {
                    if (!newCode) return;
                    setEditingDistrict(newCode);
                    setEditForm({ name: "" });
                    setData({ ...data, districts: { ...data.districts, [newCode]: { name: "" } } });
                    setNewCode("");
                  }}
                  className="flex items-center gap-1 px-4 py-2 bg-[var(--atlantic-navy)] text-white text-sm font-medium rounded-md hover:bg-[var(--atlantic-navy)]/90"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assignments Tab */}
        {tab === "assignments" && (
          <div className="space-y-4">
            <p className="text-xs text-[var(--nantucket-gray)] mb-2">
              Check the districts that apply to each neighborhood. Most neighborhoods have one primary district, but some span multiple zones.
            </p>
            {Object.entries(NEIGHBORHOOD_MAP).map(([slug, displayName]) => {
              const assigned = data.neighborhoodDistricts[displayName] ?? [];
              return (
                <div key={slug} className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-[var(--privet-green)]" />
                    <h3 className="text-sm font-semibold text-[var(--atlantic-navy)] font-sans">{displayName}</h3>
                    <span className="text-xs text-[var(--nantucket-gray)]">
                      {assigned.length === 0 ? "No districts assigned" : assigned.join(", ")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {districtCodes.map((code) => {
                      const isAssigned = assigned.includes(code);
                      return (
                        <button
                          key={code}
                          onClick={() => toggleNeighborhoodDistrict(displayName, code)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                            isAssigned
                              ? "bg-[var(--privet-green)] text-white border-[var(--privet-green)]"
                              : "bg-white text-[var(--atlantic-navy)]/60 border-[var(--cedar-shingle)]/20 hover:border-[var(--privet-green)]/50"
                          }`}
                        >
                          {code}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
