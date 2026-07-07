import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { StudentsPage } from '@/pages/students/StudentsPage';
import { StudentDetailPage } from '@/pages/students/StudentDetailPage';
import { MyChildrenPage } from '@/pages/parent/MyChildrenPage';
import { UsersPage } from '@/pages/users/UsersPage';
import { AttendancePage } from '@/pages/attendance/AttendancePage';
import { TimetablePage } from '@/pages/timetable/TimetablePage';
import { HomeworkPage } from '@/pages/homework/HomeworkPage';
import { NoticesPage } from '@/pages/notices/NoticesPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated area */}
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Shared (backend enforces per-record access) */}
          <Route path="/students/:id" element={<StudentDetailPage />} />
          <Route path="/timetable" element={<TimetablePage />} />
          <Route path="/homework" element={<HomeworkPage />} />
          <Route path="/notices" element={<NoticesPage />} />

          {/* Admin / Teacher */}
          <Route element={<RoleGuard allow={['ADMIN', 'TEACHER']} />}>
            <Route path="/students" element={<StudentsPage />} />
          </Route>

          {/* Teacher only */}
          <Route element={<RoleGuard allow={['TEACHER']} />}>
            <Route path="/attendance" element={<AttendancePage />} />
          </Route>

          {/* Parent only */}
          <Route element={<RoleGuard allow={['PARENT']} />}>
            <Route path="/children" element={<MyChildrenPage />} />
          </Route>

          {/* Admin only */}
          <Route element={<RoleGuard allow={['ADMIN']} />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
