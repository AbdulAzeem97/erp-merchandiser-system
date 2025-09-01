import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from '../database/config.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow only specific file types
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and Office documents are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 5 // Maximum 5 files per request
  }
});

// Upload files for a job card
router.post('/job/:jobId', upload.array('files', 5), asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({
      error: 'No files uploaded',
      message: 'Please select at least one file to upload'
    });
  }

  // Check if job exists
  const jobExists = await pool.query(
    'SELECT id FROM job_cards WHERE id = $1',
    [jobId]
  );

  if (jobExists.rows.length === 0) {
    return res.status(404).json({
      error: 'Job not found',
      message: 'The specified job does not exist'
    });
  }

  const uploadedFiles = [];

  for (const file of files) {
    // Save file information to database
    const fileQuery = `
      INSERT INTO job_attachments (
        job_card_id, file_name, file_path, file_size, file_type, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const fileResult = await pool.query(fileQuery, [
      jobId,
      file.originalname,
      file.filename,
      file.size,
      file.mimetype,
      req.user.id
    ]);

    uploadedFiles.push({
      id: fileResult.rows[0].id,
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
      type: file.mimetype,
      uploadedAt: fileResult.rows[0].created_at
    });
  }

  res.status(201).json({
    message: 'Files uploaded successfully',
    files: uploadedFiles
  });
}));

// Get files for a job card
router.get('/job/:jobId', asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const query = `
    SELECT 
      ja.*,
      u.first_name || ' ' || u.last_name as uploaded_by_name
    FROM job_attachments ja
    LEFT JOIN users u ON ja.uploaded_by = u.id
    WHERE ja.job_card_id = $1
    ORDER BY ja.created_at DESC
  `;

  const result = await pool.query(query, [jobId]);
  const files = result.rows;

  res.json({
    files
  });
}));

// Download a file
router.get('/file/:fileId', asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  const query = `
    SELECT ja.*, jc.job_card_id
    FROM job_attachments ja
    LEFT JOIN job_cards jc ON ja.job_card_id = jc.id
    WHERE ja.id = $1
  `;

  const result = await pool.query(query, [fileId]);

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: 'File not found',
      message: 'The requested file does not exist'
    });
  }

  const file = result.rows[0];
  const filePath = path.join(uploadsDir, file.file_path);

  // Check if file exists on disk
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      error: 'File not found',
      message: 'The file has been deleted from the server'
    });
  }

  // Set headers for file download
  res.setHeader('Content-Type', file.file_type);
  res.setHeader('Content-Disposition', `attachment; filename="${file.file_name}"`);

  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
}));

// Delete a file
router.delete('/file/:fileId', asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  // Get file information
  const fileQuery = 'SELECT * FROM job_attachments WHERE id = $1';
  const fileResult = await pool.query(fileQuery, [fileId]);

  if (fileResult.rows.length === 0) {
    return res.status(404).json({
      error: 'File not found',
      message: 'The requested file does not exist'
    });
  }

  const file = fileResult.rows[0];

  // Delete file from disk
  const filePath = path.join(uploadsDir, file.file_path);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Delete file record from database
  await pool.query('DELETE FROM job_attachments WHERE id = $1', [fileId]);

  res.json({
    message: 'File deleted successfully'
  });
}));

// Get upload statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const statsQuery = `
    SELECT 
      COUNT(*) as total_files,
      SUM(file_size) as total_size,
      AVG(file_size) as avg_file_size,
      COUNT(DISTINCT job_card_id) as jobs_with_files,
      COUNT(DISTINCT uploaded_by) as unique_uploaders
    FROM job_attachments
  `;

  const statsResult = await pool.query(statsQuery);
  const stats = statsResult.rows[0];

  // Get recent uploads
  const recentQuery = `
    SELECT 
      ja.*,
      jc.job_card_id,
      u.first_name || ' ' || u.last_name as uploaded_by_name
    FROM job_attachments ja
    LEFT JOIN job_cards jc ON ja.job_card_id = jc.id
    LEFT JOIN users u ON ja.uploaded_by = u.id
    ORDER BY ja.created_at DESC
    LIMIT 10
  `;

  const recentResult = await pool.query(recentQuery);
  const recentUploads = recentResult.rows;

  res.json({
    stats,
    recentUploads
  });
}));

export default router;
