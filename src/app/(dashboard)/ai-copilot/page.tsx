import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import { AiCopilotGate } from "@/components/ai/ai-copilot-gate";
import { AiCopilotContent } from "@/components/ai/ai-copilot-content";

export default async function AiCopilotPage() {
  const { user } = await getServerSession();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:py-12">
      <AiCopilotGate>
        <AiCopilotContent />
      </AiCopilotGate>
    </div>
  );
}
