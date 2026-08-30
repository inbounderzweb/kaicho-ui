import { apiFetch } from "./client";
import type { UserRole } from "../constants/roles";
import type { Order, OrderStatus, PaymentStatus } from "./order";

export interface DashboardTrendPoint {
  date: string;
  revenue: number;
  orders: number;
}

// The admin order LIST projection — deliberately slimmer than the full
// Order (lib/api/order.ts), which is what /admin/orders/:id returns.
// `items` is a count here, not the line items.
export interface AdminOrder {
  id: string;
  customer: string;
  items: number;
  total: number;
  status: OrderStatus;
  /** Optional because the dashboard's `recentOrders` projection reuses this
   *  same type and isn't guaranteed to carry payment state — the /admin/orders
   *  list does. Render it conditionally rather than assuming it's there. */
  paymentStatus?: PaymentStatus;
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

export interface AdminOrdersQueryParams extends PageParams {
  status?: OrderStatus | "all";
  paymentStatus?: PaymentStatus | "all";
}

export function fetchAdminOrders({
  status,
  paymentStatus,
  ...pageParams
}: AdminOrdersQueryParams = {}): Promise<Paginated<AdminOrder>> {
  let qs = query(pageParams);
  if (status && status !== "all") qs += `&status=${status}`;
  if (paymentStatus && paymentStatus !== "all") qs += `&paymentStatus=${paymentStatus}`;
  return apiFetch<Paginated<AdminOrder>>(`/admin/orders${qs}`, { method: "GET" });
}

// /admin/orders/:id returns the full Order — the same document the
// customer sees, so it reuses lib/api/order.ts's Order type rather than a
// parallel admin-only copy. `customer` is whatever the backend can join in;
// it may be absent, in which case the UI falls back to userId.
export interface AdminOrderDetail extends Order {
  customer?: {
    userId?: string;
    name?: string;
    phone?: string | null;
    email?: string | null;
  } | null;
  allowedNextStatuses?: OrderStatus[];
}

// adminOrder.controller.ts wraps these as {order}, matching every other
// single-entity controller in the codebase — unwrap that level here.
export async function fetchAdminOrderDetail(id: string): Promise<AdminOrderDetail> {
  const { order } = await apiFetch<{ order: AdminOrderDetail }>(`/admin/orders/${encodeURIComponent(id)}`, {
    method: "GET",
  });
  return order;
}

export async function updateAdminOrderStatus(
  id: string,
  input: { status: OrderStatus; note?: string }
): Promise<AdminOrderDetail> {
  const { order } = await apiFetch<{ order: AdminOrderDetail }>(`/admin/orders/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return order;
}

/** Omit `amount` for a full refund — the backend computes the remaining
 *  refundable amount itself rather than trusting a client-sent total. */
export async function refundAdminOrder(id: string, amount?: number): Promise<AdminOrderDetail> {
  const { order } = await apiFetch<{ order: AdminOrderDetail }>(`/admin/orders/${encodeURIComponent(id)}/refund`, {
    method: "POST",
    body: JSON.stringify(amount === undefined ? {} : { amount }),
  });
  return order;
}
