export interface AdminUser {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: string;
}

export interface UpdateUserRequest {
  fullName: string;
  phoneNumber?: string;
}

export interface AssignRoleRequest {
  userId: string;
  newRole: string;
}

export interface AuditLogEntry {
  auditId: string;
  userId: string;
  userFullName?: string;
  userEmail?: string;
  action?: string;
  entityName?: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface AuditLogFilter {
  userId?: string;
  action?: string;
  entityName?: string;
  fromDate?: string;
  toDate?: string;
}
