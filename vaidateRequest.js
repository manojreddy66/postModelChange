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

const { getModelYearNumber, addDays, toYYYYMM } = require("utils/common_utils");

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
    /**
     * @description Validate scenario exists (DB validation)
     */
    const scenarioRow = await checkForInvalidScenario(body, errorMessages);

    /**
     * @description If scenario exists, validate business rules using merged dataset (DB + incoming)
     */
    if (scenarioRow) {
      await validateModelChangeDatesRules(body, scenarioRow, errorMessages);
    }
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
 * @description Function to check if a scenario exists (same pattern as GET API)
 * @param {Object} body - request body
 * @param {Array} errorMessages - array to collect validation errors
 * @returns {Object|null} scenario row if exists else null
 */
async function checkForInvalidScenario(body, errorMessages) {
  const rdb = await dbConnect();
  const scenariosService = new scenariosData(rdb);

  try {
    /**
     * @description Get scenario data by scenarioId
     */
    const scenarioData = await scenariosService.getScenarioDataById(
      body.scenarioId
    );

    /**
     * @description If scenario doesn't exist, add validation error and return null
     */
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
 * @description Function to validate model change dates business rules (doc point vi)
 * This validates on final data view: existing DB rows + incoming rows (incoming overrides).
 *
 * @param {Object} body - request body
 * @param {Object} scenarioRow - scenario row fetched from DB
 * @param {Array} errorMessages - collector to push validation errors
 */
async function validateModelChangeDatesRules(body, scenarioRow, errorMessages) {
  const rdb = await dbConnect();
  const modelChangeService = new modelChangeDatesData(rdb);

  try {
    /**
     * @description Fetch existing model change dates data by scenarioId (as per doc)
     */
    const existingRows =
      await modelChangeService.getModelChangeDatesByScenarioId(body.scenarioId);

    /**
     * @description Merge DB + incoming so we validate the final expected state
     */
    const finalRows = mergeModelChangeRows(existingRows, body.data);

    /**
     * @description Group merged rows by subSeries for validation
     */
    const groupedBySubSeries = {};
    finalRows.forEach((record) => {
      if (!groupedBySubSeries[record.subSeries]) {
        groupedBySubSeries[record.subSeries] = [];
      }
      groupedBySubSeries[record.subSeries].push(record);
    });

    /**
     * @description Scenario timeframe for month-level validation (YYYYMM)
     */
    const scenarioStartYM = scenarioRow.start_month_year;
    const scenarioEndYM = scenarioRow.end_month_year;

    /**
     * @description Validate each subSeries separately
     */
    for (const subSeries in groupedBySubSeries) {
      const records = groupedBySubSeries[subSeries];

      /**
       * @description Sort records by modelYear (MY 25, MY 26...) to validate sequential rules
       */
      records.sort(
        (a, b) => getModelYearNumber(a.modelYear) - getModelYearNumber(b.modelYear)
      );

      /**
       * @description Rule 1 & 2: startProdDate must be earlier than endProdDate (per MY, per subseries)
       */
      for (let i = 0; i < records.length; i++) {
        const record = records[i];

        // lead suggested no UTC helper; assume YYYY-MM-DD comparisons are consistent
        const start = new Date(record.startProdDate);
        const end = new Date(record.endProdDate);

        if (!(start < end)) {
          errorMessages.push(
            `ValidationError: For subseries ${subSeries}, model year ${record.modelYear}: startProdDate must be earlier than endProdDate.`
          );
          errorMessages.push(
            `ValidationError: For subseries ${subSeries}, model year ${record.modelYear}: endProdDate must be later than startProdDate.`
          );
        }

        /**
         * @description Rule 3: next MY startProdDate must be exactly +1 day from previous MY endProdDate (same subseries)
         */
        if (i > 0) {
          const prev = records[i - 1];
          const prevEnd = new Date(prev.endProdDate);
          const expectedStart = addDays(prevEnd, 1);

          if (start.getTime() !== expectedStart.getTime()) {
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
  } catch (err) {
    console.log("Error in validateModelChangeDatesRules:", err);
    throw err;
  }
}

/**
 * @description Merge existing DB rows and incoming request rows
 * Incoming rows override DB rows for the same (subSeries + modelYear)
 *
 * @param {Array} existingRows - model change rows fetched from DB
 * @param {Array} inputRows - model change rows sent by user in request body
 * @returns {Array} merged final rows
 */
function mergeModelChangeRows(existingRows, inputRows) {
  const map = new Map();

  (existingRows || []).forEach((r) => {
    map.set(`${r.subSeries}__${r.modelYear}`, r);
  });

  (inputRows || []).forEach((r) => {
    map.set(`${r.subSeries}__${r.modelYear}`, r);
  });

  return Array.from(map.values());
}

module.exports = {
  validateInput,
};
