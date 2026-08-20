"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../ui/Button";
import { IconUser, IconArrowRight } from "../ui/icons";
import { useUpdateName } from "@/lib/hooks/useUpdateName";
import { nameFormSchema, type NameFormValues } from "@/lib/validation/auth.schema";
import { ApiError } from "@/lib/api/ApiError";
import type { AuthUser } from "@/lib/api/auth";

export default function NameStepForm({
  onCompleted,
}: {
  onCompleted: (user: AuthUser) => void;
}) {
  const updateName = useUpdateName();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NameFormValues>({
    resolver: zodResolver(nameFormSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = (values: NameFormValues) => {
    updateName.mutate(values.name, {
      onSuccess: (data) => onCompleted(data.user),
    });
  };

  const errorMessage =
    errors.name?.message ??
    (updateName.error instanceof ApiError ? updateName.error.message : undefined);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft/60 text-forest">
          <IconUser className="h-4 w-4" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
          One last step
        </span>
      </div>

      <div>
        <label htmlFor="name" className="mb-1.5 block text-xs font-semibold text-ink-muted">
          Your name
        </label>
        <input
          id="name"
          type="text"
          autoFocus
          autoComplete="name"
          placeholder="e.g. Rahul Sharma"
          {...register("name")}
          className="w-full rounded-xl border border-border bg-cream/50 px-4 py-3 text-sm font-semibold text-ink outline-none transition-all focus:border-forest focus:ring-[3px] focus:ring-forest/10"
        />
      </div>

      {errorMessage && (
        <p className="animate-fade-up text-xs font-semibold text-sale">{errorMessage}</p>
      )}

      <Button type="submit" disabled={updateName.isPending} size="lg" className="w-full">
        {updateName.isPending ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Saving…
          </span>
        ) : (
          <>
            Continue
            <IconArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}
