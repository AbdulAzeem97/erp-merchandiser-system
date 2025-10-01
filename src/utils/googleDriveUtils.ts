/**
 * Google Drive utility functions for generating thumbnail URLs and preview links
 */

export interface GoogleDriveFileInfo {
  fileId: string;
  fileName?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
}

/**
 * Extract file ID from Google Drive URL
 * Supports various Google Drive URL formats:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/open?id=FILE_ID
 * - https://docs.google.com/document/d/FILE_ID/edit
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null;
  
  // Pattern 1: /file/d/FILE_ID/view or /file/d/FILE_ID/edit
  const filePattern = /\/file\/d\/([a-zA-Z0-9-_]+)/;
  const fileMatch = url.match(filePattern);
  if (fileMatch) {
    return fileMatch[1];
  }
  
  // Pattern 2: ?id=FILE_ID
  const idPattern = /[?&]id=([a-zA-Z0-9-_]+)/;
  const idMatch = url.match(idPattern);
  if (idMatch) {
    return idMatch[1];
  }
  
  // Pattern 3: /document/d/FILE_ID/ or /spreadsheets/d/FILE_ID/
  const docPattern = /\/(document|spreadsheets|presentation)\/d\/([a-zA-Z0-9-_]+)/;
  const docMatch = url.match(docPattern);
  if (docMatch) {
    return docMatch[2];
  }
  
  return null;
}

/**
 * Generate Google Drive thumbnail URL
 * @param fileId - Google Drive file ID
 * @param size - Thumbnail size (default: 200x200)
 * @returns Thumbnail URL or null if fileId is invalid
 */
export function generateGoogleDriveThumbnail(fileId: string, size: string = '200x200'): string | null {
  if (!fileId) return null;
  
  // Google Drive thumbnail API
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size.split('x')[0]}-h${size.split('x')[1]}`;
}

/**
 * Generate Google Drive preview URL
 * @param fileId - Google Drive file ID
 * @returns Preview URL or null if fileId is invalid
 */
export function generateGoogleDrivePreview(fileId: string): string | null {
  if (!fileId) return null;
  
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Get Google Drive file information from URL
 * @param url - Google Drive URL
 * @returns File information object
 */
export function getGoogleDriveFileInfo(url: string): GoogleDriveFileInfo | null {
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return null;
  
  return {
    fileId,
    thumbnailUrl: generateGoogleDriveThumbnail(fileId),
    previewUrl: generateGoogleDrivePreview(fileId)
  };
}

/**
 * Check if URL is a valid Google Drive URL
 * @param url - URL to check
 * @returns boolean
 */
export function isGoogleDriveUrl(url: string): boolean {
  if (!url) return false;
  
  const drivePatterns = [
    /drive\.google\.com/,
    /docs\.google\.com/,
    /sheets\.google\.com/,
    /slides\.google\.com/
  ];
  
  return drivePatterns.some(pattern => pattern.test(url));
}

/**
 * Generate embed URL for Google Drive files
 * @param fileId - Google Drive file ID
 * @returns Embed URL
 */
export function generateGoogleDriveEmbed(fileId: string): string | null {
  if (!fileId) return null;
  
  return `https://drive.google.com/file/d/${fileId}/preview`;
}
