import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ===== Student Portal Interfaces (Simple like Teacher) =====

/**
 * DTO trả về từ backend - lấy từ bảng student_schedule
 */
export interface StudentScheduleDetail {
    id: number;
    studentId: number;
    enrollmentId: number;
    teachingId: number;
    semester: string;
    courseId: number;
    courseCode: string;
    courseName: string;
    credit: number;
    dayOfWeek: string;
    period: string;
    classroom: string;
    lecturerId: number;
    lecturerName: string;
}

export interface ScheduleItem {
    courseId: number;
    courseCode: string;
    courseName: string;
    credit: number;
    period: string;
    dayOfWeek: string;
    lecturerName: string;
    className: string;
    room: string;
    classroom?: string;
}

export interface StudentSchedule {
    studentId: number;
    studentCode: string;
    studentName: string;
    semester: string;
    totalCredits: number;
    scheduleItems: ScheduleItem[];
}

export interface GradeItem {
    courseId: number;
    courseCode: string;
    courseName: string;
    credit: number;
    componentScore1?: number | null;
    componentScore2?: number | null;
    finalExamScore?: number | null;
    totalScore?: number | null;
    scoreCoefficient4?: number | null;
    grade?: string | null;
    semester: string;
    status: string;
}

export interface StudentGrades {
    studentId: number;
    studentCode: string;
    studentName: string;
    gpa: number;
    totalCredits: number;
    completedCredits: number;
    gradeItems: GradeItem[];
    // Statistics from backend
    totalCourses?: number;
    completedCourses?: number;
    inProgressCourses?: number;
}

export interface CourseInfo {
    courseId: number;
    courseCode: string;
    courseName: string;
    credit: number;
    canRegister: boolean;
    reason?: string;
    availableSlots?: number;
    maxSlots?: number;
    lecturerName?: string;
    period?: string;
    dayOfWeek?: string;
    classroom?: string;
    semester?: string;
    canUnregister?: boolean;
    registrationStatus?: string;
}

export interface CourseRegistrationRequest {
    courseId: number;
    semester: string;
}

export interface CourseRegistrationResponse {
    success: boolean;
    message: string;
}

export interface StudentProfile {
    studentId: number;
    studentCode: string;
    fullName: string;
    email: string;
    phone: string;
    className: string;
    departmentName: string;
    year: string;
}

export interface ChangePasswordRequest {
    newPassword: string;
    confirmPassword: string;
}

export interface ApiResponse {
    success: boolean;
    message: string;
}

export interface SemesterInfo {
    id: number;
    semester: string;
    displayName: string;
}

export interface PaymentDetailDTO {
    id?: number;
    paymentId?: number;
    enrollmentId: number;
    semester: string;
    courseId: number;
    courseCode: string;
    courseName: string;
    credit: number;
    fee: number;
}

export interface PaymentInfo {
    semesterId: number;
    semester: string;
    semesterDisplayName: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    paymentStatus: string;
    paymentDate?: string;
    paymentDetails: PaymentDetailDTO[];
    canCreatePayment: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private baseUrl = '/api/student';

    constructor(private http: HttpClient) { }

    /**
     * Lấy thời khóa biểu của sinh viên hiện tại (deprecated - use getStudentScheduleList)
     */
    getStudentSchedule(semester: string = '2024-1'): Observable<StudentSchedule> {
        return this.http.get<StudentSchedule>(`${this.baseUrl}/schedule?semester=${semester}`);
    }

    /**
     * Lấy thời khóa biểu từ bảng student_schedule (API mới)
     */
    getStudentScheduleList(semester: string = '2024-1'): Observable<StudentScheduleDetail[]> {
        return this.http.get<StudentScheduleDetail[]>(`${this.baseUrl}/schedule-list?semester=${semester}`);
    }

    /**
     * Tạo/cập nhật thời khóa biểu cho sinh viên
     */
    generateSchedule(semester: string = '2024-1'): Observable<string> {
        return this.http.post(`${this.baseUrl}/schedule/generate?semester=${semester}`, {}, { responseType: 'text' });
    }

    /**
     * Kiểm tra sinh viên đã có thời khóa biểu chưa
     */
    hasSchedule(semester: string = '2024-1'): Observable<boolean> {
        return this.http.get<boolean>(`${this.baseUrl}/schedule/exists?semester=${semester}`);
    }

    /**
     * Lấy bảng điểm của sinh viên hiện tại theo semester
     */
    getStudentGrades(semester?: string): Observable<StudentGrades> {
        const url = semester ? `${this.baseUrl}/grades?semester=${semester}` : `${this.baseUrl}/grades`;
        return this.http.get<StudentGrades>(url);
    }

    /**
     * Đăng ký môn học
     */
    registerCourse(request: CourseRegistrationRequest): Observable<CourseRegistrationResponse> {
        return this.http.post<CourseRegistrationResponse>(`${this.baseUrl}/register-course`, request);
    }

    /**
     * Lấy danh sách môn học có thể đăng ký
     */
    getAvailableCourses(semester: string = '2024-1'): Observable<CourseInfo[]> {
        return this.http.get<CourseInfo[]>(`${this.baseUrl}/available-courses?semester=${semester}`);
    }

    /**
     * Hủy đăng ký môn học
     */
    unregisterCourse(courseId: number): Observable<CourseRegistrationResponse> {
        return this.http.delete<CourseRegistrationResponse>(`${this.baseUrl}/courses/${courseId}`);
    }

    /**
     * Lấy danh sách semesters (deprecated - use getAllSemesters)
     */
    getSemesters(): Observable<string[]> {
        return this.http.get<string[]>(`${this.baseUrl}/semesters`);
    }

    /**
     * Lấy danh sách tất cả semesters từ database
     */
    getAllSemesters(): Observable<SemesterInfo[]> {
        return this.http.get<SemesterInfo[]>(`${this.baseUrl}/semesters`);
    }

    /**
     * Lấy thông tin cá nhân của sinh viên
     */
    getStudentProfile(): Observable<StudentProfile> {
        return this.http.get<StudentProfile>(`${this.baseUrl}/profile`);
    }

    /**
     * Thay đổi mật khẩu
     */
    changePassword(request: ChangePasswordRequest): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.baseUrl}/change-password`, request);
    }

    /**
     * Lấy thông tin thanh toán học phí theo semester
     */
    getPaymentInfo(semester?: string): Observable<PaymentInfo> {
        let url = `${this.baseUrl}/payment`;
        if (semester) {
            url += `?semester=${semester}`;
        }
        return this.http.get<PaymentInfo>(url);
    }

    /**
     * Lấy thông tin thanh toán học phí của tất cả semester
     */
    getAllPaymentInfo(): Observable<PaymentInfo[]> {
        return this.http.get<PaymentInfo[]>(`${this.baseUrl}/payments/all`);
    }

    /**
     * Tạo payment record
     */
    createPayment(semester?: string): Observable<string> {
        let url = `${this.baseUrl}/payment/create`;
        if (semester) {
            url += `?semester=${semester}`;
        }
        return this.http.post(url, null, { responseType: 'text' });
    }
}
