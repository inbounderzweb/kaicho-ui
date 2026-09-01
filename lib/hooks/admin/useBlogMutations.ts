"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createBlog,
  updateBlog,
  setBlogStatus,
  scheduleBlog,
  duplicateBlog,
  deleteBlog,
  bulkBlogAction,
  type BlogFormInput,
  type BlogStatus,
} from "../../api/blog";
import { blogKeys } from "../query-keys";

const LIST_KEY = ["admin", "blogs", "list"];

export function useCreateBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BlogFormInput) => createBlog(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  });
}

export function useUpdateBlog(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<BlogFormInput>) => updateBlog(id, patch),
    onSuccess: (res) => {
      qc.setQueryData(blogKeys.detail(id), res);
      qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}

export function useSetBlogStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { status: BlogStatus; scheduledFor?: string; note?: string }) => setBlogStatus(id, body),
    onSuccess: (res) => {
      qc.setQueryData(blogKeys.detail(id), res);
      qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}

export function useScheduleBlog(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { scheduledFor: string; note?: string }) => scheduleBlog(id, body),
    onSuccess: (res) => {
      qc.setQueryData(blogKeys.detail(id), res);
      qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}

export function useDuplicateBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => duplicateBlog(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  });
}

export function useDeleteBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hard }: { id: string; hard?: boolean }) => deleteBlog(id, hard),
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  });
}

export function useBulkBlogAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, action }: { ids: string[]; action: "publish" | "unpublish" | "archive" | "delete" }) =>
      bulkBlogAction(ids, action),
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  });
}
