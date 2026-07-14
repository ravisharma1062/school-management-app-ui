// These types are hand-mirrored from the backend DTOs (see api-docs/openapi.json).
// Keep them in sync with the backend contract.

export type Role = 'ADMIN' | 'TEACHER' | 'PARENT';

export type LanguageCode = 'EN' | 'HI';

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
  preferredLanguage: LanguageCode;
  billingOwner: boolean;
}

export interface UserLanguageUpdateRequest {
  preferredLanguage: LanguageCode;
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
  active: boolean;
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

export interface StudentSearchParams extends PageParams {
  name?: string;
  rollNo?: string;
  studentClass?: string;
  includeArchived?: boolean;
}

export interface BulkImportRowError {
  row: number;
  message: string;
}

export interface BulkImportResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  errors: BulkImportRowError[];
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
  active: boolean;
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

// --- Homework Submissions ---
export type HomeworkSubmissionStatus = 'SUBMITTED' | 'GRADED';

export interface HomeworkSubmissionDto {
  id: string;
  homeworkId: string;
  studentId: string;
  fileName: string;
  contentType: string;
  status: HomeworkSubmissionStatus;
  teacherFeedback?: string | null;
  grade?: string | null;
  submittedAt: string;
}

export interface HomeworkSubmissionGradeRequest {
  teacherFeedback?: string;
  grade: string;
}

// --- Notification Preferences ---
export type NotificationEventType =
  | 'ATTENDANCE_ABSENT'
  | 'FEE_OVERDUE'
  | 'NOTICE_CREATED'
  | 'EXAM_RESULT_PUBLISHED'
  | 'USER_WELCOME'
  | 'MESSAGE_RECEIVED';

export interface NotificationPreferenceDto {
  eventType: NotificationEventType;
  smsEnabled: boolean;
  emailEnabled: boolean;
}

export interface NotificationPreferenceUpdateRequest {
  smsEnabled: boolean;
  emailEnabled: boolean;
}

// --- Leave Requests ---
export type LeaveType = 'SICK' | 'CASUAL' | 'OTHER';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveRequestDto {
  id: string;
  requesterId: string;
  type: LeaveType;
  fromDate: string;
  toDate: string;
  reason?: string | null;
  status: LeaveStatus;
  reviewedBy?: string | null;
  createdAt: string;
}

export interface LeaveRequestCreateRequest {
  type: LeaveType;
  fromDate: string;
  toDate: string;
  reason?: string;
}

export interface LeaveRequestReviewRequest {
  status: Exclude<LeaveStatus, 'PENDING'>;
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
  active: boolean;
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

// --- Payments ---
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface PaymentDto {
  id: string;
  feeId: string;
  amount: number;
  gatewayOrderId?: string | null;
  gatewayPaymentId?: string | null;
  status: PaymentStatus;
  initiatedBy: string;
  paidAt?: string | null;
  createdAt: string;
}

export interface PaymentInitiateRequest {
  feeId: string;
}

export interface PaymentInitiateResponse {
  gatewayOrderId: string;
  amountInSmallestUnit: number;
  currency: string;
  gatewayKeyId: string;
}

// --- Messaging ---
export interface ConversationDto {
  id: string;
  parentId: string;
  parentName: string;
  teacherId: string;
  teacherName: string;
  createdAt: string;
}

export interface ConversationCreateRequest {
  otherUserId: string;
}

export interface ConversationContactDto {
  id: string;
  name: string;
  email: string;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  sentAt: string;
}

export interface MessageCreateRequest {
  body: string;
}

// --- Analytics ---
export interface AttendanceTrendPointDto {
  date: string;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendancePercentage: number;
}

export interface FeeSummaryDto {
  totalDue: number;
  totalPaid: number;
  totalOutstanding: number;
  collectionPercentage: number;
  pendingCount: number;
  partialCount: number;
  paidCount: number;
  overdueCount: number;
}

export interface AtRiskStudentDto {
  studentId: string;
  studentName: string;
  studentClass: string;
  section: string;
  attendancePercentage?: number | null;
  attendanceAtRisk: boolean;
  feeAtRisk: boolean;
  maxDaysOverdue?: number | null;
}

// --- Events ---
export type RsvpStatus = 'GOING' | 'MAYBE' | 'NOT_GOING';

export interface EventDto {
  id: string;
  title: string;
  description?: string | null;
  eventDate: string;
  location?: string | null;
  createdBy: string;
  createdAt: string;
  myRsvpStatus?: RsvpStatus | null;
}

export interface EventCreateRequest {
  title: string;
  description?: string;
  eventDate: string;
  location?: string;
}

export interface EventRsvpDto {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  status: RsvpStatus;
  respondedAt: string;
}

export interface EventRsvpRequest {
  status: RsvpStatus;
}

// --- Transport ---
export interface BusStopDto {
  id: string;
  name: string;
  stopOrder: number;
  latitude: number;
  longitude: number;
}

export interface BusStopCreateRequest {
  name: string;
  stopOrder: number;
  latitude: number;
  longitude: number;
}

export interface BusRouteAdminDto {
  id: string;
  name: string;
  description?: string | null;
  locationToken: string;
  stops: BusStopDto[];
  createdAt: string;
}

export interface BusRouteSummaryDto {
  id: string;
  name: string;
  description?: string | null;
  stopCount: number;
}

export interface BusRouteCreateRequest {
  name: string;
  description?: string;
  stops: BusStopCreateRequest[];
}

export interface BusLocationDto {
  latitude?: number | null;
  longitude?: number | null;
  updatedAt?: string | null;
}

export interface StudentTransportDto {
  studentId: string;
  routeId: string;
  routeName: string;
  stopId: string;
  stopName: string;
  stopLatitude: number;
  stopLongitude: number;
}

export interface StudentTransportAssignRequest {
  routeId: string;
  stopId: string;
}

// --- Library ---
export type BookIssueStatus = 'ISSUED' | 'RETURNED';

export interface BookDto {
  id: string;
  title: string;
  author: string;
  isbn?: string | null;
  hasCoverImage: boolean;
  totalCopies: number;
  availableCopies: number;
}

export interface BookCreateRequest {
  title: string;
  author: string;
  isbn?: string;
  totalCopies: number;
}

export interface BookIssueDto {
  id: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  issuedAt: string;
  dueDate: string;
  returnedAt?: string | null;
  fineAmount?: number | null;
  status: BookIssueStatus;
}

export interface BookIssueCreateRequest {
  bookId: string;
  studentId: string;
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

// --- Subscription / Entitlements (Phase MT-2) ---
export type PlanCode = 'BASIC' | 'STANDARD' | 'PREMIUM';

export type SchoolStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED';

export type FeatureKey =
  | 'EMAIL_NOTIFICATIONS'
  | 'SMS_NOTIFICATIONS'
  | 'ONLINE_PAYMENTS'
  | 'MESSAGING'
  | 'TRANSPORT_TRACKING'
  | 'LIBRARY'
  | 'ANALYTICS'
  | 'MAX_STUDENTS'
  | 'BRANDING';

export interface EntitlementDto {
  featureKey: FeatureKey;
  enabled: boolean;
  limitValue: number | null;
  currentUsage: number | null;
}

export interface SubscriptionDto {
  planCode: PlanCode;
  planName: string;
  status: SchoolStatus;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  entitlements: EntitlementDto[];
}

/** Machine-readable error codes the backend's ErrorResponse.code can carry. */
export type ErrorCode = 'SUBSCRIPTION_SUSPENDED' | 'SUBSCRIPTION_PAST_DUE' | 'FEATURE_NOT_ENTITLED' | 'LIMIT_EXCEEDED';

// --- Branding (Phase MT-6a) ---
export interface BrandingDto {
  hasLogo: boolean;
  primaryColor: string | null;
  secondaryColor: string | null;
}
