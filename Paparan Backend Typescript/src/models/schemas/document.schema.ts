// Database schema types for documents (Bappenas)

export interface BappenasDocumentSchema {
  id: string;
  uploaded_by: string;
  filename: string;
  storage_path: string;
  file_type: string;
  file_size: number;
  title?: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_started_at?: string;
  processing_completed_at?: string;
  processing_error?: string;
  metadata?: Record<string, any>;
  uploaded_at: string;
  updated_at?: string;
}

export interface SDIIndicatorMetadataSchema {
  id: string;
  document_id: string;
  k_code: string;
  l_code: string;
  indicator_name: string;
  definition: string;
  sector: string;
  subsector?: string;
  unit?: string;
  data?: Record<string, any>;
  extracted_at: string;
  created_at: string;
  updated_at?: string;
}

export interface ConsistencyFlagSchema {
  id: string;
  document_id: string;
  indicator_id?: string;
  flag_type: 'duplicate' | 'contradiction' | 'incomplete' | 'invalid';
  description: string;
  related_indicators: string[];
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

export interface ExtractionJobSchema {
  id: string;
  user_id: string;
  type: 'document_extraction' | 'consistency_check' | 'scrape';
  document_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: Record<string, any>;
  error?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
}
