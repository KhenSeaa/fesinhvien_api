import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, PaymentInfo, SemesterInfo } from './user.service';
import { StudentGuardService } from './student-guard.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-user-payment',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './payment.html',
    styleUrls: ['./payment.css']
})
export class UserPaymentComponent implements OnInit {
    paymentInfo: PaymentInfo | null = null;
    allPaymentInfo: PaymentInfo[] = [];
    availableSemesters: SemesterInfo[] = [];
    selectedSemester = '';
    loading = false;
    error = '';
    showAllSemesters = false;

    constructor(
        private userService: UserService,
        private studentGuard: StudentGuardService,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadSemesters();
        // loadPaymentInfo() sẽ được gọi tự động sau khi loadSemesters() hoàn thành
    }

    loadSemesters() {
        this.userService.getAllSemesters().subscribe({
            next: (semesters) => {
                this.availableSemesters = semesters;
                if (semesters.length > 0 && !this.selectedSemester) {
                    this.selectedSemester = semesters[0].semester;
                    // Tự động load thông tin học phí của kỳ mới nhất
                    this.loadPaymentInfo();
                }
            },
            error: (error) => {
                if (!this.studentGuard.handleStudentError(error)) {
                    console.error('Error loading semesters:', error);
                }
            }
        });
    }

    loadPaymentInfo() {
        this.loading = true;
        this.error = '';

        this.userService.getPaymentInfo(this.selectedSemester).subscribe({
            next: (data) => {
                console.log('Payment info loaded successfully:', data);
                this.paymentInfo = data;
                this.loading = false;
            },
            error: (error) => {
                if (!this.studentGuard.handleStudentError(error)) {
                    console.error('Error loading payment info:', error);
                    this.error = `Lỗi khi tải thông tin học phí: ${error.status} - ${error.statusText}`;
                }
                this.loading = false;
            }
        });
    }

    loadAllPaymentInfo() {
        this.loading = true;
        this.error = '';

        this.userService.getAllPaymentInfo().subscribe({
            next: (data) => {
                console.log('All payment info loaded successfully:', data);
                this.allPaymentInfo = data;
                this.loading = false;
            },
            error: (error) => {
                if (!this.studentGuard.handleStudentError(error)) {
                    console.error('Error loading all payment info:', error);
                    this.error = `Lỗi khi tải thông tin học phí: ${error.status} - ${error.statusText}`;
                }
                this.loading = false;
            }
        });
    }

    onSemesterChange() {
        if (this.selectedSemester) {
            this.loadPaymentInfo();
        }
    }

    toggleView() {
        this.showAllSemesters = !this.showAllSemesters;
        if (this.showAllSemesters) {
            this.loadAllPaymentInfo();
        } else {
            this.loadPaymentInfo();
        }
    }

    createPayment(semester?: string) {
        if (confirm('🏦 Bạn có chắc chắn muốn tạo yêu cầu thanh toán cho học kỳ này?')) {
            this.userService.createPayment(semester).subscribe({
                next: (response) => {
                    console.log('Payment created:', response);
                    alert('✅ Tạo yêu cầu thanh toán thành công!');
                    if (this.showAllSemesters) {
                        this.loadAllPaymentInfo();
                    } else {
                        this.loadPaymentInfo();
                    }
                },
                error: (error) => {
                    console.error('Error creating payment:', error);
                    alert('❌ Lỗi khi tạo yêu cầu thanh toán: ' + error.message);
                }
            });
        }
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    getStatusBadgeClass(status: string): string {
        const statusMap: { [key: string]: string } = {
            'PAID': 'bg-green-100 text-green-700',
            'PENDING': 'bg-yellow-100 text-yellow-700',
            'FAILED': 'bg-red-100 text-red-700'
        };
        return statusMap[status] || 'bg-gray-100 text-gray-700';
    }

    getStatusText(status: string): string {
        const statusTextMap: { [key: string]: string } = {
            'PAID': '✅ Đã thanh toán',
            'PENDING': '⏳ Chờ thanh toán',
            'FAILED': '❌ Thanh toán thất bại'
        };
        return statusTextMap[status] || '';
    }
}
