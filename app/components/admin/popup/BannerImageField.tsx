"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { resolveMediaUrl } from "@/lib/api/client";
import type { PopupFormValues } from "@/lib/validation/popup.schema";
import CollectionImagePicker from "../CollectionImagePicker";
import { ERR, HINT, errorAt } from "./fields";

export default function BannerImageField({ name, label, hint }: {
  name: "content.imageUrl" | "content.desktopImageUrl" | "content.mobileImageUrl";
  label: string;
  hint: string;
}) {
  const { control, setValue, formState } = useFormContext<PopupFormValues>();
  const imageUrl = useWatch({ control, name });
  const error = errorAt(formState.errors, name);

  return (
    <div role="group" aria-label={label}>
      <CollectionImagePicker
        label={label}
        value={imageUrl ? { mediaId: "", url: imageUrl } : null}
        onChange={(image) => setValue(name, image ? resolveMediaUrl(image.url) : "", { shouldDirty: true, shouldValidate: true })}
      />
      {error ? <p className={ERR}>{error}</p> : <p className={HINT}>{hint}</p>}
    </div>
  );
}
