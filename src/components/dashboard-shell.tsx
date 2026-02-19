"use client";

import { type ReactNode, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  DataSourceProvider,
} from "@/contexts/data-source-context";
import { GlobalHeader } from "@/components/global-header";
import { Sidebar } from "@/components/sidebar";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";
import type {
  LinkedAccount,
  ImportReport,
  DataSourceSelection,
} from "@/components/dashboard/data-source-selector";

type Props = {
  children: ReactNode;
  accounts: LinkedAccount[];
  imports: ImportReport[];
  userName: string | null;
};

/**
 * Padrão: 1) Relatório de importação, 2) Conta vinculada.
 * "All data" só quando não houver nenhum dos dois.
 */
function getDefaultSelection(
  accounts: LinkedAccount[],
  imports: ImportReport[]
): DataSourceSelection {
  if (imports.length > 0) {
    return { type: "import", id: imports[0].id };
  }
  if (accounts.length > 0) {
    return { type: "account", id: accounts[0].id };
  }
  return { type: "all", id: null };
}

export function DashboardShell({ children, accounts, imports, userName }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const accountId = searchParams.get("account");
  const importId = searchParams.get("import");

  /* Redirecionar para o padrão quando não há params (evitar "All data" como padrão) */
  useEffect(() => {
    if (accountId || importId) return;
    const def = getDefaultSelection(accounts, imports);
    if (def.type === "all") return;

    const qs = def.type === "import" ? `?import=${def.id}` : `?account=${def.id}`;
    router.replace(`${pathname}${qs}`);
  }, [accountId, importId, accounts, imports, pathname, router]);

  let initialSelection: DataSourceSelection;
  if (accountId) {
    initialSelection = { type: "account", id: accountId };
  } else if (importId) {
    initialSelection = { type: "import", id: importId };
  } else {
    initialSelection = getDefaultSelection(accounts, imports);
  }

  return (
    <DataSourceProvider
      initialSelection={initialSelection}
      accounts={accounts}
      imports={imports}
    >
      <OnboardingModal />
      <Sidebar />
      <main className="lg:pl-64">
        <GlobalHeader userName={userName} />
        {children}
      </main>
    </DataSourceProvider>
  );
}
