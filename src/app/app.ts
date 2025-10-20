import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ChatFloating } from './chat-floating/chat-floating';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ChatFloating],
  template: `
    <router-outlet></router-outlet>
    <app-chat-floating *ngIf="showChat"
      [icon]="'🤖'"
      [label]="'Sea'"
      [position]="'right'"
      [width]="'560px'"
      [height]="'75vh'"
    ></app-chat-floating>
  `
})
export class AppComponent {
  showChat = false;

  constructor(private router: Router) {
    // Evaluate on initial load
    this.evaluateVisibility(this.router.url);

    // Update on every navigation end
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => this.evaluateVisibility(e.urlAfterRedirects || e.url));
  }

  private evaluateVisibility(url: string) {
    const currentUrl = (url || '').toString();
    const onLogin = currentUrl.includes('login');
    const hasToken = !!localStorage.getItem('auth_token');
    this.showChat = hasToken && !onLogin;
    // Debug logs to help verify
    console.debug('[AppComponent] url=', currentUrl, 'hasToken=', hasToken, 'showChat=', this.showChat);
  }
}