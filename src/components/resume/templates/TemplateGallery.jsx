import React, { useMemo, useState } from "react";

// Map gallery titles to unique template slugs
const templateMap = {
  "Double Column": "double-column",
  "Ivy League": "ivy-league",
  "Elegant": "elegant",
  "Contemporary": "contemporary",
  "Polished": "polished",
  "Timeline": "timeline",
  "Creative": "creative",
  "Stylish": "stylish",
  "Double Column with Logos": "double-column-logos",
  "Multicolumn": "multicolumn",
  "High Performer": "high-performer",
  "Professional": "professional",
  "Prime ATS": "prime-ats",
  "Pure ATS": "pure-ats"
};

export const DEFAULT_TEMPLATES = [
  { id: "double-column", title: "Double Column", description: "Two-column layout with achievements sidebar.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/f65cbec43_image.png" },
  { id: "ivy-league", title: "Ivy League", description: "Classic, academic-friendly structure.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/e5945f53a_image.png" },
  { id: "elegant", title: "Elegant", description: "Right-side highlight panel, clean body.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a7a6d4c9f_image.png" },
  { id: "contemporary", title: "Contemporary", description: "Bold shapes with modern accents.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5580ae388_image.png" },
  { id: "polished", title: "Polished", description: "Presentation-first with strong sidebar.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/afb8d1077_image.png" },
  { id: "timeline", title: "Timeline", description: "Reverse-chronological focus with milestones.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/c23fc873e_image.png" },
  { id: "creative", title: "Creative", description: "Invites recruiters to explore your story.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/4054d040b_image.png" },
  { id: "stylish", title: "Stylish", description: "Modern design with professional readability.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/9bbd69d81_image.png" },
  { id: "double-column-logos", title: "Double Column with Logos", description: "Brand-forward experience with logos.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/33ea95db7_image.png" },
  { id: "multicolumn", title: "Multicolumn", description: "Three-column layout for dense content.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/5d93e0503_image.png" },
  { id: "high-performer", title: "High Performer", description: "Data-driven sections with visual highlights.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/29f6917be_image.png" },
  { id: "professional", title: "Professional", description: "Organized with a strong sidebar color band.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/884477b83_image.png" },
  { id: "prime-ats", title: "Prime ATS", description: "ATS-friendly with balanced sections.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/f568e91e6_image.png" },
  { id: "pure-ats", title: "Pure ATS", description: "Minimalist and fully ATS-optimized.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/4773048e3_image.png" }
];

export default function TemplateGallery({ onPick, items = DEFAULT_TEMPLATES, showAdminControls = false, onAdd, onDelete }) {
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [localError, setLocalError] = useState("");

  const safeItems = useMemo(() => items || [], [items]);

  const handlePick = (title) => {
    const slug = templateMap[title] || "classic";
    if (onPick) onPick(slug);
  };

  const downloadImage = async (item, format = "png") => {
    const safeName = (item.title || "template").replace(/[\\/:*?"<>|]/g, "_");
    const filename = `${safeName}.${format}`;

    try {
      const response = await fetch(item.url, { mode: "cors" });
      const blob = await response.blob();

      if (format === "jpg" || format === "jpeg") {
        const img = new Image();
        const objectUrl = URL.createObjectURL(blob);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        await new Promise((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = objectUrl;
        });
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const jpgBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
        URL.revokeObjectURL(objectUrl);
        const url = URL.createObjectURL(jpgBlob || blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      const a = document.createElement("a");
      a.href = item.url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  const handleAddTemplate = () => {
    setLocalError("");
    if (!newTitle.trim() || !newUrl.trim()) {
      setLocalError("Title and image URL are required.");
      return;
    }
    if (onAdd) {
      onAdd({
        id: `custom-${Date.now()}`,
        title: newTitle.trim(),
        description: newDescription.trim() || "Custom template",
        url: newUrl.trim()
      });
      setNewTitle("");
      setNewDescription("");
      setNewUrl("");
    }
  };

  return (
    <section className="mt-10">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-slate-800">Template Inspiration</h2>
        <p className="text-slate-600">Click a style to apply a similar layout to your resume above.</p>
      </div>
      {showAdminControls && (
        <div className="mb-6 border rounded-xl p-4 bg-slate-50">
          <div className="font-semibold text-slate-800 mb-2">Admin: Manage Templates</div>
          {localError && <div className="text-xs text-red-600 mb-2">{localError}</div>}
          <div className="grid gap-2 md:grid-cols-3">
            <input
              className="border rounded px-3 py-2 text-sm"
              placeholder="Template title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <input
              className="border rounded px-3 py-2 text-sm"
              placeholder="Image URL (PNG/JPG)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
            />
            <input
              className="border rounded px-3 py-2 text-sm"
              placeholder="Short description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>
          <div className="mt-3">
            <button
              onClick={handleAddTemplate}
              className="inline-flex items-center px-3 py-2 rounded bg-slate-800 text-white text-sm"
            >
              Add Template
            </button>
          </div>
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {safeItems.map((item) => (
          <div
            key={item.id || item.title}
            className="text-left rounded-xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <button
              onClick={() => handlePick(item.title)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePick(item.title); }}
              className="w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={`Apply ${item.title} template`}
            >
              <div className="aspect-[3/4] w-full bg-slate-100 overflow-hidden">
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </button>
            <div className="p-4">
              <div className="font-semibold text-slate-800">{item.title}</div>
              <div className="text-sm text-slate-600 mt-1">{item.description}</div>
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <button
                  onClick={() => handlePick(item.title)}
                  className="text-blue-700 text-sm font-medium"
                >
                  Apply this style →
                </button>
                <button
                  onClick={() => downloadImage(item, "png")}
                  className="text-slate-700 text-xs border rounded px-2 py-1"
                >
                  Download PNG
                </button>
                <button
                  onClick={() => downloadImage(item, "jpg")}
                  className="text-slate-700 text-xs border rounded px-2 py-1"
                >
                  Download JPG
                </button>
                {showAdminControls && (
                  <button
                    onClick={() => onDelete && onDelete(item)}
                    className="text-red-600 text-xs border border-red-200 rounded px-2 py-1"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}