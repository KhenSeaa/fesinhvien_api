import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface Department {
  id?: number;
  name: string;
  code: string;
}

@Component({
  selector: 'admin-departments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './departments.html',
  styleUrls: ['./admin-common.css']
})
export class AdminDepartmentsComponent {
  baseUrl: string = 'http://localhost:8080/api/departments';
  departments: Department[] = [];
  filteredDepartments: Department[] = [];
  searchText: string = '';
  form: Department = { name: '', code: '' };
  editingId: number | null = null;

  constructor(private http: HttpClient, private router: Router) {
    this.loadDepartments();
  }

  loadDepartments() {
    this.http.get<Department[]>(this.baseUrl).subscribe({
      next: data => { this.departments = data || []; this.applyFilter(); },
      error: err => console.error('Load departments failed', err)
    });
  }

  applyFilter() {
    const q = (this.searchText || '').trim().toLowerCase();
    if (!q) { this.filteredDepartments = [...this.departments]; return; }
    this.filteredDepartments = this.departments.filter(d =>
      (d.name || '').toLowerCase().includes(q) ||
      (d.code || '').toLowerCase().includes(q)
    );
  }

  reset() {
    this.form = { name: '', code: '' };
    this.editingId = null;
  }

  selectForEdit(d: Department) {
    this.editingId = d.id ?? null;
    this.form = { id: d.id, name: d.name, code: d.code };
  }

  save() {
    const payload: Department = {
      name: (this.form.name || '').trim(),
      code: (this.form.code || '').trim()
    };
    if (!payload.name || !payload.code) return;

    if (this.editingId) {
      this.http.put(`${this.baseUrl}/${this.editingId}`, payload, { responseType: 'text' }).subscribe({
        next: () => { this.loadDepartments(); this.reset(); },
        error: err => console.error('Update failed', err)
      });
    } else {
      this.http.post(this.baseUrl, payload, { responseType: 'text' }).subscribe({
        next: () => { this.loadDepartments(); this.reset(); },
        error: err => console.error('Create failed', err)
      });
    }
  }

  remove(id?: number) {
    if (!id) return;
    if (!confirm('⚠️ Bạn có chắc chắn muốn xóa khoa này?')) return;
    this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' }).subscribe({
      next: () => this.loadDepartments(),
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
