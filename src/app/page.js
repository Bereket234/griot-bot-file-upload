"use client";
import React, { useState, useRef, useEffect } from "react";
import { getSignedURL } from "@/components/action";
import { toast } from "react-toastify";
import { set } from "mongoose";
import Image from "next/image";

const FileUploadUI = () => {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [statusMessage, setStatusMessage] = useState("");
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
    const fetchFiles = async () => {
      try {
        const response = await fetch("/api/s3-presign");
        const data = await response.json();
        console.log(data);
        setFiles(data.success.files);
        if (data.success.files) {
          setStatusMessage("No files found");
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
    setStatusMessage("creating");

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
      setStatusMessage("Upload successful!");
      setFile(null);
      setFileUrl(null);
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error(error);
      setStatusMessage("Error: " + error.message);
      toast.error(`Error uploading file: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading your data...
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen overflow-y-auto bg-gray-100 p-4">
      <div className="w-full max-w-screen-lg mx-auto p-4 md:p-8 bg-white rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload Files</h2>
        <p className="text-gray-600 mb-6">
          Upload images or PDFs to share with GriotBot
        </p>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 mb-6
          ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center space-y-4">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              ></path>
            </svg>

            <div>
              <p className="text-gray-700 font-medium">
                Drag and drop a file here
              </p>
              <p className="text-gray-500 text-sm">or click to browse</p>
            </div>

            <p className="text-gray-400 text-xs">
              Supported formats: JPG, PNG, WEBP, PDF (Max 10MB)
            </p>
          </div>
        </div>

        {/* Uploaded file display */}
        {file && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Uploaded File
            </h3>
            <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              {/* File preview */}
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded bg-white border">
                {file.preview ? (
                  <Image
                    src={file.preview}
                    alt={file.file.name}
                    className="w-10 h-10 object-contain"
                    width={500}
                    height={500}
                  />
                ) : (
                  <svg
                    className="w-6 h-6 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                  </svg>
                )}
              </div>
              {/* File info */}
              <div className="ml-4 flex-grow">
                <div className="flex items-baseline justify-between">
                  <p className="font-medium text-gray-800 truncate max-w-xs">
                    {file.file.name}
                  </p>
                  <span className="text-xs text-gray-500 ml-2">
                    {formatFileSize(file.file.size)}
                  </span>
                </div>
                <div className="flex items-center mt-1">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    Expires in ~{getTimeRemaining(file.expiresAt)}
                  </span>
                </div>
              </div>
              {/* Remove button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
                className="ml-2 p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                aria-label="Remove file"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            <button
              className={`bg-blue-500 text-white px-10 py-2 rounded-md cursor-pointer ${
                isLoading ? "opacity-50 disabled" : ""
              }`}
              onClick={handleSubmit}
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </div>
        )}
      </div>
      {files.length > 0 && (
        <div className="w-full max-w-screen-lg mx-auto p-4 md:p-8 bg-white rounded-lg shadow-lg text-center mt-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Previously Uploaded Files
          </h2>
          <p className="text-gray-600 mb-6">
            Files uploaded in the last 24 hours
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {files.map((f) => (
              <div
                key={f._id}
                className="flex flex-col items-center bg-gray-50 rounded-lg border border-gray-200 p-4"
              >
                <div className="w-full h-56 flex items-center justify-center rounded bg-white border mb-2">
                  {f.fileType.startsWith("image/") ? (
                    <Image
                      src={f.fileUrl}
                      alt={f.fileName}
                      className="w-full h-full object-contain rounded"
                      width={500}
                      height={500}
                    />
                  ) : (
                    <svg
                      className="w-20 h-20 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      ></path>
                    </svg>
                  )}
                </div>
                <div className="w-full mt-2">
                  <p className="font-medium text-gray-800 truncate text-center">
                    {f.fileName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    {getTimeRemaining(new Date(f.expiresAt))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadUI;
