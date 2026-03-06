/**
 * Utilitários de timezone para conversão de datas/horas
 * Baseado na preferência de timezone do usuário (profile.timezone)
 *
 * Dados armazenados em BROKER TIME (EET/EEST = UTC+2/+3 para todos os brokers MT5).
 * Se timezone === "server": exibe como está (broker time = o que o MT5 mostra)
 * Se timezone !== "server": converte de broker time (EET) para timezone do usuário
 */

/** Timezone dos brokers MT5 (padrão da indústria forex: EET/EEST) */
const BROKER_TIMEZONE = "EET";

/**
 * Converte um horário em broker time (EET) para UTC Date object.
 * Usa técnica de offset reverso via Intl.DateTimeFormat.
 */
function brokerTimeToUtcDate(date: string, time: string): Date | null {
  try {
    // Cria Date aproximada tratando como UTC (errado, mas serve para calcular offset)
    const approxUtc = new Date(`${date}T${time}Z`);
    if (isNaN(approxUtc.getTime())) return null;

    // Descobre o offset do broker timezone nesta data
    // Formata approxUtc em EET → resultado é "o que EET mostra para este UTC"
    const eetParts = new Intl.DateTimeFormat("en-US", {
      timeZone: BROKER_TIMEZONE,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    }).formatToParts(approxUtc);

    const p = (type: string) => eetParts.find((x) => x.type === type)?.value ?? "0";
    const eetMs = new Date(`${p("year")}-${p("month")}-${p("day")}T${p("hour")}:${p("minute")}:${p("second")}Z`).getTime();

    // offset = EET - UTC (em ms). Ex: +2h = 7200000
    const offsetMs = eetMs - approxUtc.getTime();

    // O horário real em UTC = broker_time - offset
    return new Date(approxUtc.getTime() - offsetMs);
  } catch {
    return null;
  }
}

/**
 * Formata hora com conversão de timezone se necessário
 * @param time - Hora em formato "HH:MM:SS" (armazenada em broker time EET)
 * @param date - Data em formato "YYYY-MM-DD" (armazenada em broker time EET)
 * @param userTimezone - Timezone do usuário ("server" = sem conversão, ou "America/Sao_Paulo", etc)
 * @returns Hora formatada, possivelmente convertida
 */
export function formatTimeWithUserTimezone(
  time: string | null | undefined,
  date: string | null | undefined,
  userTimezone: string = "server"
): string {
  if (!time) return "—";

  // Se timezone é "server", retorna como está (broker time = o que MT5 mostra)
  if (userTimezone === "server") {
    return time;
  }

  // Conversão: broker time (EET) → UTC → timezone do usuário
  try {
    const utcDate = brokerTimeToUtcDate(date ?? "2024-01-01", time);
    if (!utcDate) return time;

    const formatter = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: userTimezone,
      hour12: false,
    });

    return formatter.format(utcDate);
  } catch (error) {
    console.warn(`[timezone-utils] Erro ao converter hora: ${error}`);
    return time;
  }
}

/**
 * Converte data completa (data + hora) com conversão de timezone
 * Retorna objeto com date e time separados (compatível com CalendarTrade)
 */
export function convertDateTimeWithUserTimezone(
  date: string | null | undefined,
  time: string | null | undefined,
  userTimezone: string = "server"
): { date: string; time: string } {
  if (!date || !time) {
    return {
      date: date ?? "—",
      time: time ?? "—",
    };
  }

  // Se timezone é "server", retorna como está
  if (userTimezone === "server") {
    return { date, time };
  }

  // Conversão: broker time (EET) → UTC → timezone do usuário
  try {
    const utcDate = brokerTimeToUtcDate(date, time);
    if (!utcDate) return { date, time };

    // Data convertida
    const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: userTimezone,
    });

    const dateParts = dateFormatter.formatToParts(utcDate);
    const convertedDate = `${dateParts.find((p) => p.type === "year")?.value}-${dateParts
      .find((p) => p.type === "month")?.value}-${dateParts.find((p) => p.type === "day")?.value}`;

    // Hora convertida
    const convertedTime = formatTimeWithUserTimezone(time, date, userTimezone);

    return {
      date: convertedDate.includes("undefined") ? date : convertedDate,
      time: convertedTime,
    };
  } catch (error) {
    console.warn(`[timezone-utils] Erro ao converter data/hora: ${error}`);
    return { date, time };
  }
}

/**
 * Verifica se deve fazer conversão de timezone
 */
export function shouldConvertTimezone(userTimezone: string | undefined): boolean {
  return userTimezone !== undefined && userTimezone !== "server";
}
