"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { CreditAdjustmentForm } from "@/components/admin/credit-adjustment-form";

interface CreditManageButtonProps {
  userId: string;
  currentBalance: number;
}

export function CreditManageButton({
  userId,
  currentBalance,
}: CreditManageButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Settings2 className="h-3.5 w-3.5" />
        Manage Credits
      </button>

      {open && (
        <CreditAdjustmentForm
          userId={userId}
          currentBalance={currentBalance}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
