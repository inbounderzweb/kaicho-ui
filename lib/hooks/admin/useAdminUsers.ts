import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchAdminUsers, type UsersQueryParams } from "../../api/admin";
import { adminKeys } from "../query-keys";

export function useAdminUsers(params: UsersQueryParams = {}) {
  const {
    page = 1,
    pageSize = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    search,
    status = "all",
    role = "all",
    dateFrom,
    dateTo,
  } = params;

  const normalized: UsersQueryParams = {
    page,
    pageSize,
    sortBy,
    sortOrder,
    search,
    status,
    role,
    dateFrom,
    dateTo,
  };

  return useQuery({
    queryKey: adminKeys.users(normalized),
    queryFn: () => fetchAdminUsers(normalized),
    staleTime: 60_000,
    // Keeps the current page's rows on screen while the next page/sort/
    // filter loads, instead of the table flashing to a loading state.
    placeholderData: keepPreviousData,
  });
}
