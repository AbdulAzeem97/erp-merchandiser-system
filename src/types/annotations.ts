export interface PDFAnnotation {
  id: string;
  type: 'tick' | 'cross';
  x: number; // Position on PDF (normalized 0-1)
  y: number;
  page: number;
  comment?: string;
  createdBy: number;
  createdAt: string;
  updatedAt?: string;
}

export interface PDFAnnotationsData {
  id?: number;
  job_card_id: number;
  pdf_url: string;
  annotations: PDFAnnotation[];
  created_by: number;
  created_at: string;
  updated_at: string;
}

