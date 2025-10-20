import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [RouterLink, RouterOutlet, CommonModule],
    templateUrl: './admin.html',
    styleUrls: ['./admin.css']
})
export class AdminComponent implements OnInit {
    // Dynamic overview stats
    studentCount = 0;
    lecturerCount = 0;
    classCount = 0;
    courseCount = 0;
    loading = true;
    error = '';
    userEmail = '';
    userFullName = '';

    constructor(
        private router: Router, 
        private http: HttpClient,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        this.loadUserInfo();
        this.loadOverview();
    }

    private loadUserInfo() {
        const user = this.authService.getCurrentUser();
        if (user && user.userId) {
            // Load thông tin thực từ database
            this.http.get<any>(`/api/users/${user.userId}`).subscribe({
                next: (userData) => {
                    this.userEmail = userData.email || '';
                    this.userFullName = userData.fullName || 'Hiệu trưởng';
                },
                error: (err) => {
                    console.error('Failed to load user info:', err);
                    // Fallback to JWT data
                    this.userEmail = user.email || '';
                    this.userFullName = user.fullName || 'Hiệu trưởng';
                }
            });
        } else {
            this.userEmail = '';
            this.userFullName = 'Hiệu trưởng';
        }
    }

    private loadOverview() {
        this.loading = true;
        // Use relative URLs so the Angular dev server proxy or hosting will forward to backend
        const students$ = this.http.get<any[]>('/api/students');
        const lecturers$ = this.http.get<any[]>('/api/lecturers');
        const classes$ = this.http.get<any[]>('/api/classes');
        const courses$ = this.http.get<any[]>('/api/courses');

        // Fetch in parallel
        students$.subscribe({
            next: (rows) => this.studentCount = (rows || []).length,
            error: (e) => { console.warn('students count error', e); this.error = 'Không tải được thống kê'; }
        });
        lecturers$.subscribe({
            next: (rows) => this.lecturerCount = (rows || []).length,
            error: (e) => { console.warn('lecturers count error', e); this.error = 'Không tải được thống kê'; }
        });
        classes$.subscribe({
            next: (rows) => this.classCount = (rows || []).length,
            error: (e) => { console.warn('classes count error', e); this.error = 'Không tải được thống kê'; }
        });
        courses$.subscribe({
            next: (rows) => { this.courseCount = (rows || []).length; this.loading = false; },
            error: (e) => { console.warn('courses count error', e); this.error = 'Không tải được thống kê'; this.loading = false; }
        });
    }

    logout() {
        if (confirm('🚪 Bạn có chắc chắn muốn đăng xuất?')) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            sessionStorage.clear();
            this.router.navigate(['/login']);
        }
    }
}


