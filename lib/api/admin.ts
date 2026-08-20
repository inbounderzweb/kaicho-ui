import { apiFetch } from "./client";
import type { UserRole } from "../constants/roles";

export interface DashboardTrendPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface AdminOrder {
  id: string;
  customer: string;
  items: number;
  total: number;
  status: "Processing" | "On the way" | "Delivered" | "Cancelled";
  placedAt: string;
}

export interface DashboardSummary {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    totalUsers: number;
    totalProducts: number;
  };
  trend: DashboardTrendPoint[];
  recentOrders: AdminOrder[];
}

export type UsersSortField = "createdAt" | "lastLoginAt" | "phone" | "role";
export type SortOrder = "asc" | "desc";
export type UsersStatusFilter = "all" | "active" | "inactive";
export type UsersRoleFilter = "all" | UserRole;

export interface AdminUser {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  role: string;
  status: "Active" | "Inactive";
  joinedAt: string;
  lastLoginAt: string | null;
}

export interface AdminUserAddress {
  id?: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface AdminUserDetail extends AdminUser {
  countryCode: string;
  addresses: AdminUserAddress[];
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersLast30Days: number;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PageParams {
  page?: number;
  pageSize?: number;
}

export interface UsersQueryParams extends PageParams {
  sortBy?: UsersSortField;
  sortOrder?: SortOrder;
  search?: string;
  status?: UsersStatusFilter;
  role?: UsersRoleFilter;
  dateFrom?: string;
  dateTo?: string;
}

function query({ page = 1, pageSize = 10 }: PageParams): string {
  return `?page=${page}&pageSize=${pageSize}`;
}

export function fetchAdminDashboard(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>("/admin/dashboard", { method: "GET" });
}

export function fetchAdminUserStats(): Promise<UserStats> {
  return apiFetch<UserStats>("/admin/users/stats", { method: "GET" });
}

export function fetchAdminUsers({
  sortBy,
  sortOrder,
  search,
  status,
  role,
  dateFrom,
  dateTo,
  ...pageParams
}: UsersQueryParams = {}): Promise<Paginated<AdminUser>> {
  let qs = query(pageParams);
  if (sortBy) qs += `&sortBy=${sortBy}`;
  if (sortOrder) qs += `&sortOrder=${sortOrder}`;
  if (search) qs += `&search=${encodeURIComponent(search)}`;
  if (status && status !== "all") qs += `&status=${status}`;
  if (role && role !== "all") qs += `&role=${role}`;
  if (dateFrom) qs += `&dateFrom=${encodeURIComponent(dateFrom)}`;
  if (dateTo) qs += `&dateTo=${encodeURIComponent(dateTo)}`;
  return apiFetch<Paginated<AdminUser>>(`/admin/users${qs}`, { method: "GET" });
}

export function fetchAdminUserDetail(id: string): Promise<{ user: AdminUserDetail }> {
  return apiFetch<{ user: AdminUserDetail }>(`/admin/users/${encodeURIComponent(id)}`, { method: "GET" });
}

export function updateAdminUser(id: string, patch: UpdateUserInput): Promise<{ user: AdminUserDetail }> {
  return apiFetch<{ user: AdminUserDetail }>(`/admin/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function fetchAdminOrders(params: PageParams = {}): Promise<Paginated<AdminOrder>> {
  return apiFetch<Paginated<AdminOrder>>(`/admin/orders${query(params)}`, { method: "GET" });
}
