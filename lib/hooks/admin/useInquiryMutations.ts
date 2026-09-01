"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateInquiry,
  changeInquiryStatus,
  assignInquiry,
  addInquiryNote,
  deleteInquiry,
  type InquiryStatus,
  type InquiryUpdateInput,
} from "../../api/inquiry";
import { inquiryKeys } from "../query-keys";

const LIST_KEY = ["admin", "inquiries", "list"];

function useInquiryInvalidation(id?: string) {
  const qc = useQueryClient();
  return (res?: { inquiry: { inquiryId: string } }) => {
    qc.invalidateQueries({ queryKey: LIST_KEY });
    qc.invalidateQueries({ queryKey: inquiryKeys.stats });
    if (res) qc.setQueryData(inquiryKeys.detail(res.inquiry.inquiryId), res);
    else if (id) qc.invalidateQueries({ queryKey: inquiryKeys.detail(id) });
  };
}

export function useUpdateInquiry(id: string) {
  const invalidate = useInquiryInvalidation(id);
  return useMutation({
    mutationFn: (patch: InquiryUpdateInput) => updateInquiry(id, patch),
    onSuccess: invalidate,
  });
}

export function useChangeInquiryStatus(id: string) {
  const invalidate = useInquiryInvalidation(id);
  return useMutation({
    mutationFn: (status: InquiryStatus) => changeInquiryStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useAssignInquiry(id: string) {
  const invalidate = useInquiryInvalidation(id);
  return useMutation({
    mutationFn: (assignedTo: string | null) => assignInquiry(id, assignedTo),
    onSuccess: invalidate,
  });
}

export function useAddInquiryNote(id: string) {
  const invalidate = useInquiryInvalidation(id);
  return useMutation({
    mutationFn: (note: string) => addInquiryNote(id, note),
    onSuccess: invalidate,
  });
}

export function useDeleteInquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInquiry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY });
      qc.invalidateQueries({ queryKey: inquiryKeys.stats });
    },
  });
}
