/**
 * Erro lançado quando o usuário não tem permissão para usar IA (plano ou créditos).
 * Usado pelo client para exibir modal de upgrade.
 */
export class PlanGateError extends Error {
  constructor(
    message: string,
    public readonly code: "plan" | "credits",
    public readonly errorKey: string
  ) {
    super(message);
    this.name = "PlanGateError";
    Object.setPrototypeOf(this, PlanGateError.prototype);
  }
}

export function isPlanGateError(e: unknown): e is PlanGateError {
  return e instanceof PlanGateError;
}
