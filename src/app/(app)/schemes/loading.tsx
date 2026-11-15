import { LoadingStatus, SearchRowSkeleton, TableSkeleton } from "@/components/record-skeleton";

const columns = [
  { width: "22%", bar: "72%" },
  { width: "34%", bar: "78%" },
  { width: "22%", bar: "56%" },
  { width: "22%", bar: "40%" },
];

export default function SchemesLoading() {
  return (
    <LoadingStatus>
      <SearchRowSkeleton />
      <TableSkeleton columns={columns} />
    </LoadingStatus>
  );
}
