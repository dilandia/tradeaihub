"use client";

import { useState, useTransition } from "react";
import { useLanguage } from "@/contexts/language-context";
import { formatDate, formatDateTime } from "@/lib/i18n/date-utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Lock,
  Shield,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  Mail,
  Clock,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { changePassword, deleteAccount } from "@/app/actions/security";

/* ─── Types ─── */

type SecurityInfo = {
  email: string;
  lastSignIn: string | null;
  provider: string;
  createdAt: string;
  emailConfirmed: boolean;
};

type Props = { info: SecurityInfo };

/* ─── Password Input ─── */

function PasswordInput({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  id: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="new-password"
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-score transition-colors"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

/* ─── Main Component ─── */

export function SecurityForm({ info }: Props) {
  const { locale } = useLanguage();
  const [isPending, startTransition] = useTransition();

  /* Password state */
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwStatus, setPwStatus] = useState<"idle" | "success" | "error">("idle");
  const [pwError, setPwError] = useState("");

  /* Delete state */
  const [deleteStep, setDeleteStep] = useState(0); // 0=hidden, 1=confirm, 2=type
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");

  /* Password strength */
  const strength = getPasswordStrength(newPw);

  function handleChangePassword() {
    setPwStatus("idle");
    setPwError("");

    if (!currentPw) {
      setPwStatus("error");
      setPwError("Digite sua senha atual.");
      return;
    }
    if (newPw.length < 6) {
      setPwStatus("error");
      setPwError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwStatus("error");
      setPwError("As senhas não coincidem.");
      return;
    }

    startTransition(async () => {
      const result = await changePassword(currentPw, newPw);
      if (result.success) {
        setPwStatus("success");
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
        setTimeout(() => setPwStatus("idle"), 5000);
      } else {
        setPwStatus("error");
        setPwError(result.error ?? "Erro ao alterar senha.");
      }
    });
  }

  function handleDeleteAccount() {
    if (deleteConfirmText !== "DELETAR") return;
    setDeleteError("");

    startTransition(async () => {
      const result = await deleteAccount();
      if (!result.success) {
        setDeleteError(result.error ?? "Erro ao deletar conta.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* ─── Security Overview ─── */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Visão geral da segurança
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow
              icon={Mail}
              label="Email"
              value={info.email}
              badge={
                info.emailConfirmed
                  ? { text: "Verificado", color: "text-profit" }
                  : { text: "Não verificado", color: "text-loss" }
              }
            />
            <InfoRow
              icon={ShieldCheck}
              label="Provedor de autenticação"
              value={info.provider === "email" ? "Email/Senha" : info.provider}
            />
            <InfoRow
              icon={Clock}
              label="Último acesso"
              value={
                info.lastSignIn
                  ? formatDateTime(info.lastSignIn, locale)
                  : "—"
              }
            />
            <InfoRow
              icon={KeyRound}
              label="Conta criada em"
              value={formatDate(info.createdAt, locale, {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            />
          </div>
        </CardContent>
      </Card>

      {/* ─── Change Password ─── */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Alterar senha
            </h3>
          </div>

          <div className="max-w-md space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Senha atual
              </label>
              <PasswordInput
                id="current-pw"
                value={currentPw}
                onChange={setCurrentPw}
                placeholder="Digite sua senha atual"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Nova senha
              </label>
              <PasswordInput
                id="new-pw"
                value={newPw}
                onChange={setNewPw}
                placeholder="Mínimo 6 caracteres"
              />
              {newPw.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1.5 flex-1 rounded-full transition-colors",
                          i <= strength.level
                            ? strength.level <= 1
                              ? "bg-loss"
                              : strength.level <= 2
                                ? "bg-yellow-500"
                                : strength.level <= 3
                                  ? "bg-score"
                                  : "bg-profit"
                            : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Confirmar nova senha
              </label>
              <PasswordInput
                id="confirm-pw"
                value={confirmPw}
                onChange={setConfirmPw}
                placeholder="Repita a nova senha"
              />
              {confirmPw && confirmPw !== newPw && (
                <p className="mt-1 text-xs text-loss">
                  As senhas não coincidem.
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={isPending || !currentPw || !newPw || newPw !== confirmPw}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-all",
                  !isPending && currentPw && newPw && newPw === confirmPw
                    ? "bg-score hover:bg-score/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                {isPending ? "Alterando..." : "Alterar senha"}
              </button>

              {pwStatus === "success" && (
                <span className="inline-flex items-center gap-1.5 text-sm text-profit">
                  <CheckCircle className="h-4 w-4" />
                  Senha alterada!
                </span>
              )}
              {pwStatus === "error" && (
                <span className="inline-flex items-center gap-1.5 text-sm text-loss">
                  <AlertCircle className="h-4 w-4" />
                  {pwError}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Danger Zone ─── */}
      <Card className="border-loss/30">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-loss" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-loss">
              Zona de perigo
            </h3>
          </div>

          <p className="mb-4 text-sm text-muted-foreground">
            Ao deletar sua conta, todos os seus dados serão permanentemente
            removidos, incluindo perfil, trades, contas vinculadas e histórico
            de importação. <strong>Esta ação não pode ser desfeita.</strong>
          </p>

          {deleteStep === 0 && (
            <button
              type="button"
              onClick={() => setDeleteStep(1)}
              className="inline-flex items-center gap-2 rounded-lg border border-loss/40 px-4 py-2.5 text-sm font-medium text-loss transition-colors hover:bg-loss/10"
            >
              <Trash2 className="h-4 w-4" />
              Deletar minha conta
            </button>
          )}

          {deleteStep === 1 && (
            <div className="rounded-lg border border-loss/30 bg-loss/5 p-4">
              <p className="mb-3 text-sm font-medium text-loss">
                Tem certeza? Todos os dados serão perdidos permanentemente.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteStep(2)}
                  className="rounded-lg bg-loss px-4 py-2 text-sm font-medium text-white hover:bg-loss/90 transition-colors"
                >
                  Sim, quero deletar
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteStep(0)}
                  className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {deleteStep === 2 && (
            <div className="rounded-lg border border-loss/30 bg-loss/5 p-4">
              <p className="mb-2 text-sm text-loss">
                Digite <strong>DELETAR</strong> para confirmar:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETAR"
                  className="flex-1 rounded-lg border border-loss/40 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-loss"
                />
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "DELETAR" || isPending}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors",
                    deleteConfirmText === "DELETAR" && !isPending
                      ? "bg-loss hover:bg-loss/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Confirmar"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteStep(0);
                    setDeleteConfirmText("");
                  }}
                  className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
                >
                  Cancelar
                </button>
              </div>
              {deleteError && (
                <p className="mt-2 text-xs text-loss">{deleteError}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Helpers ─── */

function InfoRow({
  icon: Icon,
  label,
  value,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  badge?: { text: string; color: string };
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">{value}</span>
        {badge && (
          <span className={cn("text-xs font-medium", badge.color)}>
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
}

function getPasswordStrength(pw: string): { level: number; label: string } {
  if (pw.length === 0) return { level: 0, label: "" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: 1, label: "Fraca" };
  if (score <= 2) return { level: 2, label: "Razoável" };
  if (score <= 3) return { level: 3, label: "Boa" };
  return { level: 4, label: "Forte" };
}
