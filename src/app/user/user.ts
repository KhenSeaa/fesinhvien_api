import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet, Router } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';
import { AuthService } from '../auth.service';
import { UserService, StudentGrades } from './user.service';

@Component({
    selector: 'app-user',
    standalone: true,
    imports: [RouterLink, RouterOutlet, CommonModule, DecimalPipe],
    templateUrl: './user.html',
    styleUrls: ['./user.css']
})
export class UserComponent implements OnInit {
    grades: StudentGrades | null = null;
    isStudent: boolean = false;
    studentInfo: any = null;
    userEmail = '';
    
    constructor(private router: Router, private authService: AuthService, private userService: UserService) {}

    ngOnInit() {
        this.loadStudentData();
        this.loadUserEmail();
    }

    loadUserEmail() {
        // Load email thực từ profile API
        this.userService.getStudentProfile().subscribe({
            next: (profile) => {
                this.userEmail = profile.email || '';
            },
            error: (err) => {
                console.error('Failed to load student profile for email:', err);
                // Fallback to JWT data
                const user = this.authService.getCurrentUser();
                this.userEmail = user?.email || '';
            }
        });
    }

    loadStudentData() {
        this.userService.getStudentGrades().subscribe({
            next: (data) => {
                // Tính GPA ở frontend
                data.gpa = this.calculateGPA(data.gradeItems);
                this.grades = data;
                this.isStudent = true;
                this.studentInfo = {
                    studentCode: data.studentCode,
                    studentName: data.studentName
                };
            },
            error: (error) => {
                console.error('Error loading student data:', error);
                // Tài khoản chưa được xác nhận là sinh viên
                this.isStudent = false;
                this.grades = {
                    studentId: this.authService.getCurrentUserId(),
                    studentCode: 'Chưa xác nhận',
                    studentName: this.authService.getCurrentUser()?.fullName || 'Nguyễn Văn A',
                    gpa: 0.0,
                    totalCredits: 0,
                    completedCredits: 0,
                    gradeItems: []
                };
            }
        });
    }

    getCurrentUserEmail(): string {
        return this.userEmail || 'Đang tải...';
    }

    getCurrentCoursesCount(): number {
        if (!this.isStudent) return 0;
        return this.grades?.gradeItems.filter(item => item.status === 'Đang học').length || 0;
    }

    getCurrentGPA(): number {
        if (!this.isStudent) return 0.0;
        return this.grades?.gpa || 0.0;
    }

    getCompletedCredits(): number {
        if (!this.isStudent) return 0;
        return this.grades?.completedCredits || 0;
    }

    getStudentCode(): string {
        return this.isStudent ? (this.studentInfo?.studentCode || 'SV001') : 'Chưa xác nhận';
    }

    getStudentName(): string {
        return this.isStudent ? (this.studentInfo?.studentName || 'Nguyễn Văn A') : (this.authService.getCurrentUser()?.fullName || 'Nguyễn Văn A');
    }

    /**
     * Tính GPA theo công thức: GPA = Σ(điểm hệ 4 × tín chỉ) / Σ(tín chỉ đã có điểm)
     */
    private calculateGPA(gradeItems: any[]): number {
        if (!gradeItems || gradeItems.length === 0) {
            return 0.0;
        }

        let totalWeightedScore = 0;
        let totalCreditsWithGrades = 0;

        for (const item of gradeItems) {
            // Chỉ tính GPA cho các môn đã có điểm (scoreCoefficient4 != null)
            if (item.scoreCoefficient4 != null && item.scoreCoefficient4 !== undefined) {
                totalWeightedScore += item.scoreCoefficient4 * item.credit;
                totalCreditsWithGrades += item.credit;
            }
        }

        if (totalCreditsWithGrades === 0) {
            return 0.0;
        }

        return totalWeightedScore / totalCreditsWithGrades;
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
