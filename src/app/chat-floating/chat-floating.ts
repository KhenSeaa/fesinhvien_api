// src/app/chat-floating/chat-floating.ts
import { Component, ElementRef, ViewChild, AfterViewInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from './gemini.service';

@Component({
  selector: 'app-chat-floating',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-floating.html',
  styleUrls: ['./chat-floating.css']
})
export class ChatFloating implements AfterViewInit {
  isOpen = false;
  isTyping = false;
  prompt = '';
  messages: { role: 'user' | 'bot'; text: string }[] = [];

  // Cho phép cấu hình icon và nhãn hiển thị
  @Input() icon: string = '💬';
  @Input() iconUrl?: string; // nếu có, sẽ dùng hình thay cho emoji
  @Input() label: string = 'Sea';
  @Input() width: string = '420px';
  @Input() height: string = '640px';
  @Input() position: 'left' | 'right' = 'right';

  @ViewChild('messagesContainer') messagesContainer?: ElementRef<HTMLDivElement>;

  constructor(private geminiService: GeminiService) {}

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    // Nếu mở lần đầu, hiển thị lời chào
    if (this.isOpen && this.messages.length === 0) {
      this.messages.push({ role: 'bot', text: 'Xin chào! Mình là Seaa. Mình có thể giúp gì cho bạn hôm nay?' });
    }
    setTimeout(() => this.scrollToBottom(), 0);
  }

  send() {
    const content = (this.prompt || '').trim();
    if (!content) return;

    // Tin nhắn user
    this.messages.push({ role: 'user', text: content });
    this.prompt = '';
    this.scrollToBottom();

    // Hiển thị typing
    this.isTyping = true;

    // Gọi API backend
    this.geminiService.sendMessage(content).subscribe({
      next: res => {
        const text = this.extractText(res);
        this.messages.push({ role: 'bot', text });
        this.isTyping = false;
        this.scrollToBottom();
      },
      error: () => {
        this.messages.push({ role: 'bot', text: 'Lỗi gọi API' });
        this.isTyping = false;
        this.scrollToBottom();
      }
    });
  }

  private extractText(res: any): string {
    try {
      if (!res) return 'Không có phản hồi.';
      if (typeof res === 'string') return res;
      // Các key phổ biến backend có thể trả
      const keys = ['response', 'reply', 'message', 'content', 'text', 'result'];
      for (const k of keys) {
        if (res[k]) return String(res[k]);
      }
      // Nếu nested
      if (res.data) {
        for (const k of keys) if (res.data[k]) return String(res.data[k]);
      }
      return JSON.stringify(res);
    } catch {
      return 'Không đọc được phản hồi.';
    }
  }

  private scrollToBottom() {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    } catch {}
  }
  
  get headerTitle(): string { return `${this.label} Chat`; }
}
