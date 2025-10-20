import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, StudentGrades, GradeItem, SemesterInfo } from './user.service';
import { StudentGuardService } from './student-guard.service';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-user-grades',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './grades.html',
    styleUrls: ['./grades.css']
})
export class UserGradesComponent implements OnInit {
    grades: StudentGrades | null = null;
    filteredGrades: GradeItem[] = [];
    loading = false;
    error = '';
    studentId: number;
    availableSemesters: SemesterInfo[] = [];
    isStudent: boolean = false;

    // Filter properties
    searchTerm = '';
    statusFilter = '';
    semesterFilter = '';

    constructor(
        private userService: UserService,
        private studentGuard: StudentGuardService,
        private router: Router,
        private authService: AuthService
    ) {
        this.studentId = this.authService.getCurrentUserId();
    }

    ngOnInit() {
        this.loadSemesters();
        this.loadGrades();
    }

    loadSemesters() {
        this.userService.getAllSemesters().subscribe({
            next: (semesters) => {
                console.log('Semesters loaded:', semesters);
                this.availableSemesters = semesters;
            },
            error: (error) => {
                if (!this.studentGuard.handleStudentError(error)) {
                    console.error('Error loading semesters:', error);
                }
                this.availableSemesters = [];
            }
        });
    }

    loadGrades() {
        this.loading = true;
        this.error = '';
        
        this.userService.getStudentGrades().subscribe({
            next: (data) => {
                console.log('Grades loaded successfully:', data);
                // Tính GPA ở frontend
                data.gpa = this.calculateGPA(data.gradeItems);
                this.grades = data;
                this.filteredGrades = [...data.gradeItems];
                this.isStudent = true;
                this.loading = false;
            },
            error: (error) => {
                if (!this.studentGuard.handleStudentError(error)) {
                    console.error('Error loading grades:', error);
                    // Kiểm tra nếu là lỗi 400 (tài khoản chưa có trong bảng students)
                    if (error.status === 400) {
                        this.error = '';
                        this.isStudent = false;
                        this.loadMockGrades();
                    } else {
                        this.error = `Lỗi khi tải bảng điểm: ${error.status} - ${error.message || error.statusText}`;
                        this.loadMockGrades(); // Fallback to mock data
                    }
                }
                this.loading = false;
            }
        });
    }

    private loadMockGrades() {
        console.log('Loading mock grades data...');
        const currentUser = this.authService.getCurrentUser();
        
        // Nếu không có dữ liệu thực từ API, hiển thị thông báo không có điểm
        this.grades = {
            studentId: this.studentId,
            studentCode: this.isStudent ? (currentUser?.username || 'SV001') : 'Chưa xác nhận',
            studentName: currentUser?.fullName || 'Nguyễn Văn A',
            gpa: 0.0, // GPA = 0 vì chưa có điểm
            totalCredits: 0, // Chưa đăng ký môn nào
            completedCredits: 0, // Chưa hoàn thành môn nào
            gradeItems: [] // Không có điểm nào
        };
        this.filteredGrades = [...this.grades.gradeItems];
    }

    /**
     * Tính GPA theo công thức: GPA = Σ(điểm hệ 4 × tín chỉ) / Σ(tín chỉ đã có điểm)
     */
    private calculateGPA(gradeItems: GradeItem[]): number {
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

    filterGrades() {
        if (!this.grades) return;

        this.filteredGrades = this.grades.gradeItems.filter(item => {
            const matchesSearch = !this.searchTerm || 
                item.courseCode.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                item.courseName.toLowerCase().includes(this.searchTerm.toLowerCase());
            
            const matchesStatus = !this.statusFilter || item.status === this.statusFilter;
            
            const matchesSemester = !this.semesterFilter || item.semester === this.semesterFilter;

            return matchesSearch && matchesStatus && matchesSemester;
        });
    }

    getGPAClassification(gpa: number): string {
        if (gpa >= 3.6) return 'Xuất sắc';
        if (gpa >= 3.2) return 'Giỏi';
        if (gpa >= 2.5) return 'Khá';
        if (gpa >= 2.0) return 'Trung bình';
        return 'Yếu';
    }

    getCompletionPercentage(): number {
        if (!this.grades || this.grades.totalCredits === 0) return 0;
        return (this.grades.completedCredits / this.grades.totalCredits) * 100;
    }

    getCompletedCount(): number {
        if (!this.grades) return 0;
        return this.grades.gradeItems.filter(item => item.status === 'Đã hoàn thành').length;
    }

    getInProgressCount(): number {
        if (!this.grades) return 0;
        return this.grades.gradeItems.filter(item => item.status === 'Đang học').length;
    }

    getGradeCount(grade: string): number {
        if (!this.grades) return 0;
        return this.grades.gradeItems.filter(item => item.grade === grade).length;
    }

    getGradeClass(grade: string | null | undefined): string {
        if (!grade) return '';
        
        const gradeMap: { [key: string]: string } = {
            'A': 'grade-a',
            'B+': 'grade-b-plus',
            'B': 'grade-b',
            'C': 'grade-c',
            'D': 'grade-d',
            'F': 'grade-f'
        };
        
        return gradeMap[grade] || '';
    }

    getStatusClass(status: string): string {
        const statusMap: { [key: string]: string } = {
            'Đã hoàn thành': 'completed',
            'Đang học': 'in-progress',
            'Chưa học': 'not-started'
        };
        
        return statusMap[status] || '';
    }

    goToSchedule() {
        this.router.navigate(['/user/schedule']);
    }

    goToRegistration() {
        this.router.navigate(['/user/registration']);
    }

    exportGrades() {
        if (!this.grades) return;

        // Create CSV content
        const headers = ['Mã môn', 'Tên môn học', 'Tín chỉ', 'Điểm TP1', 'Điểm TP2', 'Điểm CK', 'Điểm chữ', 'Trạng thái', 'Học kỳ'];
        const csvContent = [
            headers.join(','),
            ...this.grades.gradeItems.map(item => [
                item.courseCode,
                `"${item.courseName}"`,
                item.credit,
                item.componentScore1 ?? '',
                item.componentScore2 ?? '',
                item.finalExamScore ?? '',
                item.grade ?? '',
                `"${item.status}"`,
                item.semester ?? ''
            ].join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `bang_diem_${this.grades.studentCode}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    logout() {
        if (confirm('🚪 Bạn có chắc chắn muốn đăng xuất?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.clear();
            this.router.navigate(['/login']);
        }
    }
}
