import Image from "next/image";

const FileUpload = ({
  file,
  isDragging,
  fileInputRef,
  handleFileSelect,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  removeFile,
  handleSubmit,
  isLoading,
  formatFileSize,
}) => {
  return (
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
          <h3 className="text-lg font-semibold text-gray-800">Uploaded File</h3>
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
            <div className="ml-4 flex-grow">
              <div className="flex items-baseline justify-between">
                <p className="font-medium text-gray-800 truncate max-w-xs">
                  {file.file.name}
                </p>
                <span className="text-xs text-gray-500 ml-2">
                  {formatFileSize(file.file.size)}
                </span>
              </div>
            </div>
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
  );
};

export default FileUpload;
