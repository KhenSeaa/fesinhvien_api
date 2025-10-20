// src/app/chat-floating/gemini.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private apiUrl = '/api/gemini/chat'; // use proxy to backend

  constructor(private http: HttpClient) {}

  sendMessage(prompt: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { prompt });
  }
}
