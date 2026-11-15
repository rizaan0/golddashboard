import { LoadingStatus, SearchRowSkeleton, TableSkeleton } from "@/components/record-skeleton";

const columns = [
  { width: "22%", bar: "80%" },
  { width: "14%", bar: "70%" },
  { width: "16%", bar: "64%" },
  { width: "16%", bar: "64%" },
  { width: "16%", bar: "58%" },
  { width: "16%", bar: "58%" },
];

export default function ArchivedLoading() {
  return (
    <LoadingStatus>
      <SearchRowSkeleton actionWidth={0} />
      <TableSkeleton columns={columns} />
    </LoadingStatus>
  );
}
