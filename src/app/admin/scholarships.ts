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

@Component({
    selector: 'app-admin-scholarships',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './scholarships.html',
    styleUrls: ['./scholarships.css']
})
export class AdminScholarshipsComponent implements OnInit {
    baseUrl = 'https://quanlysinhvien-delta.vercel.app/api/admin/enrollments';

    departments: DepartmentInfo[] = [];
    semesters: SemesterInfo[] = [];
    candidates: ScholarshipCandidate[] = [];
    statistics: ScholarshipStatistics | null = null;
    selectedDepartmentId: number | null = null;
    selectedSemester: string = '';
    searchText: string = '';
    loading = false;
    exporting = false;
    error = '';
    searchPerformed = false;

    constructor(private http: HttpClient, private router: Router) { }

    ngOnInit() {
        this.loadDepartments();
        this.loadSemesters();
    }

    loadDepartments() {
        this.http.get<DepartmentInfo[]>(`${this.baseUrl}/departments`).subscribe({
            next: (departments) => {
                this.departments = departments;
            },
            error: (error) => {
                console.error('Error loading departments:', error);
                this.departments = [];
            }
        });
    }

    loadSemesters() {
        this.http.get<SemesterInfo[]>(`${this.baseUrl}/semesters`).subscribe({
            next: (semesters) => {
                this.semesters = semesters;
            },
            error: (error) => {
                console.error('Error loading semesters:', error);
                this.semesters = [];
            }
        });
    }

    onFilterChange() {
        this.loadScholarshipCandidates();
    }

    loadScholarshipCandidates() {
        this.loading = true;
        this.error = '';
        this.searchPerformed = true;

        const params: any = {};
        if (this.selectedDepartmentId) {
            params.departmentId = this.selectedDepartmentId;
        }
        if (this.selectedSemester) {
            params.semester = this.selectedSemester;
        }
        if (this.searchText && this.searchText.trim()) {
            params.search = this.searchText.trim();
        }

        const candidatesRequest = this.http.get<ScholarshipCandidate[]>(`${this.baseUrl}/scholarships/eligible-students`, { params });
        const statisticsRequest = this.http.get<ScholarshipStatistics>(`${this.baseUrl}/scholarships/statistics`, { params });

        Promise.all([
            candidatesRequest.toPromise(),
            statisticsRequest.toPromise()
        ]).then(([candidates, statistics]) => {
            this.candidates = candidates || [];
            this.statistics = statistics || null;
            this.loading = false;
        }).catch((error) => {
            console.error('Error loading scholarship data:', error);
            this.error = 'Lỗi khi tải dữ liệu học bổng';
            this.loading = false;
            this.candidates = [];
            this.statistics = null;
        });
    }

    exportScholarshipList() {
        if (this.candidates.length === 0) {
            alert('Không có dữ liệu để xuất!');
            return;
        }

        let params: any = {};
        if (this.selectedDepartmentId) params.departmentId = this.selectedDepartmentId;
        if (this.selectedSemester) params.semester = this.selectedSemester;
        if (this.searchText && this.searchText.trim()) params.search = this.searchText.trim();

        this.http.get(`${this.baseUrl}/scholarships/export`, {
            params,
            responseType: 'blob'
        }).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;

                const departmentName = this.selectedDepartmentId
                    ? this.departments.find(d => d.id === this.selectedDepartmentId)?.name || 'all'
                    : 'all';
                const semesterName = this.selectedSemester || 'all';

                link.download = `hoc_bong_${departmentName}_${semesterName}_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
                window.URL.revokeObjectURL(url);
                this.exporting = false;
            },
            error: (error) => {
                console.error('Error exporting scholarship list:', error);
                alert('Có lỗi xảy ra khi xuất danh sách học bổng!');
                this.exporting = false;
            }
        });
    }

    getCompletionRate(candidate: ScholarshipCandidate): number {
        if (candidate.totalCredits === 0) return 0;
        return (candidate.completedCredits / candidate.totalCredits) * 100;
    }

    hasActiveFilters(): boolean {
        return !!this.selectedDepartmentId || !!this.selectedSemester || !!this.searchText;
    }

    resetFilters() {
        this.selectedDepartmentId = null;
        this.selectedSemester = '';
        this.searchText = '';
        this.candidates = [];
        this.statistics = null;
        this.searchPerformed = false;
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
