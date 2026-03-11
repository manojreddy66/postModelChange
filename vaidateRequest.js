const { BaseService } = require("./BaseService");

/**
 * @description Mock service for model change dates API
 * This mock follows repo pattern (process.env based branching)
 */

class modelChangeDatesData extends BaseService {
  constructor(db) {
    super(db);
  }

  /**
   * @description Function to fetch model change dates by scenarioId
   */
  async getModelChangeDatesByScenarioId(scenarioId) {
    try {
      console.log(
        "*********query***********",
        `select ... from supply_planning.model_change_date where scenario_id = ${scenarioId}::uuid;`
      );

      // Simulate DB error during fetch
      if (process.env.VALIDATION === "dberror_fetch") {
        throw new Error("getModelChangeDatesByScenarioId DB error");
      }

      // No data case
      if (process.env.VALIDATION === "nodata") {
        return [];
      }

      // Default sample rows (aliased shape used by validateRequest/utils)
      return [
        {
          subSeries: "RAV4",
          modelYear: "MY 25",
          startProdDate: "2025-01-01",
          endProdDate: "2025-12-30",
        },
        {
          subSeries: "RAV4",
          modelYear: "MY 26",
          startProdDate: "2026-01-01",
          endProdDate: "2026-12-30",
        },
        {
          subSeries: "CAMRY",
          modelYear: "MY 25",
          startProdDate: "2025-02-01",
          endProdDate: "2025-11-30",
        },
      ];
    } catch (err) {
      console.log("Error in getModelChangeDatesByScenarioId:", err);
      throw err;
    }
  }

  /**
   * @description Function to upsert model change dates rows (POST API)
   */
  async upsertModelChangeDates(scenarioId, userEmail, input) {
    try {
      console.log(
        "*********query***********",
        `upsert model_change_date for scenario_id=${scenarioId}, updated_by=${userEmail}, rows=${(input || []).length}`
      );

      // Simulate DB error during upsert
      if (process.env.VALIDATION === "dberror_upsert") {
        throw new Error("upsertModelChangeDates DB error");
      }

      return "success";
    } catch (err) {
      console.log("Error in upsertModelChangeDates:", err);
      throw err;
    }
  }
}

module.exports.modelChangeDatesData = modelChangeDatesData;
