"use client";

import React from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function VideoUpload() {
  const [file, setFile] = React.useState<File | null>(null);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const router = useRouter();

  // file size
  const MAX_FILE_SIZE = 80 * 1024 * 1024; // 80MB

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert("File size exceeds the maximum limit of 80MB.");
      return;
    }

    setIsUploading(true);
    const formdata = new FormData();
    formdata.append("file", file);
    formdata.append("title", title);
    formdata.append("description", description);
    formdata.append("originalSize", file.size.toString());

    try {
      const response = await axios.post("/api/video-upload", formdata);
    } catch (error) {
      console.error("Error uploading video:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Upload Video</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">
            <span className="label-text">Title</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input input-bordered w-full"
            required
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">Description</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="textarea textarea-bordered w-full"
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">Video File</span>
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="file-input file-input-bordered w-full"
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Upload Video"}
        </button>
      </form>
    </div>
  );
}
