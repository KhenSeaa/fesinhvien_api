import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface SemesterEntity {
  id?: number;
  semester: string;
}

@Component({
  selector: 'admin-semesters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './semesters.html',
  styleUrls: ['./admin-common.css']
})
export class AdminSemestersComponent {
  baseUrl: string = 'https://besinhvien-apideploy-1b0v7w.fly.dev//api/semesters';
  semesters: SemesterEntity[] = [];
  filteredSemesters: SemesterEntity[] = [];
  searchText: string = '';
  form: SemesterEntity = { semester: '' };
  editingId: number | null = null;

  constructor(private http: HttpClient, private router: Router) {
    this.loadSemesters();
  }

  loadSemesters() {
    this.http.get<SemesterEntity[]>(this.baseUrl).subscribe({
      next: data => { this.semesters = data || []; this.applyFilter(); },
      error: err => console.error('Load semesters failed', err)
    });
  }

  applyFilter() {
    const q = (this.searchText || '').trim().toLowerCase();
    if (!q) { this.filteredSemesters = [...this.semesters]; return; }
    this.filteredSemesters = this.semesters.filter(s => (
      (s.semester || '').toLowerCase().includes(q)
    ));
  }

  reset() {
    this.form = { semester: '' };
    this.editingId = null;
  }

  selectForEdit(s: SemesterEntity) {
    this.editingId = s.id ?? null;
    this.form = { id: s.id, semester: s.semester || '' } as SemesterEntity;
  }

  save() {
    const payload: SemesterEntity = {
      semester: (this.form.semester || '').trim()
    };
    if (!payload.semester) return;

    if (this.editingId) {
      this.http.put(`${this.baseUrl}/${this.editingId}`, payload, { responseType: 'text' }).subscribe({
        next: () => { this.loadSemesters(); this.reset(); },
        error: err => console.error('Update failed', err)
      });
    } else {
      this.http.post(this.baseUrl, payload, { responseType: 'text' }).subscribe({
        next: () => { this.loadSemesters(); this.reset(); },
        error: err => console.error('Create failed', err)
      });
    }
  }

  remove(id?: number) {
    if (!id) return;
    if (!confirm('⚠️ Bạn có chắc chắn muốn xóa học kỳ này?\n\nThao tác này không thể hoàn tác!')) return;
    this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' }).subscribe({
      next: () => this.loadSemesters(),
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
