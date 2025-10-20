import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

export interface Payment {
    id: number;
    studentId: number;
    studentCode?: string;
    semesterId: number;
    semesterName?: string;
    paymentDate: string;
    status: 'PENDING' | 'PAID' | 'FAILED';
}

export interface PaymentDetailDTO {
    courseId: number;
    courseCode: string;
    courseName: string;
    credit: number;
    fee: number;
}

export interface PaymentDetail {
    id: number;
    studentId: number;
    studentName: string;
    studentClass: string;
    semesterId: number;
    semesterName: string;
    paymentDate: string;
    status: 'PENDING' | 'PAID' | 'FAILED';
    paymentDetails: PaymentDetailDTO[];
    totalAmount: number;
}

export interface PaymentStatusUpdateRequest {
    status: string;
    reason?: string;
}

export interface PaymentStatistics {
    totalPayments: number;
    paidPayments: number;
    pendingPayments: number;
    failedPayments: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
}

export interface SemesterInfo {
    id: number;
    semester: string;
    displayName?: string;
}

export interface ApiResponse {
    success: boolean;
    message: string;
}

@Component({
    selector: 'app-admin-payments',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './payments.html',
    styleUrls: ['./payments.css']
})
export class AdminPaymentsComponent implements OnInit {
    payments: Payment[] = [];
    filteredPayments: Payment[] = [];
    statistics: PaymentStatistics | null = null;
    availableSemesters: SemesterInfo[] = [];

    loading = false;
    error = '';
    successMessage = '';

    // Filters
    statusFilter = '';
    semesterFilter = '';
    searchTerm = '';

    // Selected payment for status update
    selectedPayment: Payment | null = null;
    selectedPaymentDetail: PaymentDetail | null = null;
    showUpdateModal = false;
    newStatus = '';
    updateReason = '';
    updating = false;
    loadingDetail = false;

    private baseUrl = 'https://besinhvien-apideploy-1b0v7w.fly.dev//api/payments';
    private searchTimeout: any;

    constructor(
        private http: HttpClient,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadSemesters();
        this.loadPayments();
        this.loadStatistics();
    }

    // Service methods
    getAllPayments(status?: string, semester?: string, search?: string): Observable<Payment[]> {
        let params = new HttpParams();
        if (status) {
            params = params.set('status', status);
        }
        if (semester) {
            params = params.set('semester', semester);
        }
        if (search && search.trim()) {
            params = params.set('search', search.trim());
        }
        return this.http.get<Payment[]>(`${this.baseUrl}`, { params });
    }

    getPaymentById(id: number): Observable<Payment> {
        return this.http.get<Payment>(`${this.baseUrl}/${id}`);
    }

    getPaymentDetail(id: number): Observable<PaymentDetail> {
        return this.http.get<PaymentDetail>(`${this.baseUrl}/${id}/detail`);
    }

    updatePaymentStatus(id: number, request: PaymentStatusUpdateRequest): Observable<ApiResponse> {
        return this.http.put<ApiResponse>(`${this.baseUrl}/${id}/status`, request);
    }

    getPaymentStatistics(semester?: string): Observable<PaymentStatistics> {
        let params = new HttpParams();
        if (semester) {
            params = params.set('semester', semester);
        }
        return this.http.get<PaymentStatistics>(`${this.baseUrl}/statistics`, { params });
    }

    getAllSemesters(): Observable<SemesterInfo[]> {
        return this.http.get<SemesterInfo[]>('https://besinhvien-apideploy-1b0v7w.fly.dev//api/semesters');
    }

    // Component methods
    loadSemesters() {
        this.getAllSemesters().subscribe({
            next: (semesters: SemesterInfo[]) => {
                this.availableSemesters = semesters.map(s => ({
                    id: s.id,
                    semester: s.semester,
                    displayName: s.displayName || s.semester
                }));
            },
            error: (error: any) => {
                console.error('Error loading semesters:', error);
                this.availableSemesters = [];
            }
        });
    }

    loadPayments() {
        this.loading = true;
        this.error = '';

        this.getAllPayments(this.statusFilter, this.semesterFilter, this.searchTerm).subscribe({
            next: (data: Payment[]) => {
                this.payments = data || [];
                this.filteredPayments = this.payments;
                this.loading = false;
            },
            error: (error: any) => {
                console.error('Error loading payments:', error);
                this.error = `Lỗi khi tải danh sách thanh toán: ${error.status} - ${error.statusText}`;
                this.loading = false;
            }
        });
    }

