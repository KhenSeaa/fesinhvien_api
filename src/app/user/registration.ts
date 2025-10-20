import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserService, CourseRegistrationRequest, CourseInfo, SemesterInfo, StudentGrades, PaymentInfo, GradeItem } from './user.service';

@Component({
    selector: 'app-user-registration',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './registration.html',
    styleUrls: ['./registration.css']
})
export class UserRegistrationComponent implements OnInit {
    availableCourses: CourseInfo[] = [];
    enrolledCourses: CourseInfo[] = [];
    pendingCourses: CourseInfo[] = [];
    completedCourses: CourseInfo[] = [];
    loading = false;
    processing = false;
    error = '';
    successMessage = '';
    selectedSemester = '';
    availableSemesters: SemesterInfo[] = [];

    constructor(
        private userService: UserService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {}

    async ngOnInit(): Promise<void> {
        // Load danh sách semesters
        await this.initializeSemesters();
        
        // Tự động load dữ liệu của kỳ mới nhất (selectedSemester đã được set trong initializeSemesters)
        if (this.selectedSemester) {
            console.log('Loading data for semester:', this.selectedSemester);
            await this.loadSemesterData(this.selectedSemester);
        } else {
            console.warn('No semester selected after initialization');
        }
    }

    private async initializeSemesters(): Promise<void> {
        try {
            const semesters = await firstValueFrom(this.userService.getAllSemesters());
            console.log('✅ Semesters loaded:', semesters);
            this.availableSemesters = semesters || [];
            
            // Luôn tự động chọn kỳ đầu tiên (mới nhất)
            if (this.availableSemesters.length > 0) {
                this.selectedSemester = this.availableSemesters[0].semester;
                console.log('✅ Auto-selected latest semester:', this.selectedSemester);
            } else {
                console.warn('⚠️ No semesters available');
            }
        } catch (error) {
            console.error('❌ Error loading semesters:', error);
            this.availableSemesters = [];
            this.selectedSemester = '';
        }
    }

    private async reloadSemesterData(): Promise<void> {
        const semester = this.selectedSemester || this.availableSemesters[0]?.semester || '2024-1';
        this.selectedSemester = semester;
        await this.loadSemesterData(semester);
    }

    private async loadSemesterData(semester: string): Promise<void> {
        console.log('📥 Starting loadSemesterData for semester:', semester);
        this.loading = true;
        this.error = '';

        try {
            console.log('📡 Fetching data...');
            const result = await firstValueFrom(forkJoin({
                available: this.userService.getAvailableCourses(semester).pipe(catchError(err => {
                    console.error('❌ Error loading available courses:', err);
                    return of([]);
                })),
                grades: this.userService.getStudentGrades(semester).pipe(catchError(err => {
                    console.error('❌ Error loading grades:', err);
                    return of(null);
                })),
                payment: this.userService.getPaymentInfo(semester).pipe(catchError(err => {
                    console.log('⚠️ Payment info not found (normal if not paid yet):', err.status);
                    return of(null);
                }))
            }));

            console.log('✅ Data loaded:', {
                available: result.available?.length || 0,
                grades: result.grades ? 'loaded' : 'null',
                payment: result.payment ? 'loaded' : 'null'
            });

            this.partitionCourses(result.available ?? [], result.grades, result.payment);
            console.log('✅ Courses partitioned:', {
                available: this.availableCourses.length,
                enrolled: this.enrolledCourses.length,
                pending: this.pendingCourses.length,
                completed: this.completedCourses.length
            });
            
            // Force UI update
            this.cdr.detectChanges();
        } catch (error: any) {
            console.error('❌ Fatal error loading registration data:', error);
            this.error = `Lỗi khi tải dữ liệu đăng ký môn học: ${error.message || error.status || 'Unknown error'}`;
            this.availableCourses = [];
            this.enrolledCourses = [];
            this.pendingCourses = [];
            this.completedCourses = [];
        } finally {
            this.loading = false;
            console.log('✅ Loading complete, loading flag set to false');
            // Force UI update to show/hide loading spinner
            this.cdr.detectChanges();
        }
    }

    private partitionCourses(available: CourseInfo[], grades: StudentGrades | null, payment: PaymentInfo | null): void {
        console.log('🔍 Partitioning courses - input:', {
            availableCount: available.length,
            hasGrades: grades !== null,
            hasPayment: payment !== null,
            paymentDetailsCount: payment?.paymentDetails?.length || 0
        });
        
        this.availableCourses = available.filter(course => course.canRegister);
        console.log('🔍 Available courses after filter:', this.availableCourses.length);

        const paymentDetails = payment?.paymentDetails ?? [];

        this.enrolledCourses = paymentDetails.map((detail: any) => {
            const courseInfo = this.mapPaymentDetailToCourseInfo(detail, available);
            return {
                ...courseInfo,
                canUnregister: true,
                reason: 'Đã đăng ký - có thể hủy'
            };
        });

        this.pendingCourses = [];

        this.completedCourses = (grades?.gradeItems ?? [])
            .filter(item => item.grade != null)
            .map(item => this.mapGradeItemToCourseInfo(item));
    }

    private mapGradeItemToCourseInfo(item: GradeItem): CourseInfo {
        return {
            courseId: item.courseId,
            courseCode: item.courseCode,
            courseName: item.courseName,
            credit: item.credit ?? 0,
            canRegister: false,
            reason: item.status,
            semester: item.semester
        };
    }

    private mapPaymentDetailToCourseInfo(detail: any, available: CourseInfo[]): CourseInfo {
        const course = available.find(c => c.courseId === detail.courseId);
        if (course) {
            return {
                ...course,
                canRegister: false,
                canUnregister: true
            };
        }

        return {
            courseId: detail.courseId,
            courseCode: detail.courseCode || '---',
            courseName: detail.courseName || 'Môn học chưa rõ',
            credit: detail.credit || 0,
            canRegister: false,
            canUnregister: true
        };
    }

    async onSemesterChange() {
        console.log('Semester changed to:', this.selectedSemester);
        await this.reloadSemesterData();
    }

    async registerCourse(courseId: number) {
        this.processing = true;
        this.error = '';
        this.successMessage = '';

        try {
            const request: CourseRegistrationRequest = {
                courseId: courseId,
                semester: this.selectedSemester
            };

            const response = await firstValueFrom(this.userService.registerCourse(request));

            if (response?.success) {
                this.successMessage = response.message || 'Đăng ký môn học thành công!';
                await this.reloadSemesterData();
            } else {
                this.error = response?.message || 'Lỗi khi đăng ký môn học';
            }
        } catch (error) {
            console.error('Error registering course:', error);
            this.error = 'Lỗi khi đăng ký môn học';
        } finally {
            this.processing = false;
        }
    }

    confirmUnregister(course: CourseInfo) {
        if (confirm(`🤔 Bạn có chắc chắn muốn hủy đăng ký môn "${course.courseName}" (${course.courseCode})?`)) {
            this.unregisterCourse(course.courseId);
        }
    }

    async unregisterCourse(courseId: number) {
        this.processing = true;
        try {
            const response = await firstValueFrom(this.userService.unregisterCourse(courseId));

            if (response?.success) {
                this.successMessage = response.message || 'Hủy đăng ký môn học thành công!';
                await this.reloadSemesterData();
            } else {
                this.error = response?.message || 'Lỗi khi hủy đăng ký môn học';
            }
        } catch (error) {
            console.error('Error unregistering course:', error);
            this.error = 'Lỗi khi hủy đăng ký môn học';
        } finally {
            this.processing = false;
        }
    }

    getTotalEnrolledCredits(): number {
        return this.enrolledCourses.reduce((total, course) => total + course.credit, 0);
    }

    getAvailableCoursesCount(): number {
        return this.availableCourses.length;
    }

    goToSchedule() {
        this.router.navigate(['/user/schedule']);
    }

    goToGrades() {
        this.router.navigate(['/user/grades']);
    }
}
