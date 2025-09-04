"use client";
import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import FileList from "@/components/fileList";
import FileUpload from "@/components/fileUpload";

const FileUploadUI = () => {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [pageLoading, setPageLoading] = useState(false);

  const computeSHA256 = async (file) => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex;
  };

  useEffect(() => {
    setPageLoading(true);
  }, []);
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch("/api/s3-presign");
        const data = await response.json();
        console.log(data);
        setFiles(data.success.files);
        if (data.success.files) {
          setPageLoading(false);
        }
      } catch (error) {
        console.error("Error fetching files:", error);
        setPageLoading(false);
      }
    };
    fetchFiles();
  }, [isLoading]);
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];
  const maxSize = 10 * 1024 * 1024;

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    processFile(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    processFile(droppedFile);
  };

  const processFile = (file) => {
    if (!file) return;
    let error = null;

    if (!allowedTypes.includes(file.type)) {
      error = `${file.name}: Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed.`;
    }

    if (file.size > maxSize) {
      error = `${file.name}: File too large. Maximum size is 10MB.`;
    }

    if (error) {
      toast.error(error);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const newFile = {
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: file.type.includes("image") ? URL.createObjectURL(file) : null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      uploadStatus: "pending",
    };
    // Revoke previous preview URL if exists
    if (file && file.preview) {
      URL.revokeObjectURL(file.preview);
    }
    console.log("New file data:", newFile);
    setFile(newFile);

    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }

    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
    } else {
      setFileUrl(null);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const diff = expiresAt - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  const removeFile = () => {
    if (file && file.preview) {
      URL.revokeObjectURL(file.preview);
    }
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    if (!file) {
      toast.error("No file selected");
      return;
    }
    try {
      const checksum = await computeSHA256(file.file);
      console.log("checksum", checksum);
      const response = await fetch("/api/s3-presign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff",
        },
        body: JSON.stringify({
          fileName: file.file.name,
          fileType: file.file.type,
          fileSize: file.file.size,
          checksum: checksum,
        }),
      });
      const result = await response.json();
      if (result.failure) {
        console.log("issue uploading file");
        console.error(result.failure);
        toast.error(result.failure);
        return;
      }
      const { url } = result.success;

      if (!url) {
        console.log("issue uploading file");
        throw new Error("We can't sign the url! please try again.");
      }

      console.log("url", url);

      const uploadRes = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": file.file.type,
          "X-Content-Type-Options": "nosniff",
        },
        body: file.file,
      });
      if (!uploadRes.ok) {
        console.log("issue uploading file");
        throw new Error(
          "We can't upload the filet to our storage please try again."
        );
      }
      setFile(null);
      setFileUrl(null);
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error(error);
      toast.error(`Error uploading file: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col  min-h-screen overflow-y-auto bg-gray-100 p-4">
      <FileUpload
        file={file}
        fileUrl={fileUrl}
        isDragging={isDragging}
        fileInputRef={fileInputRef}
        handleFileSelect={handleFileSelect}
        handleDragOver={handleDragOver}
        handleDragLeave={handleDragLeave}
        handleDrop={handleDrop}
        removeFile={removeFile}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        formatFileSize={formatFileSize}
      />
      {pageLoading ? (
        <div className="w-full max-w-screen-lg mx-auto p-4 md:p-8 bg-white rounded-lg shadow-lg text-center mt-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading...</h2>
          <p className="text-gray-600 mb-6">Please wait while we load files</p>
        </div>
      ) : files.length === 0 ? (
        <div className="w-full max-w-screen-lg mx-auto p-4 md:p-8 bg-white rounded-lg shadow-lg text-center mt-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            No Files Found
          </h2>
          <p className="text-gray-600 mb-6">
            No files have been uploaded in the last 24 hours.
          </p>
        </div>
      ) : (
        <FileList files={files} getTimeRemaining={getTimeRemaining} />
      )}
    </div>
  );
};

export default FileUploadUI;
