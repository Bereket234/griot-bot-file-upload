# GriotBot Secure File Upload

This project is a secure file upload flow built with [Next.js](https://nextjs.org), using AWS S3 signed URLs and multiple security measures to ensure safe and temporary file storage.

## Features

- **Secure AWS S3 Signed Uploads:** Files are uploaded directly to S3 using signed URLs.
- **File Validation:** Only JPG, PNG, WEBP, and PDF files up to 10MB are accepted.
- **SHA256 Checksum:** Ensures file integrity during upload.
- **Unguessable File Names:** Files are saved with a 32-byte hash for security.
- **Temporary Storage:** Files are automatically deleted from S3 after 24 hours.
- **Frontend Restrictions:** File input only accepts allowed types and sizes, with clear error messages.
- **Domain Whitelisting:** S3 only accepts uploads from whitelisted domains.

## Getting Started

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Bereket234/griot-bot-file-upload.git
   cd griot-bot-file-upload
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**

   - Copy `.env.example` to `.env` and fill in your AWS credentials and other required variables.

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

This project is deployed on Vercel:  
[https://griot-bot-file-upload.vercel.app/](https://griot-bot-file-upload.vercel.app/)

## Security Measures

- **Backend validation** of file type, size, and checksum before signing S3 URLs.
- **Frontend validation** to prevent invalid files from being selected.
- **SHA256 checksum** used to verify file integrity.
- **MIME type and Content-Type headers** enforced during upload.
- **Randomized file names** to prevent guessing.
- **S3 lifecycle policy** deletes files after 24 hours.

## File Structure

- `src/app/page.js` – Main frontend logic for file upload and listing.
- `src/app/api/s3-presign/route.js` – API route for signing S3 URLs and validating uploads.

## License
