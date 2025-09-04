import mongoose from "mongoose";

const fileModel = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileUrl: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const File = mongoose.models.File || mongoose.model("File", fileModel);

export default File;
