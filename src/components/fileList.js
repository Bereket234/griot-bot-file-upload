import React from "react";
import Image from "next/image";
import Link from "next/link";

const FileList = ({ files, getTimeRemaining }) => {
  return (
    <div>
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
                <Link
                  href={f.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
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
                </Link>
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

export default FileList;
