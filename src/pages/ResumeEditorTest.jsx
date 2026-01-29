import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function ResumeEditorTest() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [resume, setResume] = useState(null);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const resumeId = searchParams.get("resumeId");
    
    setDebugInfo({
      resumeId,
      fullURL: window.location.href,
      searchString: window.location.search,
      allParams: Object.fromEntries(searchParams)
    });

    console.log("=== RESUME EDITOR DEBUG ===");
    console.log("Resume ID:", resumeId);
    console.log("Full URL:", window.location.href);
    console.log("Search string:", window.location.search);
    console.log("All params:", Object.fromEntries(searchParams));

    if (!resumeId) {
      setError("No resumeId in URL parameters");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        console.log("Attempting to fetch resume with ID:", resumeId);
        const r = await base44.entities.Resume.get(resumeId);
        console.log("Resume fetched successfully:", r);
        setResume(r);
      } catch (e) {
        console.error("Error fetching resume:", e);
        setError(`Failed to load resume: ${e.message}`);
      }
      setLoading(false);
    })();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Resume Editor - Debug Mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-100 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Debug Information:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="text-red-800 font-semibold">Error:</p>
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {resume && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">✅ Resume Loaded Successfully!</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>ID:</strong> {resume.id}</p>
                  <p><strong>Name:</strong> {resume.version_name}</p>
                  <p><strong>Master:</strong> {resume.is_master_resume ? "Yes" : "No"}</p>
                  <p><strong>Created:</strong> {resume.created_date}</p>
                </div>
                <div className="mt-4">
                  <p className="text-green-700 font-medium">
                    If you see this, the resume is loading correctly!
                  </p>
                </div>
              </div>
            )}

            <Button 
              onClick={() => navigate(createPageUrl("MyResumes"))} 
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to My Resumes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}