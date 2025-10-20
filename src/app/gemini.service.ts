import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private apiUrl = 'https://quanlysinhvien-delta.vercel.app/api/gemini/chat'; // URL backend

  constructor(private http: HttpClient) {}

  chat(question: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { question });
  }
}
