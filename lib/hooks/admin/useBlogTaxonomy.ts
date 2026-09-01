"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchBlogCategories,
  fetchBlogCategoryOptions,
  fetchBlogCategoryDetail,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  type BlogCategoryFormInput,
  type BlogCategoryStatus,
} from "../../api/blogCategory";
import { fetchBlogTags, createBlogTag } from "../../api/blogTag";
import { blogCategoryKeys, blogTagKeys } from "../query-keys";

const CAT_LIST_KEY = ["admin", "blog-categories", "list"];

export function useBlogCategoryList(params: { search?: string; status?: BlogCategoryStatus | "all" } = {}) {
  return useQuery({
    queryKey: blogCategoryKeys.list(params),
    queryFn: () => fetchBlogCategories(params),
    staleTime: 30_000,
  });
}

export function useBlogCategoryOptions() {
  return useQuery({
    queryKey: blogCategoryKeys.options,
    queryFn: fetchBlogCategoryOptions,
    staleTime: 60_000,
  });
}

export function useBlogCategoryDetail(id: string | null) {
  return useQuery({
    queryKey: blogCategoryKeys.detail(id ?? ""),
    queryFn: () => fetchBlogCategoryDetail(id!),
    enabled: Boolean(id),
  });
}

export function useCreateBlogCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BlogCategoryFormInput) => createBlogCategory(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CAT_LIST_KEY });
      qc.invalidateQueries({ queryKey: blogCategoryKeys.options });
    },
  });
}

export function useUpdateBlogCategory(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<BlogCategoryFormInput>) => updateBlogCategory(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CAT_LIST_KEY });
      qc.invalidateQueries({ queryKey: blogCategoryKeys.options });
    },
  });
}

export function useDeleteBlogCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBlogCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CAT_LIST_KEY });
      qc.invalidateQueries({ queryKey: blogCategoryKeys.options });
    },
  });
}

/** Tag search for the editor's tag picker (create-on-enter handled inline). */
export function useBlogTags(search: string) {
  return useQuery({
    queryKey: blogTagKeys.list(search),
    queryFn: () => fetchBlogTags(search || undefined),
    staleTime: 30_000,
  });
}

export function useCreateBlogTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createBlogTag(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "blog-tags", "list"] }),
  });
}
