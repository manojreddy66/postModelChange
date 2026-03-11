/**
 * @description this file contains request validation methods
 */

const { dbConnect } = require("prismaORM/index");
const { scenariosData } = require("prismaORM/services/scenariosService");
const {
  modelChangeDatesData,
} = require("prismaORM/services/modelChangeDatesService");
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
  await validateParams(body, errorMessages);

  /* If Joi input validation was successful, check DB/business validations */
  if (errorMessages.length === 0) {
    const scenarioRow = await checkForInvalidScenario(body, errorMessages);

    if (scenarioRow) {
      await checkForModelChangeDateRules(body, scenarioRow, errorMessages);
    }
  }

  return [...new Set(errorMessages)];
}

/**
 * @description Function to validate request params using Joi schema
 * @param {Object} body - request body
 * @param {Array} errorMessages - array to collect validation errors
 */
async function validateParams(body, errorMessages) {
  const options = { abortEarly: false };
  const schema = await getValidationSchema();
  const { error } = await schema.validate(body, options);

  if (error) {
    error.details.forEach((detail) => {
      errorMessages.push(detail.message);
    });
  }
}

/**
 * @description Function to check if a scenario exists
 * @param {Object} body: Input request payload
 * @param {Array} errorMessages - array to collect validation errors
 * @returns {Object|null} scenario row if exists else null
 */
async function checkForInvalidScenario(body, errorMessages) {
  const rdb = await dbConnect();
  const scenariosDataService = new scenariosData(rdb);

  try {
    const scenarioData = await scenariosDataService.getScenarioDataById(
      body.scenarioId
    );

    if (!scenarioData || scenarioData.length === 0) {
      errorMessages.push("ValidationError: Scenario doesn't exist.");
      return null;
    }

    return scenarioData[0];
  } catch (err) {
    console.log("Error in checkForInvalidScenario:", err);
    throw err;
  }
}

/**
 * @description Function to fetch existing model change dates data and validate date rules
 * @param {Object} body - request body
 * @param {Object} scenarioRow - scenario row fetched from DB
 * @param {Array} errorMessages - array to collect validation errors
 */
async function checkForModelChangeDateRules(body, scenarioRow, errorMessages) {
  const rdb = await dbConnect();
  const modelChangeDatesService = new modelChangeDatesData(rdb);

  try {
    /**
     * @description Fetch existing model change dates data by scenarioId
     */
    const existingRows =
      await modelChangeDatesService.getModelChangeDatesByScenarioId(
        body.scenarioId
      );

    /**
     * @description Merge existing DB rows + incoming body rows
     * Incoming rows override DB rows for the same (subSeries + modelYear)
     */
    const mergedRows = mergeModelChangeRows(existingRows, body.data);

    /**
     * @description Validate business rules on merged (final) data set
     */
    validateDateRules(mergedRows, scenarioRow, errorMessages);
  } catch (err) {
    console.log("Error in checkForModelChangeDateRules:", err);
    throw err;
  }
}

/**
 * @description Function to merge existing DB rows and incoming request rows
 * @param {Array} existingRows - rows from DB
 * @param {Array} inputRows - rows from request body
 * @returns {Array} merged rows (final view after update)
 */
function mergeModelChangeRows(existingRows, inputRows) {
  const map = new Map();

  (existingRows || []).forEach((r) => {
    const key = `${r.subSeries}__${r.modelYear}`;
    map.set(key, r);
  });

  (inputRows || []).forEach((r) => {
    const key = `${r.subSeries}__${r.modelYear}`;
    map.set(key, r); // overwrite existing with incoming
  });

  return Array.from(map.values());
}

/**
 * @description Function to validate model change date rules on merged data
 * @param {Array} rows - merged model change date rows
 * @param {Object} scenarioRow - scenario row
 * @param {Array} errorMessages - collector
 */
function validateDateRules(rows, scenarioRow, errorMessages) {
  // Group by subSeries
  const bySubSeries = {};
  (rows || []).forEach((r) => {
    if (!bySubSeries[r.subSeries]) bySubSeries[r.subSeries] = [];
    bySubSeries[r.subSeries].push(r);
  });

  const scenarioStartYM = scenarioRow.start_month_year; // YYYYMM
  const scenarioEndYM = scenarioRow.end_month_year; // YYYYMM

  Object.keys(bySubSeries).forEach((subSeries) => {
    const subRows = bySubSeries[subSeries]
      .slice()
      .sort((a, b) => parseMY(a.modelYear) - parseMY(b.modelYear));

    // Rule 1 & 2: start < end (same MY + subSeries)
    subRows.forEach((r) => {
      const s = toUTCDate(r.startProdDate);
      const e = toUTCDate(r.endProdDate);

      if (!(s < e)) {
        errorMessages.push(
          `ValidationError: For subseries ${subSeries}, model year ${r.modelYear}: startProdDate must be earlier than endProdDate.`
        );
        errorMessages.push(
          `ValidationError: For subseries ${subSeries}, model year ${r.modelYear}: endProdDate must be later than startProdDate.`
        );
      }
    });

    // Rule 3: next MY start = prev MY end + 1 day (same subSeries)
    for (let i = 1; i < subRows.length; i++) {
      const prevEnd = toUTCDate(subRows[i - 1].endProdDate);
      const currStart = toUTCDate(subRows[i].startProdDate);
      const expected = addDaysUTC(prevEnd, 1);

      if (currStart.getTime() !== expected.getTime()) {
        errorMessages.push(
          `ValidationError: For subseries ${subSeries}, model year ${subRows[i].modelYear}: startProdDate must be one day after previous model year endProdDate.`
        );
      }
    }

    // Rule 4: first MY start month <= scenario start month
    if (scenarioStartYM && subRows.length > 0) {
      const firstStartYM = toYYYYMM(subRows[0].startProdDate);
      if (firstStartYM > scenarioStartYM) {
        errorMessages.push(
          `ValidationError: For subseries ${subSeries}: First model year start must be same month or earlier than scenario start.`
        );
      }
    }

    // Rule 4: last MY end month >= scenario end month
    if (scenarioEndYM && subRows.length > 0) {
      const lastEndYM = toYYYYMM(subRows[subRows.length - 1].endProdDate);
      if (lastEndYM < scenarioEndYM) {
        errorMessages.push(
          `ValidationError: For subseries ${subSeries}: Last model year end must be same month or later than scenario end.`
        );
      }
    }
  });
}

/**
 * @description Helper to parse "MY 25" / "MY25" -> 25
 */
function parseMY(modelYear) {
  const m = String(modelYear).match(/(\d{2})$/);
  return m ? parseInt(m[1], 10) : 0;
}

/**
 * @description Helper to create UTC date from "YYYY-MM-DD"
 */
function toUTCDate(dateStr) {
  const [y, m, d] = String(dateStr).split("-").map((x) => parseInt(x, 10));
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * @description Helper to add days in UTC
 */
function addDaysUTC(dateObj, days) {
  const dt = new Date(dateObj.getTime());
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt;
}

/**
 * @description Helper to convert "YYYY-MM-DD" to "YYYYMM"
 */
function toYYYYMM(dateStr) {
  return String(dateStr).slice(0, 7).replace("-", "");
}

module.exports = {
  validateInput,
};
