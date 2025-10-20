import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeacherService, TeacherScheduleInfo, StudentInfo, SemesterInfo } from './teacher.service';
import { Router } from '@angular/router';
@Component({
    selector: 'app-teacher-classes',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './classes.html',
    styleUrls: ['./classes.css']
})
export class TeacherClassesComponent implements OnInit {
    classes: TeacherScheduleInfo[] = [];
    loading = false;
    error = '';
    selectedSemester = '';
    availableSemesters: SemesterInfo[] = [];

    // Timetable config
    periods: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    days: { label: string; value: string; index: number }[] = [
        { label: 'Mon', value: 'Monday', index: 1 },
        { label: 'Tue', value: 'Tuesday', index: 2 },
        { label: 'Wed', value: 'Wednesday', index: 3 },
        { label: 'Thu', value: 'Thursday', index: 4 },
        { label: 'Fri', value: 'Friday', index: 5 },
        { label: 'Sat', value: 'Saturday', index: 6 },
        { label: 'Sun', value: 'Sunday', index: 7 },
    ];

    events: Array<{
        dayIndex: number;
        start: number;
        end: number;
        title: string;
        room?: string;
        teacher?: string;
        color: string;
    }> = [];

    constructor(private teacherService: TeacherService, private router: Router) { }

    ngOnInit() {
        this.loadSemesters();
        // loadClasses() sẽ được gọi tự động sau khi loadSemesters() hoàn thành
    }

    loadSemesters() {
        this.teacherService.getAllSemesters().subscribe({
            next: (semesters) => {
                console.log('Semesters loaded:', semesters);
                this.availableSemesters = semesters;
                if (semesters.length > 0 && !this.selectedSemester) {
                    this.selectedSemester = semesters[0].semester;
                    // Tự động load classes của kỳ mới nhất
                    this.loadClasses();
                }
            },
            error: (error) => {
                console.error('Error loading semesters:', error);
                this.availableSemesters = [];
            }
        });
    }

    onSemesterChange() {
        console.log('Semester changed to:', this.selectedSemester);
        this.loadClasses();
    }

    private toEvents(data: TeacherScheduleInfo[]) {
        const palette = ['#ff6b35', '#3182ce', '#38a169', '#805ad5', '#319795', '#d53f8c', '#ecc94b'];
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

        const dayToIndex = (d?: string) => this.days.find(x => x.value === d)?.index ?? 1;

        return (data || []).map(c => {
            const { start, end } = parsePeriod(c.period as any);
            const color = palette[idx++ % palette.length];
            return {
                dayIndex: dayToIndex(c.dayOfWeek as any),
                start,
                end: end + 1,
                title: `${c.courseCode} - ${c.courseName}`,
                room: c.classroom || '',
                teacher: '',
                color
            };
        });
    }


    loadClasses() {
        this.loading = true;
        this.error = '';

        this.teacherService.getTeacherClasses(this.selectedSemester).subscribe({
            next: (data) => {
                console.log('Classes loaded successfully:', data);
                this.classes = data;
                this.events = this.toEvents(data);
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading classes:', error);
                this.error = `Lỗi khi tải danh sách lớp học: ${error.status} - ${error.statusText}`;
                this.loading = false;
            }
        });
    }

    getStudentCount(students: StudentInfo[]): number {
        return students.length;
    }

    getGradedCount(classInfo: TeacherScheduleInfo): number {
        return classInfo.gradedCount || 0;
    }

    viewStudents(classInfo: TeacherScheduleInfo) {
        console.log('View students for class:', classInfo);
    }

    gradeStudents(classInfo: TeacherScheduleInfo) {
        console.log('Grade students for class:', classInfo);
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

    logout() {
        if (confirm('🚪 Bạn có chắc chắn muốn đăng xuất?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.clear();
            this.router.navigate(['/login']);
        }
    }
}
