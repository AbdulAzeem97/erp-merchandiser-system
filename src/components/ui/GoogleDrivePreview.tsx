import React, { useState } from 'react';
import { ExternalLink, Eye, EyeOff, Download, FileText, Image, File } from 'lucide-react';
import { getGoogleDriveFileInfo, isGoogleDriveUrl } from '../../utils/googleDriveUtils';
import { Button } from './button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';

interface GoogleDrivePreviewProps {
  url: string;
  label?: string;
  showThumbnail?: boolean;
  showPreview?: boolean;
  className?: string;
}

export const GoogleDrivePreview: React.FC<GoogleDrivePreviewProps> = ({
  url,
  label = 'Google Drive File',
  showThumbnail = true,
  showPreview = true,
  className = ''
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!url || !isGoogleDriveUrl(url)) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        <File className="h-4 w-4 inline mr-1" />
        Invalid Google Drive URL
      </div>
    );
  }

  const fileInfo = getGoogleDriveFileInfo(url);
  
  if (!fileInfo) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        <File className="h-4 w-4 inline mr-1" />
        Could not parse Google Drive URL
      </div>
    );
  }

  const getFileIcon = () => {
    // Simple file type detection based on common patterns
    if (url.includes('document') || url.includes('docs.google.com')) {
      return <FileText className="h-4 w-4" />;
    } else if (url.includes('spreadsheet') || url.includes('sheets.google.com')) {
      return <FileText className="h-4 w-4" />;
    } else if (url.includes('presentation') || url.includes('slides.google.com')) {
      return <FileText className="h-4 w-4" />;
    } else {
      return <Image className="h-4 w-4" />;
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* File Link */}
      <div className="flex items-center gap-2">
        {getFileIcon()}
        <span className="text-sm font-medium text-gray-600">{label}:</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 text-sm underline flex items-center gap-1"
        >
          <ExternalLink className="h-3 w-3" />
          Open in Drive
        </a>
      </div>

      {/* Thumbnail Preview */}
      {showThumbnail && fileInfo.thumbnailUrl && !imageError && (
        <div className="relative">
          <img
            src={fileInfo.thumbnailUrl}
            alt={`${label} thumbnail`}
            className="w-32 h-24 object-cover border border-gray-200 rounded-lg shadow-sm"
            onError={() => setImageError(true)}
            onLoad={() => setImageError(false)}
          />
          {showPreview && (
            <Button
              size="sm"
              variant="outline"
              className="absolute top-1 right-1 h-6 w-6 p-0 bg-white/90 hover:bg-white"
              onClick={() => setIsPreviewOpen(true)}
            >
              <Eye className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {/* Fallback when thumbnail fails */}
      {showThumbnail && (!fileInfo.thumbnailUrl || imageError) && (
        <div className="w-32 h-24 border border-gray-200 rounded-lg shadow-sm flex items-center justify-center bg-gray-50">
          <div className="text-center">
            {getFileIcon()}
            <p className="text-xs text-gray-500 mt-1">Preview</p>
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      {showPreview && (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {label} Preview
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={fileInfo.previewUrl || url}
                className="w-full h-[60vh] border-0 rounded-lg"
                title={`${label} preview`}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsPreviewOpen(false)}
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Close
              </Button>
              <Button
                onClick={() => window.open(url, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Open in Drive
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
