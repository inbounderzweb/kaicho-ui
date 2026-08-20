import type { SortOrder } from "@/lib/api/admin";

export default function SortableHeader<TField extends string>({
  label,
  field,
  activeField,
  activeOrder,
  onSort,
}: {
  label: string;
  field: TField;
  activeField: TField;
  activeOrder: SortOrder;
  onSort: (field: TField) => void;
}) {
  const isActive = field === activeField;

  return (
    <th className="px-5 py-3 font-semibold">
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 transition-colors ${
          isActive ? "text-black dark:text-white" : "hover:text-black dark:hover:text-white"
        }`}
      >
        {label}
        <span className="text-[10px] leading-none" aria-hidden="true">
          {isActive ? (activeOrder === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </th>
  );
}
