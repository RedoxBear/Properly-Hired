import React, { useCallback } from "react";
import { Upload, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CSVUploadZone({ onFilesSelected, disabled }) {
  const fileInputRef = React.useRef(null);
  const folderInputRef = React.useRef(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleFiles = useCallback((fileList) => {
    const csvFiles = Array.from(fileList).filter(
      f => f.name.toLowerCase().endsWith(".csv")
    );
    if (csvFiles.length > 0) {
      onFilesSelected(csvFiles);
    }
  }, [onFilesSelected]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  }, [handleFiles, disabled]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
        isDragging ? "border-blue-400 bg-blue-50/50 dark:bg-blue-950/20" :
        "border-border hover:border-blue-300"
      } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
    >
      <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
      <p className="font-medium text-foreground mb-1">
        Drop O*NET CSV files here
      </p>
      <p className="text-xs text-muted-foreground mb-4">
        Supports all 40 O*NET 30.1 individual files, including split parts
      </p>
      <div className="flex gap-2 justify-center">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <Upload className="w-3.5 h-3.5 mr-1.5" />
          Choose Files
        </Button>
        <input
          ref={folderInputRef}
          type="file"
          multiple
          webkitdirectory="true"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => folderInputRef.current?.click()}
          disabled={disabled}
        >
          <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
          Choose Folder
        </Button>
      </div>
    </div>
  );
}