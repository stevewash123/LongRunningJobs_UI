export interface JobConfiguration {
  name: string;
  durationSeconds: number;
  scheduleDelaySeconds?: number; // Optional delay before job starts (0 = immediate)
}

export interface JobSubmissionRequest {
  jobs: JobConfiguration[];
}

export interface JobStatus {
  jobId: string;
  name: string;
  status: string;
  progress: number;
  startTime: string;
  endTime?: string;
  errorMessage?: string;
}

export interface JobProgressUpdate {
  jobId: string;
  name: string;
  progress: number;
  status: string;
  message?: string;
}

export interface Product {
  productId: number;
  productName: string;
  category: string;
  unitPrice: number;
  unitsInStock: number;
  discontinued: boolean;
}

export interface ProductSearchRequest {
  searchTerm?: string;
  categoryFilter?: string;
  page: number;
  pageSize: number;
}

export interface ProductSearchResponse {
  products: Product[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}