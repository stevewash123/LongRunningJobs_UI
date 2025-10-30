import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';
import { JobProgressUpdate } from '../models/job.models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection?: HubConnection;
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private jobProgressSubject = new Subject<JobProgressUpdate>();

  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  public jobProgress$ = this.jobProgressSubject.asObservable();

  constructor() {
    this.createConnection();
  }

  private createConnection(): void {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${environment.apiUrl.replace('/api', '')}/jobProgressHub`)
      .configureLogging(LogLevel.Information)
      .build();

    this.hubConnection
      .start()
      .then(() => {
        console.log('SignalR connection started');
        this.connectionStatusSubject.next(true);
        this.registerSignalREvents();
      })
      .catch(err => {
        console.error('Error starting SignalR connection: ', err);
        this.connectionStatusSubject.next(false);
        // Retry connection after 5 seconds
        setTimeout(() => this.createConnection(), 5000);
      });

    this.hubConnection.onclose(() => {
      console.log('SignalR connection closed');
      this.connectionStatusSubject.next(false);
      // Attempt to reconnect after 3 seconds
      setTimeout(() => this.createConnection(), 3000);
    });
  }

  private registerSignalREvents(): void {
    if (this.hubConnection) {
      this.hubConnection.on('JobStatusUpdate', (update: JobProgressUpdate) => {
        console.log('Received job progress update:', update);
        this.jobProgressSubject.next(update);
      });
    }
  }

  public isConnected(): boolean {
    return this.hubConnection?.state === 'Connected';
  }

  public async stop(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.connectionStatusSubject.next(false);
    }
  }
}