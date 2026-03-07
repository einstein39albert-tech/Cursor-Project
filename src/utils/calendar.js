function getIntlFormatter(locale, calendar) {
  return new Intl.DateTimeFormat(locale, {
    calendar,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getClockFormatter(locale = "en-US") {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Africa/Addis_Ababa",
  });
}

function getCalendarSnapshot(date = new Date()) {
  const gregorianFormatter = getIntlFormatter("en-US", "gregory");
  const ethiopicFormatter = getIntlFormatter("am-ET-u-nu-latn", "ethiopic");
  const timeFormatter = getClockFormatter();

  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();
  const fiscalYear = month >= 7 ? `${year}/${year + 1}` : `${year - 1}/${year}`;

  return {
    gregorianDate: gregorianFormatter.format(date),
    ethiopianDate: ethiopicFormatter.format(date),
    eastAfricaTime: timeFormatter.format(date),
    fiscalYear,
    ethiopianFiscalWindow: "Hamle 1 - Sene 30",
    euFiscalWindow: "July 1 - June 30",
  };
}

module.exports = {
  getCalendarSnapshot,
};
