import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface DepartmentInfo {
    id: number;
    name: string;
    code: string;
}

interface SemesterInfo {
    id: number;
    semester: string;
    displayName?: string;
}

interface ScholarshipCandidate {
    studentId: number;
    studentCode: string;
    fullName: string;
    className: string;
    departmentName: string;
    gpa: number;
    totalCredits: number;
    completedCredits: number;
    semester: string;
}

interface ScholarshipStatistics {
    totalCandidates: number;
    averageGPA: number;
    topGPA: number;
    averageCompletionRate: number;
    totalEligibleForScholarship: number;
}

interface Enrollment {
    id?: number;
    studentId: number | null;
    courseId: number | null;
    componentScore1?: number | null;
    componentScore2?: number | null;
    finalExamScore?: number | null;
    grade?: string;
}

interface Student {
    id: number;
    studentCode: string;
    userId: number;
}

interface Course {
    id: number;
    courseCode: string;
    name: string;
}

@Component({
    selector: 'admin-enrollments',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './enrollments.html',
    styleUrls: ['./admin-common.css']
})
export class AdminEnrollmentsComponent {
    baseUrl = 'http://localhost:8080/api/enrollments';
    studentsUrl = 'http://localhost:8080/api/students';
    coursesUrl = 'http://localhost:8080/api/courses';

    enrollments: Enrollment[] = [];
    filteredEnrollments: Enrollment[] = [];
    students: Student[] = [];
    courses: Course[] = [];
    searchText = '';
    form: Enrollment = { studentId: null, courseId: null, componentScore1: null, componentScore2: null, finalExamScore: null, grade: '' };
    editingId: number | null = null;

    constructor(private http: HttpClient, private router: Router) {
        this.loadEnrollments();
        this.loadStudents();
        this.loadCourses();
    }

    loadEnrollments() {
        this.http.get<Enrollment[]>(this.baseUrl).subscribe({
            next: data => { this.enrollments = data || []; this.applyFilter(); },
            error: err => console.error('Load enrollments failed', err)
        });
    }

    applyFilter() {
        const q = (this.searchText || '').trim().toLowerCase();
        if (!q) { this.filteredEnrollments = [...this.enrollments]; return; }
        this.filteredEnrollments = this.enrollments.filter(e => {
            const studentName = this.getStudentName(e.studentId).toLowerCase();
            const courseName = this.getCourseName(e.courseId).toLowerCase();
            return (
                studentName.includes(q) ||
                courseName.includes(q) ||
                (e.grade || '').toLowerCase().includes(q)
            );
        });
    }

    loadStudents() {
        this.http.get<Student[]>(this.studentsUrl).subscribe({
            next: data => this.students = data || [],
            error: err => console.error('Load students failed', err)
        });
    }

    loadCourses() {
        this.http.get<Course[]>(this.coursesUrl).subscribe({
            next: data => this.courses = data || [],
            error: err => console.error('Load courses failed', err)
        });
    }

    getStudentName(studentId: number | null): string {
        if (!studentId) return 'N/A';
        const student = this.students.find(s => s.id === studentId);
        return student ? student.studentCode : 'Unknown';
    }

    getCourseName(courseId: number | null): string {
        if (!courseId) return 'N/A';
        const course = this.courses.find(c => c.id === courseId);
        return course ? `${course.courseCode} - ${course.name}` : 'Unknown';
    }

    reset() {
        this.form = { studentId: null, courseId: null, componentScore1: null, componentScore2: null, finalExamScore: null, grade: '' };
        this.editingId = null;
    }

    selectForEdit(e: Enrollment) {
        this.editingId = e.id ?? null;
        this.form = { ...e };
    }

    save() {
        const payload: Enrollment = {
            studentId: this.form.studentId,
            courseId: this.form.courseId,
            componentScore1: this.form.componentScore1,
            componentScore2: this.form.componentScore2,
            finalExamScore: this.form.finalExamScore,
            grade: this.form.grade
        };

        if (!payload.studentId || !payload.courseId) return;

        if (this.editingId) {
            this.http.put(`${this.baseUrl}/${this.editingId}`, payload, { responseType: 'text' }).subscribe({
                next: () => { this.loadEnrollments(); this.reset(); },
                error: err => console.error('Update failed', err)
            });
        } else {
            this.http.post(this.baseUrl, payload, { responseType: 'text' }).subscribe({
                next: () => { this.loadEnrollments(); this.reset(); },
                error: err => console.error('Create failed', err)
            });
        }
    }

    remove(id?: number) {
        if (!id) return;
        if (!confirm('⚠️ Bạn có chắc chắn muốn xóa đăng ký học này?\n\nThao tác này không thể hoàn tác!')) return;
        this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' }).subscribe({
            next: () => this.loadEnrollments(),
            error: err => console.error('Delete failed', err)
        });
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
