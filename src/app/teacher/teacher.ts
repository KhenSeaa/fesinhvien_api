import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet, Router } from '@angular/router';
import { TeacherService, TeacherClassInfo } from './teacher.service';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-teacher',
    standalone: true,
    imports: [RouterLink, RouterOutlet],
    templateUrl: './teacher.html',
    styleUrls: ['./teacher.css']
})
export class TeacherComponent implements OnInit {
    classCount = 0;
    studentCount = 0;
    courseCount = 0;
    loading = false;
    error = '';
    userEmail = '';
    userFullName = '';
    currentSemester = '';

    constructor(
        private router: Router, 
        private teacherService: TeacherService,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        this.loadUserInfo();
        this.loadStats();
    }

    private loadUserInfo() {
        // Load thông tin thực từ database qua API profile
        this.teacherService.getTeacherProfile().subscribe({
            next: (profile) => {
                this.userEmail = profile.email || '';
                this.userFullName = profile.fullName || 'Giảng viên';
            },
            error: (err) => {
                console.error('Failed to load teacher profile:', err);
                // Fallback to JWT data
                const user = this.authService.getCurrentUser();
                if (user) {
                    this.userEmail = user.email || '';
                    this.userFullName = user.fullName || 'Giảng viên';
                } else {
                    this.userEmail = '';
                    this.userFullName = 'Giảng viên';
                }
            }
        });
    }

    private loadStats() {
        this.loading = true;
        // Load semesters trước để lấy kỳ mới nhất
        this.teacherService.getAllSemesters().subscribe({
            next: (semesters) => {
                const latestSemester = semesters.length > 0 ? semesters[0].semester : undefined;
                this.currentSemester = latestSemester || '';
                // Load classes của kỳ mới nhất
                this.teacherService.getTeacherClasses(latestSemester).subscribe({
                    next: (classes: TeacherClassInfo[]) => {
                        this.classCount = classes.length;
                        this.studentCount = classes.reduce((sum, c) => sum + (c.students?.length || 0), 0);
                        const uniqueCourseIds = new Set<number>();
                        for (const c of classes) if (typeof c.courseId === 'number') uniqueCourseIds.add(c.courseId);
                        this.courseCount = uniqueCourseIds.size;
                        this.loading = false;
                    },
                    error: (err) => {
                        console.error('Failed to load teacher classes for stats:', err);
                        this.error = 'Không tải được thống kê';
                        this.loading = false;
                    }
                });
            },
            error: (err) => {
                console.error('Failed to load semesters:', err);
                // Fallback to load all classes nếu không load được semesters
                this.teacherService.getTeacherClasses().subscribe({
                    next: (classes: TeacherClassInfo[]) => {
                        this.classCount = classes.length;
                        this.studentCount = classes.reduce((sum, c) => sum + (c.students?.length || 0), 0);
                        const uniqueCourseIds = new Set<number>();
                        for (const c of classes) if (typeof c.courseId === 'number') uniqueCourseIds.add(c.courseId);
                        this.courseCount = uniqueCourseIds.size;
                        this.loading = false;
                    },
                    error: (err) => {
                        console.error('Failed to load teacher classes for stats:', err);
                        this.error = 'Không tải được thống kê';
                        this.loading = false;
                    }
                });
            }
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


