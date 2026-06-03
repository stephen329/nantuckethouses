"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, CheckCircle, FileText, Copy, Save, Eye } from "lucide-react";

type ProcessResult = {
  mdxContent: string;
  meetingDate: string;
  boardType: string;
  filename: string;
  pdfTextLength: number;
};

export default function AdminImportPage() {
  const [boardType, setBoardType] = useState("hdc-morning-after");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [publishStatus, setPublishStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setPublishStatus("idle");

    try {
      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("boardType", boardType);

      const res = await fetch("/api/admin/process-minutes", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Processing failed");

      setResult(data);
      setEditedContent(data.mdxContent);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublish = async () => {
    if (!result) return;
    setPublishStatus("saving");

    try {
      const res = await fetch("/api/admin/publish-recap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mdxContent: editedContent,
          boardType: result.boardType,
          filename: result.filename,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Publish failed");

      setPublishStatus("saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
      setPublishStatus("error");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedContent);
  };

  const boardLabels: Record<string, string> = {
    "hdc-morning-after": "HDC Morning After",
    "planning-board": "Planning Board Summary",
    "zoning-board": "Zoning Board Summary",
  };

  return (
    <div className="min-h-screen bg-[var(--sandstone)]">
      {/* Header */}
      <section className="bg-[var(--atlantic-navy)] py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-white/40 text-xs uppercase tracking-wider font-sans mb-1">
            Admin Tool
          </p>
          <h1 className="text-white text-2xl sm:text-3xl">Import Board Minutes</h1>
          <p className="text-white/50 mt-2 text-sm">
            Upload a PDF of board meeting minutes. AI will generate an MDX recap
            for the Regulatory Hub. Review, edit, and publish.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Form */}
        <form onSubmit={handleUpload} className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--atlantic-navy)]/60 mb-2 font-sans">
                Board Type
              </label>
              <select
                value={boardType}
                onChange={(e) => setBoardType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-md border border-[var(--cedar-shingle)]/20 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--privet-green)]"
              >
                <option value="hdc-morning-after">HDC Morning After</option>
                <option value="planning-board">Planning Board Summary</option>
                <option value="zoning-board">Zoning Board Summary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--atlantic-navy)]/60 mb-2 font-sans">
                Minutes PDF
              </label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                required
                className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[var(--privet-green)] file:text-white hover:file:bg-[var(--privet-green)]/90"
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[var(--privet-green)] text-white text-sm font-medium rounded-md hover:bg-[var(--privet-green)]/90 transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Process PDF
                </>
              )}
            </button>
          </div>

          {isProcessing && (
            <div className="mt-4 p-3 bg-[var(--sandstone)] rounded-md text-xs text-[var(--atlantic-navy)]/60">
              Extracting text from PDF and generating recap via AI... This may take 15-30 seconds.
            </div>
          )}
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <>
            {/* Meta Info */}
            <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-[var(--nantucket-gray)] font-sans">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  {boardLabels[result.boardType]}
                </span>
                <span>Date: {result.meetingDate}</span>
                <span>File: {result.filename}</span>
                <span>PDF text: {result.pdfTextLength.toLocaleString()} chars</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[var(--atlantic-navy)] bg-[var(--sandstone)] rounded-md hover:bg-[var(--cedar-shingle)]/15 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
                <button
                  onClick={handlePublish}
                  disabled={publishStatus === "saving" || publishStatus === "saved"}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[var(--privet-green)] rounded-md hover:bg-[var(--privet-green)]/90 transition-colors disabled:opacity-50"
                >
                  {publishStatus === "saving" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : publishStatus === "saved" ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <Save className="w-3 h-3" />
                  )}
                  {publishStatus === "saved" ? "Published" : publishStatus === "saving" ? "Saving..." : "Publish"}
                </button>
              </div>
            </div>

            {publishStatus === "saved" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-sm text-green-700">
                Recap published to <code className="bg-green-100 px-1 rounded">src/content/{result.boardType}/{result.filename}</code>.
                Commit and push to deploy, or view at <a href={`/regulatory/${result.boardType === "hdc-morning-after" ? "hdc-morning-after" : result.boardType}/${result.meetingDate}`} className="underline font-medium">/regulatory/{result.boardType}/{result.meetingDate}</a>.
              </div>
            )}

            {/* Editable MDX Content */}
            <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 overflow-hidden">
              <div className="bg-[var(--atlantic-navy)] px-4 py-2 flex items-center justify-between">
                <span className="text-white/70 text-xs font-mono">
                  {result.filename}
                </span>
                <span className="text-white/40 text-xs font-sans">
                  Edit below before publishing
                </span>
              </div>
              <textarea
                value={editedContent}
                onChange={(e) => {
                  setEditedContent(e.target.value);
                  setPublishStatus("idle");
                }}
                className="w-full h-[600px] p-4 font-mono text-xs text-[var(--atlantic-navy)] bg-white border-0 focus:outline-none resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>
          </>
        )}

        {/* Instructions */}
        {!result && !isProcessing && (
          <div className="bg-white rounded-lg border border-[var(--cedar-shingle)]/15 p-6">
            <h3 className="text-sm font-semibold text-[var(--atlantic-navy)] mb-3 font-sans">
              How it works
            </h3>
            <ol className="space-y-2 text-sm text-[var(--atlantic-navy)]/70 list-decimal list-inside">
              <li>Upload a PDF of board meeting minutes (HDC, Planning Board, or ZBA)</li>
              <li>AI extracts the text and generates a structured MDX recap with frontmatter</li>
              <li>Review and edit the generated content — adjust Stephen&apos;s insider note, fix any details</li>
              <li>Click &ldquo;Publish&rdquo; to save to the content directory</li>
              <li>Commit and push to deploy the recap live on the site</li>
            </ol>
            <p className="mt-4 text-xs text-[var(--nantucket-gray)]">
              Tip: Always review the AI-generated &ldquo;insiderNote&rdquo; — it should sound like Stephen, not a robot.
              Edit it to add your genuine take on the meeting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
