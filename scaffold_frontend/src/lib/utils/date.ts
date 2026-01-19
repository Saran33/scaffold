import {
  type Locale,
  format,
  isValid,
  parse,
  parseISO,
  endOfDay,
  startOfDay,
} from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { enUS } from 'date-fns/locale/en-US';
import { env } from '@/env/client.mjs';
// import { getCurrentUserClient } from '@/lib/auth/client';

const displayIANA = (() => {
  const displayTz = env.NEXT_PUBLIC_TIMEZONE;
  return !displayTz || displayTz.toLocaleLowerCase() === 'client'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : displayTz;
})();

const parseValid = (isoString: string, formatString: string) => {
  const parsed = parse(isoString, formatString, new Date());
  if (!isValid(parsed)) {
    throw new Error(`Invalid date: ${isoString}`);
  }
  return parsed;
};

// need to use Webpack require.context to get all locales here
// export const getUserLocale = async (localeKey: string): Promise<Locale> => {
//   try {
//     const locale = await import(`date-fns/locale/${localeKey}`);
//     return locale.default;
//   } catch (error) {
//     throw new Error(`Failed to load locale: ${localeKey}`);
//   }
// };

// export async function getUserLocale() {
//   if (typeof window !== 'undefined') {
//     return window.navigator.language;
//   } else {
//     const user = await getCurrentUserClient();
//     return user?.locale ?? 'en-US';
//   }
// }

export const posixTsToDate = (posixTs: number) => new Date(posixTs * 1000);

const fmtDate = (date: Date, locale?: Locale, formatString = 'yyyy-MM-dd') => {
  return format(date, formatString, { locale: locale ?? enUS });
};

export const fmtDateTxt = (input: string | number | Date, locale?: Locale) => {
  const date = new Date(input);
  return fmtDate(date, locale, 'MMMM d, yyyy');
};

export const fmtLongDate = (input: string | number | Date, locale?: Locale) => {
  const date = new Date(input);
  return fmtDate(date, locale, 'MMMM dd, yyyy');
};

export const fmtShortDate = (
  input: string | number | Date,
  locale?: Locale
) => {
  const date = new Date(input);
  return fmtDate(date, locale, 'MMM dd, yyyy');
};

export const fmtShortDateMonth = (
  input: string | number | Date,
  locale?: Locale
) => {
  const date = new Date(input);
  return fmtDate(date, locale, 'MMM dd');
};

export const fmtDateTimeShort = (
  input: string | number | Date,
  locale?: Locale
) => {
  const date = new Date(input);
  return format(date, 'MMM dd, yyyy - HH:mm', { locale: locale ?? enUS });
};

export const fmtTimeHM = (input: string | number | Date, locale?: Locale) => {
  const date = new Date(input);
  return format(date, 'HH:mm', { locale: locale ?? enUS });
};

const fmtDateTime = (
  date: Date,
  locale?: Locale,
  formatString = 'yyyy-MM-dd HH:mm a zzz'
) => {
  return formatInTimeZone(date, displayIANA, formatString, {
    locale: locale ?? enUS,
  });
};

export const fmtDateTimeTxt = (date: Date, locale?: Locale) => {
  return fmtDateTime(date, locale, 'MMMM d, yyyy HH:mm:ss zzz');
};

const formatInTimeZoneMMMdhmmOOO = (
  date: Date,
  timeZone: string,
  locale?: Locale
) => {
  return formatInTimeZone(date, timeZone, 'MMM d, h:mm OOO', {
    locale: locale ?? enUS,
  });
};

const fmtDateTimeWithoutZone = (date: Date, locale?: Locale) => {
  return fmtDateTime(date, locale, 'yyyy-MM-dd HH:mm:ss');
};
const fmtDateTimeWithoutZoneHM = (date: Date, locale?: Locale) => {
  return fmtDateTime(date, locale, 'yyyy-MM-dd HH:mm');
};

