// These types are hand-mirrored from the backend DTOs (see api-docs/openapi.json).
// Keep them in sync with the backend contract.

export type Role = 'ADMIN' | 'TEACHER' | 'PARENT';

export type TargetRole = 'ADMIN' | 'TEACHER' | 'PARENT' | 'ALL';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export type FeeStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

// --- Auth ---
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  role: Role;
}

// --- Users ---
export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
}

export interface UserCreateRequest {
  name: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
}

// --- Students ---
export interface StudentDto {
  id: string;
  name: string;
  rollNo: string;
  studentClass: string;
  section: string;
  dob: string; // ISO date (yyyy-MM-dd)
  parentId?: string | null;
}

export interface StudentCreateRequest {
  name: string;
  rollNo: string;
  studentClass: string;
  section: string;
  dob: string;
  parentId?: string;
}

export interface StudentUpdateRequest {
  name?: string;
  rollNo?: string;
  studentClass?: string;
  section?: string;
  dob?: string;
  parentId?: string;
}

// --- Attendance ---
export interface AttendanceDto {
  id: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  markedBy: string;
}

export interface AttendanceMarkRequest {
  studentId: string;
  date: string;
  status: AttendanceStatus;
}

// --- Timetable ---
export interface TimetableDto {
  id: string;
  studentClass: string;
  section: string;
  dayOfWeek: DayOfWeek;
  period: number;
  subject: string;
  teacherId: string;
}

export interface TimetableCreateRequest {
  studentClass: string;
  section: string;
  dayOfWeek: DayOfWeek;
  period: number;
  subject: string;
  teacherId: string;
}

// --- Homework ---
export interface HomeworkDto {
  id: string;
  studentClass: string;
  section: string;
  subject: string;
  title: string;
  description?: string | null;
  dueDate: string;
  createdBy: string;
  createdAt: string; // ISO date-time
}

export interface HomeworkCreateRequest {
  studentClass: string;
  section: string;
  subject: string;
  title: string;
  description?: string;
  dueDate: string;
}

// --- Exam Results ---
export interface ExamResultDto {
  id: string;
  studentId: string;
  subject: string;
  examName: string;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  term: string;
}

export interface ExamResultCreateRequest {
  studentId: string;
  subject: string;
  examName: string;
  marksObtained: number;
  maxMarks: number;
  term: string;
}

// --- Notices ---
export interface NoticeDto {
  id: string;
  title: string;
  description?: string | null;
  targetRole: TargetRole;
  createdBy: string;
  createdAt: string;
}

export interface NoticeCreateRequest {
  title: string;
  description?: string;
  targetRole: TargetRole;
}

// --- Fees ---
export interface FeeDto {
  id: string;
  studentId: string;
  term: string;
  amountDue: number;
  amountPaid: number;
  status: FeeStatus;
  dueDate: string;
}

export interface FeeUpdateRequest {
  amountPaid?: number;
  status?: FeeStatus;
}

// --- Spring Data Page<T> (subset we actually use) ---
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // current page index (0-based)
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface PageParams {
  page?: number;
  size?: number;
  sort?: string;
}
