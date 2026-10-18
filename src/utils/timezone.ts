import { fromZonedTime, format } from "date-fns-tz";

export const convertToUTC = (
  date: string,
  time: string,
  timeZone: string
): Date => {
  const localDateTimeString = `${date}T${time}:00`;
  return fromZonedTime(localDateTimeString, timeZone);
};

export const formatInTimeZone = (
  utcDate: Date | string,
  timeZone: string
) => {
  const d = typeof utcDate === "string" ? new Date(utcDate) : utcDate;
  return {
    date: format(d, "EEE, MMM d, yyyy", { timeZone }),
    time: format(d, "hh:mm a", { timeZone }),
    dateTime: format(d, "EEE, MMM d, yyyy 'at' hh:mm a", { timeZone }),
  };
};