const fmtDateTimeHMS = (date: Date, locale?: Locale) => {
  return fmtDateTime(date, locale, 'yyyy-MM-dd HH:mm:ss zzz');
};
const fmtTime = (date: Date, locale?: Locale) => {
  return fmtDateTime(date, locale, 'HH:mm a zzz');
};
const fmtTime24h = (date: Date, locale?: Locale) => {
  return fmtDateTime(date, locale, 'HH:mm zzz');
};
const fmtTimeWithoutZone = (date: Date, locale?: Locale) => {
  return fmtDateTime(date, locale, 'HH:mm');
};
const fmtMonthYear = (date: Date, locale?: Locale) => {
  return format(date, 'MMMM yyyy', { locale: locale ?? enUS });
};
const fmtTimeRange = (start: Date, end: Date, locale?: Locale) => {
  return `${fmtTimeWithoutZone(start, locale)} - ${fmtTime(end, locale)}`;
};

const parseISODate = (isoString: string) => {
  return parseValid(isoString, 'yyyy-MM-dd');
};
export const parseISODateTime = (isoString: string): Date => {
  const tzOffsetMatch = /(?:Z|[+-]\d{2}:\d{2})$/;
  if (!tzOffsetMatch.test(isoString)) {
    throw new Error(`Invalid ISO string: ${isoString} - Must include timezone`);
  }
  const parsed = parseISO(isoString);
  if (!isValid(parsed)) {
    throw new Error(`Invalid ISO string: ${isoString}`);
  }
  return parsed;
};
const parseISOToEpoch = (isoString: string) => new Date(isoString).getTime();

const parseAndFormatDate = (isoString: string, locale?: Locale) => {
  return fmtDate(parseISODate(isoString), locale);
};
const parseAndFormatDateTime = (isoString: string, locale?: Locale) => {
  return fmtDateTime(parseISODateTime(isoString), locale);
};
const parseAndFormatDateTimeWithoutTz = (
  isoString: string,
  locale?: Locale
) => {
  return fmtDateTimeWithoutZone(parseISODateTime(isoString), locale);
};
const parseAndFormatDateTimeWithoutTzHM = (
  isoString: string,
  locale?: Locale
) => {
  return fmtDateTimeWithoutZoneHM(parseISODateTime(isoString), locale);
};
const parseAndFormatTime = (isoString: string, locale?: Locale) => {
  return fmtTime(parseISODateTime(isoString), locale);
};
const parseAndFormatTime24h = (isoString: string, locale?: Locale) => {
  return fmtTime24h(parseISODateTime(isoString), locale);
};
const parseAndFormatTimeWithoutZone = (isoString: string, locale?: Locale) => {
  return fmtTimeWithoutZone(parseISODateTime(isoString), locale);
};
const parseAndFormatMonthYear = (isoString: string, locale?: Locale) => {
  return fmtMonthYear(parseISODate(isoString), locale);
};
const parseAndFormatTimeRange = (
  start: string,
  end: string,
  locale?: Locale
) => {
  return fmtTimeRange(parseISODateTime(start), parseISODateTime(end), locale);
};

const toISO = (dt: Date): string => dt.toISOString();
const toISODate = (date: Date) => {
  return format(date, 'yyyy-MM-dd');
};
const tostartOfDayISO = (date: Date) => {
  return toISO(startOfDay(date));
};
const toEndOfDayISO = (date: Date) => {
  return toISO(endOfDay(date));
};

const getTzOffsetString = (tz: string) => {
  const offsetStr = formatInTimeZone(new Date(), tz, 'xxx', { locale: enUS });
  return offsetStr === '+00:00' ? 'Z' : offsetStr;
};
const getTzAbbreviation = (tz: string) => {
  return formatInTimeZone(new Date(), tz, 'zzz', { locale: enUS });
};
const getTzName = (tz: string) => {
  return formatInTimeZone(new Date(), tz, 'zzzz', { locale: enUS });
};

const convertToZonedDateTime = (dateStr: string, time: string, tz: string) => {
  const offset = getTzOffsetString(tz);
  const zonedDateTimeStr = `${dateStr}T${time}${offset}`;
  return parseISO(zonedDateTimeStr);
};

const unixTsNow = () => Math.floor(Date.now() / 1000);

/**
 * Format a duration in seconds as MM:SS (e.g., "3:45" or "12:05").
 * For durations over an hour, formats as H:MM:SS.
 */
export const fmtDurationMMSS = (seconds: number): string => {
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format a duration in seconds as human-readable text (e.g., "2h 30m" or "45m").
 */
export const fmtDurationHM = (seconds: number): string => {
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

/**
 * Format a duration in seconds as minutes and seconds (e.g., "5m 30s" or "3m").
 */
export const fmtDurationMS = (seconds: number): string => {
  const totalSeconds = Math.floor(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};
