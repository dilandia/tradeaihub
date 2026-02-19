"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type {
  LinkedAccount,
  ImportReport,
  DataSourceSelection,
} from "@/components/dashboard/data-source-selector";

type DataSourceContextValue = {
  /** Current selection */
  selection: DataSourceSelection;
  /** Linked accounts list */
  accounts: LinkedAccount[];
  /** Import reports list */
  imports: ImportReport[];
  /** Change the active data source */
  setSelection: (sel: DataSourceSelection) => void;
};

const DataSourceContext = createContext<DataSourceContextValue | null>(null);

type ProviderProps = {
  children: ReactNode;
  initialSelection: DataSourceSelection;
  accounts: LinkedAccount[];
  imports: ImportReport[];
};

export function DataSourceProvider({
  children,
  initialSelection,
  accounts,
  imports,
}: ProviderProps) {
  const [selection, setSelectionState] = useState<DataSourceSelection>(initialSelection);

  // Se a conta/import selecionado foi excluído, resetar para o padrão
  useEffect(() => {
    if (selection.type === "account" && selection.id) {
      const exists = accounts.some((a) => a.id === selection.id);
      if (!exists) {
        const def = imports.length > 0
          ? { type: "import" as const, id: imports[0].id }
          : accounts.length > 0
            ? { type: "account" as const, id: accounts[0].id }
            : { type: "all" as const, id: null };
        setSelectionState(def);
      }
    } else if (selection.type === "import" && selection.id) {
      const exists = imports.some((i) => i.id === selection.id);
      if (!exists) {
        const def = accounts.length > 0
          ? { type: "account" as const, id: accounts[0].id }
          : imports.length > 0
            ? { type: "import" as const, id: imports[0].id }
            : { type: "all" as const, id: null };
        setSelectionState(def);
      }
    }
  }, [accounts, imports, selection.type, selection.id]);

  const setSelection = useCallback((sel: DataSourceSelection) => {
    setSelectionState(sel);
  }, []);

  return (
    <DataSourceContext.Provider
      value={{ selection, accounts, imports, setSelection }}
    >
      {children}
    </DataSourceContext.Provider>
  );
}

export function useDataSource() {
  const ctx = useContext(DataSourceContext);
  if (!ctx) {
    throw new Error("useDataSource must be used within DataSourceProvider");
  }
  return ctx;
}
