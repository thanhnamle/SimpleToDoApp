import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: signalR.HubConnection | undefined;
  
  // Observable for components to subscribe to
  private todoUpdatedSource = new Subject<any>();
  todoUpdated$ = this.todoUpdatedSource.asObservable();

  isConnected = signal<boolean>(false);

  public startConnection(token: string) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return; // Already connected
    }

    const hubUrl = environment.apiUrl.replace('/api', '/hubs/todo');

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => {
        this.isConnected.set(true);
        this.registerEvents();
      })
      .catch(err => console.error('Error while starting SignalR connection: ' + err));
      
    this.hubConnection.onreconnected(() => {
      this.isConnected.set(true);
    });
    
    this.hubConnection.onreconnecting(() => {
      this.isConnected.set(false);
    });
    
    this.hubConnection.onclose(() => {
      this.isConnected.set(false);
    });
  }

  private registerEvents() {
    if (!this.hubConnection) return;
    
    this.hubConnection.on('TodoUpdated', (data: any) => {
      this.todoUpdatedSource.next(data);
    });
  }

  public stopConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.isConnected.set(false);
    }
  }
}
