import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export interface StudentErrorInfo {
    isStudentNotConfirmed: boolean;
    message: string;
    showAlert: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class StudentGuardService {
    
    /**
     * Kiểm tra lỗi có phải là "chưa được xác nhận sinh viên" không
     */
    checkStudentError(error: any): StudentErrorInfo {
        const result: StudentErrorInfo = {
            isStudentNotConfirmed: false,
            message: '',
            showAlert: false
        };

        // Nếu không phải HttpErrorResponse, trả về mặc định
        if (!(error instanceof HttpErrorResponse)) {
            return result;
        }

        // Kiểm tra status code
        if (error.status === 403 || error.status === 404) {
            // Check error message từ backend
            const errorMessage = typeof error.error === 'string' ? error.error : error.message;
            
            if (errorMessage && (
                errorMessage.includes('không tìm thấy sinh viên') ||
                errorMessage.includes('Student not found') ||
                errorMessage.includes('chưa được xác nhận') ||
                errorMessage.includes('not confirmed')
            )) {
                result.isStudentNotConfirmed = true;
                result.message = 'Tài khoản của bạn chưa được xác nhận là sinh viên. Vui lòng liên hệ quản trị viên để được hỗ trợ.';
                result.showAlert = true;
            }
        }

        return result;
    }

    /**
     * Hiển thị thông báo lỗi thân thiện
     */
    showStudentNotConfirmedAlert(): void {
        alert('⚠️ Tài khoản chưa được xác nhận\n\nTài khoản của bạn chưa được xác nhận là sinh viên. Vui lòng liên hệ quản trị viên để được hỗ trợ.');
    }

    /**
     * Xử lý lỗi chung cho các API calls của student
     * Trả về true nếu đã xử lý lỗi, false nếu cần xử lý thêm
     */
    handleStudentError(error: any, showAlert: boolean = true): boolean {
        const errorInfo = this.checkStudentError(error);
        
        if (errorInfo.isStudentNotConfirmed) {
            if (showAlert && errorInfo.showAlert) {
                this.showStudentNotConfirmedAlert();
            }
            // Không log error ra console nữa
            return true; // Đã xử lý
        }

        return false; // Chưa xử lý, component có thể xử lý thêm
    }
}
