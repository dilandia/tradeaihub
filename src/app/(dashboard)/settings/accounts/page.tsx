import { getUserTradingAccounts } from "@/lib/trading-accounts";
import { AccountsSection } from "@/components/settings/accounts-section";

export default async function AccountsPage() {
  const accounts = await getUserTradingAccounts();

  return <AccountsSection accounts={accounts} />;
}
