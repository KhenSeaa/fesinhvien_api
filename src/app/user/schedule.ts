import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, StudentScheduleDetail, SemesterInfo } from './user.service';
import { AuthService } from '../auth.service';
import { StudentGuardService } from './student-guard.service';

@Component({
    selector: 'app-user-schedule',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './schedule.html',
    styleUrls: ['./schedule.css']
})
export class UserScheduleComponent implements OnInit {
    scheduleList: StudentScheduleDetail[] = [];
    loading = false;
    error = '';
    selectedSemester = '';
    studentId: number;
    availableSemesters: SemesterInfo[] = [];
    isStudent: boolean = false;
    hasScheduleGenerated = false;
    totalCredits = 0;

    // Timetable config
    periods: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    days: { label: string; value: string; index: number; date: string }[] = [
        { label: 'Thứ 2', value: 'Thứ 2', index: 1, date: '25/11' },
        { label: 'Thứ 3', value: 'Thứ 3', index: 2, date: '26/11' },
        { label: 'Thứ 4', value: 'Thứ 4', index: 3, date: '27/11' },
        { label: 'Thứ 5', value: 'Thứ 5', index: 4, date: '28/11' },
        { label: 'Thứ 6', value: 'Thứ 6', index: 5, date: '29/11' },
        { label: 'Thứ 7', value: 'Thứ 7', index: 6, date: '30/11' },
        { label: 'CN', value: 'Chủ nhật', index: 7, date: '01/12' },
    ];

    events: Array<{
        dayIndex: number;
        start: number;
        end: number;
        title: string;
        lecturer?: string;
        room?: string;
        credit: number;
        color: string;
    }> = [];

    constructor(
        private userService: UserService,
        private router: Router,
        private authService: AuthService,
        private studentGuard: StudentGuardService
    ) {
        this.studentId = this.authService.getCurrentUserId();
    }

    ngOnInit() {
        this.loadSemesters();
        this.loadSchedule();
    }

    loadSemesters() {
        this.userService.getAllSemesters().subscribe({
            next: (semesters) => {
                console.log('Semesters loaded:', semesters);
                this.availableSemesters = semesters;
                if (semesters.length > 0 && !this.selectedSemester) {
                    this.selectedSemester = semesters[0].semester;
                }
            },
            error: (error) => {
                if (!this.studentGuard.handleStudentError(error)) {
                    console.error('Error loading semesters:', error);
                }
                this.availableSemesters = [];
            }
        });
    }

    loadSchedule() {
        this.loading = true;
        this.error = '';

        // Kiểm tra xem đã có schedule chưa
        this.userService.hasSchedule(this.selectedSemester).subscribe({
            next: (exists) => {
                this.hasScheduleGenerated = exists;
                if (exists) {
                    // Nếu đã có, lấy schedule
                    this.fetchScheduleList();
                } else {
                    // Nếu chưa có, tạo mới
                    this.generateSchedule();
                }
            },
            error: (error) => {
                if (!this.studentGuard.handleStudentError(error)) {
                    console.error('Error checking schedule:', error);
                    // Nếu lỗi, thử lấy luôn
                    this.fetchScheduleList();
                } else {
                    this.loading = false;
                }
            }
        });
    }

    fetchScheduleList() {
        this.userService.getStudentScheduleList(this.selectedSemester).subscribe({
            next: (data) => {
                console.log('Schedule loaded successfully:', data);
                this.scheduleList = data;
                this.totalCredits = this.calculateTotalCredits(data);
                this.events = this.toEvents(data);
                this.isStudent = true;
                this.loading = false;
            },
            error: (error) => {
                if (!this.studentGuard.handleStudentError(error)) {
                    console.error('Error loading schedule:', error);
                    if (error.status === 400) {
                        this.isStudent = false;
                        this.scheduleList = [];
                        this.events = [];
                    } else {
                        this.error = `Lỗi khi tải thời khóa biểu: ${error.status} - ${error.statusText}`;
                    }
                }
                this.loading = false;
            }
        });
    }

    generateSchedule() {
        this.userService.generateSchedule(this.selectedSemester).subscribe({
            next: (message) => {
                console.log('Schedule generated:', message);
                this.hasScheduleGenerated = true;
                // Sau khi tạo xong, lấy schedule
                this.fetchScheduleList();
            },
            error: (error) => {
                if (!this.studentGuard.handleStudentError(error)) {
                    console.error('Error generating schedule:', error);
                    this.error = `Lỗi khi tạo thời khóa biểu: ${error.error || error.statusText}`;
                }
                this.loading = false;
            }
        });
    }

    private calculateTotalCredits(scheduleList: StudentScheduleDetail[]): number {
        return scheduleList.reduce((sum, item) => sum + (item.credit || 0), 0);
    }

    private toEvents(scheduleList: StudentScheduleDetail[]) {
        const palette = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'];
        let idx = 0;

        const parsePeriod = (p?: string): { start: number; end: number } => {
            if (!p) return { start: 1, end: 1 };
            const m = p.match(/(\d+)\s*-\s*(\d+)/);
            if (m) {
                const s = Math.max(1, Math.min(10, Number(m[1])));
                const e = Math.max(s, Math.min(10, Number(m[2])));
                return { start: s, end: e };
            }
            const n = Number(p);
            return { start: isNaN(n) ? 1 : n, end: isNaN(n) ? 1 : n };
        };

        const dayToIndex = (d?: string) => {
            const dayMap: { [key: string]: number } = {
                'Thứ 2': 1, 'Monday': 1,
                'Thứ 3': 2, 'Tuesday': 2,
                'Thứ 4': 3, 'Wednesday': 3,
                'Thứ 5': 4, 'Thursday': 4,
                'Thứ 6': 5, 'Friday': 5,
                'Thứ 7': 6, 'Saturday': 6,
                'Chủ nhật': 7, 'Sunday': 7
            };
            return dayMap[d || ''] || 1;
        };

        return scheduleList.map(item => {
            const { start, end } = parsePeriod(item.period);
            const color = palette[idx++ % palette.length];

            return {
                dayIndex: dayToIndex(item.dayOfWeek),
                start,
                end: end + 1, // CSS grid end is exclusive
                title: `${item.courseCode} - ${item.courseName}`,
                lecturer: item.lecturerName || 'Chưa phân công',
                room: item.classroom || 'Chưa xác định',
                credit: item.credit,
                color
            };
        });
    }

    onSemesterChange() {
        this.loadSchedule();
    }

    getPeriodTime(period: number, isEnd: boolean = false): string {
        // Mỗi tiết 45 phút, bắt đầu từ 7:00, nghỉ 15 phút giữa các tiết
        const startHour = 7;
        const periodDuration = 45; // minutes
        const breakDuration = 15; // minutes

        let totalMinutes = (period - 1) * (periodDuration + breakDuration);
        if (isEnd) {
            totalMinutes += periodDuration;
        }

        const hours = Math.floor(totalMinutes / 60) + startHour;
        const minutes = totalMinutes % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    getEventTooltip(event: any): string {
        return `${event.title}\nGiảng viên: ${event.lecturer}\nPhòng: ${event.room}\nTín chỉ: ${event.credit}`;
    }

    goToGrades() {
        this.router.navigate(['/user/grades']);
    }

    goToRegistration() {
        this.router.navigate(['/user/registration']);
    }

    exportSchedule() {
        // TODO: Implement export functionality
        alert('Tính năng xuất thời khóa biểu sẽ được phát triển trong phiên bản tiếp theo!');
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
