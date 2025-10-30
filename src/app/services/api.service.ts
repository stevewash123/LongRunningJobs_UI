import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JobSubmissionRequest, JobStatus, ProductSearchRequest, ProductSearchResponse } from '../models/job.models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Job-related endpoints
  submitJobs(request: JobSubmissionRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/jobs/submit`, request);
  }

  getJobStatus(): Observable<JobStatus[]> {
    return this.http.get<JobStatus[]>(`${this.apiUrl}/jobs/status`);
  }

  // Product-related endpoints
  searchProducts(request: ProductSearchRequest): Observable<ProductSearchResponse> {
    return this.http.post<ProductSearchResponse>(`${this.apiUrl}/products/search`, request);
  }

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/products/categories`);
  }
}