    loadStatistics() {
        this.getPaymentStatistics(this.semesterFilter).subscribe({
            next: (stats: PaymentStatistics) => {
                this.statistics = stats;
            },
            error: (error: any) => {
                console.error('Error loading statistics:', error);
            }
        });
    }

    onSearchChange() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.loadPayments();
        }, 500);
    }

    onFilterChange() {
        this.loadPayments();
        if (this.semesterFilter) {
            this.loadStatistics();
        }
    }

    openUpdateModal(payment: Payment) {
        this.selectedPayment = payment;
        this.selectedPaymentDetail = null;
        this.newStatus = payment.status;
        this.updateReason = '';
        this.showUpdateModal = true;
        this.loadingDetail = true;

        this.getPaymentDetail(payment.id).subscribe({
            next: (detail: PaymentDetail) => {
                this.selectedPaymentDetail = detail;
                this.loadingDetail = false;
            },
            error: (error: any) => {
                console.error('Error loading payment detail:', error);
                this.loadingDetail = false;
                this.error = 'Không thể tải chi tiết thanh toán';
            }
        });
    }

    closeUpdateModal() {
        this.selectedPayment = null;
        this.selectedPaymentDetail = null;
        this.showUpdateModal = false;
        this.newStatus = '';
        this.updateReason = '';
        this.updating = false;
        this.loadingDetail = false;
    }

    updatePaymentStatusFromUI() {
        if (!this.selectedPayment || !this.newStatus) {
            return;
        }

        if (this.newStatus === this.selectedPayment.status) {
            this.closeUpdateModal();
            return;
        }

        const confirmMessage = `🔄 Bạn có chắc chắn muốn thay đổi trạng thái thanh toán từ "${this.getStatusText(this.selectedPayment.status)}" thành "${this.getStatusText(this.newStatus)}"?`;

        if (!confirm(confirmMessage)) {
            return;
        }

        this.updating = true;
        this.error = '';

        const request: PaymentStatusUpdateRequest = {
            status: this.newStatus,
            reason: this.updateReason
        };

        this.updatePaymentStatus(this.selectedPayment.id, request).subscribe({
            next: (response: ApiResponse) => {
                if (response.success) {
                    this.successMessage = response.message;
                    this.loadPayments();
                    this.loadStatistics();
                    this.closeUpdateModal();

                    setTimeout(() => {
                        this.successMessage = '';
                    }, 3000);
                } else {
                    this.error = response.message;
                }
                this.updating = false;
            },
            error: (error: any) => {
                console.error('Error updating payment status:', error);
                this.error = `Lỗi khi cập nhật trạng thái: ${error.status} - ${error.statusText}`;
                this.updating = false;
            }
        });
    }

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'PAID':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'FAILED':
                return 'bg-red-100 text-red-800 border-red-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    }

    getStatusText(status: string): string {
        switch (status) {
            case 'PAID':
                return 'Đã thanh toán';
            case 'PENDING':
                return 'Chờ thanh toán';
            case 'FAILED':
                return 'Thanh toán thất bại';
            default:
                return 'Không xác định';
        }
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    formatDate(dateString: string): string {
        return new Date(dateString).toLocaleString('vi-VN');
    }

    exportPayments() {
        this.loading = true;
        this.http.get(`${this.baseUrl}/export`, {
            params: this.statusFilter ? { status: this.statusFilter } : {},
            responseType: 'blob'
        }).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;

                const statusText = this.statusFilter ? this.getStatusText(this.statusFilter).toLowerCase().replace(/\s+/g, '_') : 'tat_ca_trang_thai';
                a.download = `danh_sach_thanh_toan_${statusText}.csv`;

                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                this.loading = false;
                this.successMessage = '✅ Xuất file CSV thành công!';
                setTimeout(() => {
                    this.successMessage = '';
                }, 3000);
            },
            error: (error: any) => {
                console.error('Error exporting payments:', error);
                this.error = '❌ Lỗi khi xuất file CSV';
                this.loading = false;
                setTimeout(() => {
                    this.error = '';
                }, 5000);
            }
        });
    }
}
