import { Metadata } from "next";
import { getUserTags } from "@/app/actions/tags";
import { TagsManager } from "@/components/settings/tags-manager";

export const metadata: Metadata = {
  title: "Tags – TakeZ",
};

export default async function TagsPage() {
  const tags = await getUserTags();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">
          Gerenciamento de tags
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Crie e organize tags para categorizar suas operações, identificar
          padrões e melhorar sua análise.
        </p>
      </div>
      <TagsManager tags={tags} />
    </div>
  );
}
