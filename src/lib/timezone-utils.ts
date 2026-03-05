/**
 * Utilitários de timezone para conversão de datas/horas
 * Baseado na preferência de timezone do usuário (profile.timezone)
 *
 * Se timezone === "server": exibe como está (sem conversão)
 * Se timezone !== "server": converte de UTC para timezone local
 */

/**
 * Formata hora com conversão de timezone se necessário
 * @param time - Hora em formato "HH:MM:SS" (armazenada em UTC)
 * @param date - Data em formato "YYYY-MM-DD" (armazenada como está)
 * @param userTimezone - Timezone do usuário ("server" = sem conversão, ou "America/Sao_Paulo", etc)
 * @returns Hora formatada, possivelmente convertida
 */
export function formatTimeWithUserTimezone(
  time: string | null | undefined,
  date: string | null | undefined,
  userTimezone: string = "server"
): string {
  if (!time) return "—";

  // Se timezone é "server", retorna como está (dados do broker)
  if (userTimezone === "server") {
    return time;
  }

  // Conversão de timezone (UTC para timezone local)
  try {
    // Combina data + hora em ISO string (tratando como UTC)
    const isoString = `${date ?? "2024-01-01"}T${time}:00Z`;
    const utcDate = new Date(isoString);

    // Se data inválida, retorna original
    if (isNaN(utcDate.getTime())) {
      return time;
    }

    // Usa Intl para converter para timezone local
    const formatter = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: userTimezone,
      hour12: false,
    });

    return formatter.format(utcDate);
  } catch (error) {
    // Se timezone inválido ou outro erro, retorna original
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

  // Conversão de timezone
  try {
    const isoString = `${date}T${time}:00Z`;
    const utcDate = new Date(isoString);

    if (isNaN(utcDate.getTime())) {
      return { date, time };
    }

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

    // Hora convertida (já feita por formatTimeWithUserTimezone)
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
