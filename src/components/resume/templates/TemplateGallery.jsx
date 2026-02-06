import React from "react";

// Map gallery titles to our internal renderers
const templateMap = {
  "Double Column": "modern",
  "Ivy League": "classic",
  "Elegant": "modern",
  "Contemporary": "modern",
  "Polished": "modern",
  "Timeline": "classic",
  "Creative": "modern",
  "Stylish": "minimal",
  "Double Column with Logos": "modern",
  "Multicolumn": "modern",
  "High Performer": "classic",
  "Professional": "modern",
  "Prime ATS": "classic",
  "Pure ATS": "minimal"
};

const items = [
  { title: "Double Column", description: "Two-column layout with achievements sidebar.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/f65cbec43_image.png" },
  { title: "Ivy League", description: "Classic, academic-friendly structure.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/e5945f53a_image.png" },
  { title: "Elegant", description: "Right-side highlight panel, clean body.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a7a6d4c9f_image.png" },
  { title: "Contemporary", description: "Bold shapes with modern accents.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5580ae388_image.png" },
  { title: "Polished", description: "Presentation-first with strong sidebar.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/afb8d1077_image.png" },
  { title: "Timeline", description: "Reverse-chronological focus with milestones.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/c23fc873e_image.png" },
  { title: "Creative", description: "Invites recruiters to explore your story.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/4054d040b_image.png" },
  { title: "Stylish", description: "Modern design with professional readability.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/9bbd69d81_image.png" },
  { title: "Double Column with Logos", description: "Brand-forward experience with logos.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/33ea95db7_image.png" },
  { title: "Multicolumn", description: "Three-column layout for dense content.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/5d93e0503_image.png" },
  { title: "High Performer", description: "Data-driven sections with visual highlights.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/29f6917be_image.png" },
  { title: "Professional", description: "Organized with a strong sidebar color band.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/884477b83_image.png" },
  { title: "Prime ATS", description: "ATS-friendly with balanced sections.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/f568e91e6_image.png" },
  { title: "Pure ATS", description: "Minimalist and fully ATS-optimized.", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/4773048e3_image.png" }
];

export default function TemplateGallery({ onPick }) {
  const handlePick = (title) => {
    const slug = templateMap[title] || "classic";
    if (onPick) onPick(slug);
  };

  return (
    <section className="mt-10">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-slate-800">Template Inspiration</h2>
        <p className="text-slate-600">Click a style to apply a similar layout to your resume above.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handlePick(item.title)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePick(item.title); }}
            className="text-left rounded-xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="p-4">
              <div className="font-semibold text-slate-800">{item.title}</div>
              <div className="text-sm text-slate-600 mt-1">{item.description}</div>
              <div className="mt-3 inline-flex items-center text-blue-700 text-sm font-medium">Apply this style →</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}