// src/pto-parser.js
import path from 'path';
import fs from 'fs/promises';
import multer from 'multer';

// configure multer to save uploads to the "uploads" folder
const upload = multer({ dest: path.join(process.cwd(), 'uploads/') });

/**
 * Express middleware to handle parsing PTO image and returning a map
 * of employee names to arrays of ISO date strings.
 * Replace the OCR stub with a real OCR/vision implementation as needed.
 */
export default async function ptoParser(req, res) {
  // `upload.single` is a middleware, so we need to wrap it
  upload.single('file')(req, res, async (err) => {
    if (err) {
      console.error('File upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    try {
      // At this point, req.file.path contains the uploaded image path
      // TODO: integrate OCR or external service here
      // For now, stub out an empty PTO map:
      const ptoMap = {};

      // Clean up the uploaded file if desired:
      // await fs.unlink(req.file.path);

      return res.json({ pto: ptoMap });
    } catch (parseErr) {
      console.error('PTO parse error:', parseErr);
      return res.status(500).json({ error: parseErr.message });
    }
  });
}
