/**
 * @description Helper to extract model year number from modelYear string.
 * Example: "MY 25" / "MY25" -> 25
 * @param {String} modelYear - model year in format "MY YY"
 * @returns {Number} model year number (YY) as integer
 */
function getModelYearNumber(modelYear) {
  const match = String(modelYear).match(/(\d{2})$/);
  // Joi already validates format, so match will exist.
  return parseInt(match[1], 10);
}

/**
 * @description Helper to add days to a date object.
 * Used for validating continuity rule (next start = prev end + 1 day).
 * @param {Date} dateObj - base date
 * @param {Number} days - number of days to add
 * @returns {Date} new date with days added
 */
function addDays(dateObj, days) {
  const dt = new Date(dateObj.getTime());
  dt.setDate(dt.getDate() + days);
  return dt;
}

/**
 * @description Helper to convert a "YYYY-MM-DD" date string to "YYYYMM" format.
 * Used for month-level scenario timeframe comparisons.
 * Example: "2026-03-15" -> "202603"
 * @param {String} dateStr - date string in "YYYY-MM-DD"
 * @returns {String} YYYYMM
 */
function toYYYYMM(dateStr) {
  return String(dateStr).slice(0, 7).replace("-", "");
}

module.exports = {
  // ...keep existing exports
  getModelYearNumber,
  addDays,
  toYYYYMM,
};
