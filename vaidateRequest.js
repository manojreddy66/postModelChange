/**
 * @description this file contains request validation methods
 */

const { dbConnect } = require("prismaORM/index");
const { scenariosData } = require("prismaORM/services/scenariosService");
const {
  modelChangeDatesData,
} = require("prismaORM/services/modelChangeDateService");
const {
  getValidationSchema,
} = require("schemaValidator/supplyPlanning/modelChangeDates/postModelChangeDatesSchema");

/**
 * @description Function to validate input request body
 * @param {Object} body: API input request body
 * @returns {Array} errorMessages - Validation errors if any
 */
async function validateInput(body) {
  const errorMessages = [];

  /**
   * @description Validate request body using Joi schema
   */
  validateParams(body, errorMessages);

  /**
   * @description If Joi validation passed, perform DB and business validations
   */
  if (errorMessages.length === 0) {
    const rdb = await dbConnect();

    /**
     * @description Validate scenario exists
     */
    const scenariosService = new scenariosData(rdb);
    const scenarioData = await scenariosService.getScenarioDataById(body.scenarioId);

    if (!scenarioData || scenarioData.length === 0) {
      errorMessages.push("ValidationError: Scenario doesn't exist.");
      return errorMessages;
    }

    const scenarioRow = scenarioData[0];

    /**
     * @description Fetch existing model change dates data by scenarioId
     */
    const modelChangeService = new modelChangeDatesData(rdb);
    const existingRows =
      await modelChangeService.getModelChangeDatesByScenarioId(body.scenarioId);

    /**
     * @description Validate business rules on final dataset (existing + incoming)
     */
    validateModelChangeDates(scenarioRow, existingRows, body.data, errorMessages);
  }

  return [...new Set(errorMessages)];
}

/**
 * @description Function to validate request params using Joi schema
 * @param {Object} body - request body
 * @param {Array} errorMessages - array to collect validation errors
 */
function validateParams(body, errorMessages) {
  const schema = getValidationSchema();
  const { error } = schema.validate(body, { abortEarly: false });

  if (error?.details?.length) {
    error.details.forEach((e) => errorMessages.push(e.message));
  }
}

/**
 * @description Function to validate model change date business rules (doc point vi)
 * This validates on the final view of data: DB rows + incoming rows (incoming overrides)
 *
 * @param {Object} scenarioRow - scenario data row from DB
 * @param {Array} existingRows - model_change_date rows from DB
 * @param {Array} inputRows - request body data rows
 * @param {Array} errorMessages - collector to push validation errors
 */
function validateModelChangeDates(
  scenarioRow,
  existingRows,
  inputRows,
  errorMessages
) {
  /**
   * @description Merge DB + incoming so we validate the final expected state
   */
  const finalRows = mergeModelChangeRows(existingRows, inputRows);

  /**
   * @description Group rows by subSeries for validation
   */
  const groupedData = {};
  finalRows.forEach((record) => {
    const subSeries = record.subSeries;
    if (!groupedData[subSeries]) groupedData[subSeries] = [];
    groupedData[subSeries].push(record);
  });

  /**
   * @description Scenario timeframe for month-level validation (YYYYMM)
   */
  const scenarioStartYM = scenarioRow.start_month_year; // YYYYMM
  const scenarioEndYM = scenarioRow.end_month_year; // YYYYMM

  /**
   * @description Validate each subSeries separately
   */
  for (const subSeries in groupedData) {
    const records = groupedData[subSeries];

    /**
     * @description Sort records by modelYear (MY 25, MY 26...) to validate sequential rules
     */
    records.sort((a, b) => parseMY(a.modelYear) - parseMY(b.modelYear));

    /**
     * @description Rule 1 & 2: Start date must be earlier than end date (per MY, per subseries)
     */
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const start = toUTCDate(record.startProdDate);
      const end = toUTCDate(record.endProdDate);

      if (!(start < end)) {
        errorMessages.push(
          `ValidationError: For subseries ${subSeries}, model year ${record.modelYear}: startProdDate must be earlier than endProdDate.`
        );
        errorMessages.push(
          `ValidationError: For subseries ${subSeries}, model year ${record.modelYear}: endProdDate must be later than startProdDate.`
        );
      }

      /**
       * @description Rule 3: Next MY start must be exactly +1 day from previous MY end (same subseries)
       */
      if (i > 0) {
        const prev = records[i - 1];
        const prevEnd = toUTCDate(prev.endProdDate);
        const expectedStart = addDaysUTC(prevEnd, 1);
        const currentStart = start;

        if (currentStart.getTime() !== expectedStart.getTime()) {
          errorMessages.push(
            `ValidationError: For subseries ${subSeries}, model year ${record.modelYear}: startProdDate must be one day after previous model year endProdDate.`
          );
        }
      }
    }

    /**
     * @description Rule 4: Month-level coverage for scenario timeframe
     * - First MY start month <= scenario start month
     * - Last MY end month >= scenario end month
     */
    if (records.length > 0) {
      const firstStartYM = toYYYYMM(records[0].startProdDate);
      const lastEndYM = toYYYYMM(records[records.length - 1].endProdDate);

      if (scenarioStartYM && firstStartYM > scenarioStartYM) {
        errorMessages.push(
          `ValidationError: For subseries ${subSeries}: First model year start must be same or earlier than scenario start.`
        );
      }

      if (scenarioEndYM && lastEndYM < scenarioEndYM) {
        errorMessages.push(
          `ValidationError: For subseries ${subSeries}: Last model year start must be same or later than scenario end.`
        );
      }
    }
  }
}

/**
 * @description Merge existing DB rows and incoming request rows
 * Incoming rows override DB rows for the same (subSeries + modelYear)
 */
function mergeModelChangeRows(existingRows, inputRows) {
  const map = new Map();

  existingRows.forEach((r) => {
    map.set(`${r.subSeries}__${r.modelYear}`, r);
  });

  inputRows.forEach((r) => {
    map.set(`${r.subSeries}__${r.modelYear}`, r);
  });

  return Array.from(map.values());
}

/**
 * @description Helper: parse "MY 25" / "MY25" -> 25
 */
function parseMY(modelYear) {
  return parseInt(String(modelYear).match(/(\d{2})$/)[1], 10);
}

/**
 * @description Helper: create UTC date from "YYYY-MM-DD"
 */
function toUTCDate(dateStr) {
  const [y, m, d] = String(dateStr).split("-").map((x) => parseInt(x, 10));
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * @description Helper: add days in UTC
 */
function addDaysUTC(dateObj, days) {
  const dt = new Date(dateObj.getTime());
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt;
}

/**
 * @description Helper: convert "YYYY-MM-DD" to "YYYYMM"
 */
function toYYYYMM(dateStr) {
  return String(dateStr).slice(0, 7).replace("-", "");
}

module.exports = {
  validateInput,
};
