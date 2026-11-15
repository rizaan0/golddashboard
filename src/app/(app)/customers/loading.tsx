import { LoadingStatus, SearchRowSkeleton, TableSkeleton } from "@/components/record-skeleton";

const columns = [
  { width: "18%", bar: "70%" },
  { width: "34%", bar: "76%" },
  { width: "28%", bar: "68%" },
  { width: "20%", bar: "36%" },
];

export default function CustomersLoading() {
  return (
    <LoadingStatus>
      <SearchRowSkeleton actionWidth={164} />
      <TableSkeleton columns={columns} />
    </LoadingStatus>
  );
}
