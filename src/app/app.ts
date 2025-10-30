import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ApiService } from './services/api.service';
import { SignalRService } from './services/signalr.service';
import { JobConfiguration, JobSubmissionRequest, JobStatus, Product, ProductSearchRequest } from './models/job.models';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  // SignalR connection
  isConnected = false;
  private signalRSubscriptions: Subscription[] = [];

  // Job management
  selectedJobCount = 3;
  jobConfigurations: JobConfiguration[] = [];
  activeJobs: JobStatus[] = [];
  latestJobUpdates: any[] = [];
  isSubmitting = false;

  // Help dialog
  showHelp = false;
  activeTab = 'demo';

  // Product data
  displayedProducts: Product[] = [];
  categories: string[] = [];
  searchTerm = '';
  selectedCategory = '';
  currentPage = 1;
  totalPages = 1;
  totalCount = 0;
  pageSize = 10;
  isLoadingProducts = false;

  constructor(
    private apiService: ApiService,
    private signalRService: SignalRService
  ) {}

  ngOnInit(): void {
    this.initializeSignalR();
    this.updateJobConfigurations();
    this.loadCategories();
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.signalRSubscriptions.forEach(sub => sub.unsubscribe());
    this.signalRService.stop();
  }

  private initializeSignalR(): void {
    // Subscribe to connection status
    const connectionSub = this.signalRService.connectionStatus$.subscribe(
      isConnected => this.isConnected = isConnected
    );

    // Subscribe to job progress updates
    const progressSub = this.signalRService.jobProgress$.subscribe(
      update => this.handleJobProgressUpdate(update)
    );

    this.signalRSubscriptions.push(connectionSub, progressSub);
  }

  private handleJobProgressUpdate(update: any): void {
    // Add to marquee updates
    const marqueeUpdate = {
      name: update.name,
      message: update.message || `${update.status} - ${update.progress}%`,
      timestamp: new Date(),
      isCompleted: update.status === 'Completed'
    };

    this.latestJobUpdates.unshift(marqueeUpdate);
    // Keep only last 10 updates
    if (this.latestJobUpdates.length > 10) {
      this.latestJobUpdates = this.latestJobUpdates.slice(0, 10);
    }

    // Clear marquee updates after 30 seconds
    setTimeout(() => {
      const index = this.latestJobUpdates.findIndex(u => u.timestamp === marqueeUpdate.timestamp);
      if (index >= 0) {
        this.latestJobUpdates.splice(index, 1);
      }
    }, 30000);

    // Find existing job or create new one
    const existingJobIndex = this.activeJobs.findIndex(job => job.jobId === update.jobId);

    const jobStatus: JobStatus = {
      jobId: update.jobId,
      name: update.name,
      status: update.status,
      progress: update.progress,
      startTime: new Date().toISOString()
    };

    if (existingJobIndex >= 0) {
      this.activeJobs[existingJobIndex] = { ...this.activeJobs[existingJobIndex], ...jobStatus };
    } else {
      this.activeJobs.push(jobStatus);
    }

    // Remove completed jobs after 10 seconds
    if (update.status === 'Completed') {
      setTimeout(() => {
        const index = this.activeJobs.findIndex(job => job.jobId === update.jobId);
        if (index >= 0 && this.activeJobs[index].status === 'Completed') {
          this.activeJobs.splice(index, 1);
        }
      }, 10000);
    }
  }

  // Job configuration methods
  updateJobConfigurations(): void {
    const colorNames = ['Red Job', 'Blue Job', 'Green Job', 'Yellow Job', 'Purple Job', 'Orange Job'];
    this.jobConfigurations = [];
    for (let i = 1; i <= this.selectedJobCount; i++) {
      this.jobConfigurations.push({
        name: colorNames[i - 1],
        durationSeconds: 15 + (i * 5), // Staggered durations: 15, 20, 25, 30, 35, 40
        scheduleDelaySeconds: i === 1 ? 0 : (i - 1) * 5 // Staggered delays: 0, 5, 10, 15, 20, 25
      });
    }
  }

  submitJobs(): void {
    if (this.isSubmitting || this.activeJobs.length > 0) return;

    this.isSubmitting = true;

    const request: JobSubmissionRequest = {
      jobs: this.jobConfigurations
    };

    this.apiService.submitJobs(request).subscribe({
      next: (response) => {
        console.log('Jobs submitted successfully:', response);
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Failed to submit jobs:', error);
        this.isSubmitting = false;
      }
    });
  }

  clearCompletedJobs(): void {
    this.activeJobs = this.activeJobs.filter(job => job.status !== 'Completed');
  }

  // Product management methods
  private loadCategories(): void {
    this.apiService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Failed to load categories:', error);
      }
    });
  }

  private loadProducts(): void {
    this.isLoadingProducts = true;

    const request: ProductSearchRequest = {
      searchTerm: this.searchTerm || undefined,
      categoryFilter: this.selectedCategory || undefined,
      page: this.currentPage,
      pageSize: this.pageSize
    };

    this.apiService.searchProducts(request).subscribe({
      next: (response) => {
        this.displayedProducts = response.products;
        this.totalCount = response.totalCount;
        this.totalPages = response.totalPages;
        this.isLoadingProducts = false;
      },
      error: (error) => {
        console.error('Failed to load products:', error);
        this.isLoadingProducts = false;
      }
    });
  }

  searchProducts(): void {
    this.currentPage = 1; // Reset to first page
    this.loadProducts();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadProducts();
    }
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  getJobColor(jobName: string): string {
    const colorMap: { [key: string]: string } = {
      'Red Job': '#dc3545',
      'Blue Job': '#007bff',
      'Green Job': '#28a745',
      'Yellow Job': '#ffc107',
      'Purple Job': '#6f42c1',
      'Orange Job': '#fd7e14'
    };
    return colorMap[jobName] || '#6c757d';
  }
}
