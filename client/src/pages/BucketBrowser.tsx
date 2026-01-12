import { BucketCard } from "../components/BucketCard";
import { useList } from "../hooks";
import { type BucketType } from "../schemas";

export function BucketBrowser() {
  const { data = [] } = useList<BucketType>({
    model: "buckets",
    fields: ["id", "title"],
  });

  return (
    <div className="w-full mx-auto h-full flex flex-col gap-y-4 overflow-hidden">
      <div className="w-full px-6 flex flex-col gap-y-10 mx-auto flex-1 max-h-[calc(100%-120px)]">
        {data.map((bucket) => (
          <BucketCard key={bucket.id} />
        ))}
      </div>
    </div>
  );
}
