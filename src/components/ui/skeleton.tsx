import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
  rounded?: boolean;
  count?: number;
}

function Skeleton({ className, width, height, rounded = true, count = 1, ...props }: SkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={cn(
        "animate-pulse rounded-md bg-gray-300 dark:bg-gray-700",
        rounded && "rounded-lg",
        className
      )}
      style={{
        width: width || "100%",
        height: height || "1rem",
      }}
      {...props}
    />
  ));

  return <>{skeletons}</>;
}

export { Skeleton };
