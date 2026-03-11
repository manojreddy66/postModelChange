const { BaseService } = require("./BaseService");
const { Prisma } = require("@prisma/client");

class modelChangeDatesData extends BaseService {
  constructor(db) {
    super(db);
  }

  /**
   * @description Function to fetch model change dates by scenarioId
   */
  async getModelChangeDatesByScenarioId(scenarioId) {
    try {
      return await this.prisma.$queryRaw`
        select
          sub_series_description as "subSeries",
          model_year as "modelYear",
          model_year_start_date as "startProdDate",
          model_year_end_date as "endProdDate"
        from supply_planning.model_change_date
        where scenario_id = ${scenarioId}::uuid and is_active = true
        order by sub_series_description, model_year;
      `;
    } catch (err) {
      console.log("Error in getModelChangeDatesByScenarioId:", err);
      throw err;
    }
  }

  /**
   * @description Function to upsert model change dates for a scenario
   * @param {String} scenarioId - scenario id
   * @param {String} userEmail - user email
   * @param {Array} input - [{ modelYear, subSeries, startProdDate, endProdDate }]
   */
  async upsertModelChangeDates(scenarioId, userEmail, input) {
    try {
      return await this.prisma.$executeRaw`
        INSERT INTO supply_planning.model_change_date (
          scenario_id,
          model_year,
          sub_series_description,
          model_year_start_date,
          model_year_end_date,
          created_by,
          updated_by,
          last_updated,
          is_active
        )
        SELECT
          ${scenarioId}::uuid AS scenario_id,
          v.model_year,
          v.sub_series_description,
          v.model_year_start_date,
          v.model_year_end_date,
          ${userEmail}::text AS created_by,
          ${userEmail}::text AS updated_by,
          NOW() AS last_updated,
          true AS is_active
        FROM (
          VALUES
          ${Prisma.join(
            input.map(
              (item) => Prisma.sql`(
                ${item.modelYear}::text,
                ${item.subSeries}::text,
                ${item.startProdDate}::date,
                ${item.endProdDate}::date
              )`
            )
          )}
        ) AS v(model_year, sub_series_description, model_year_start_date, model_year_end_date)
        ON CONFLICT (scenario_id, model_year, sub_series_description)
        DO UPDATE SET
          model_year_start_date = EXCLUDED.model_year_start_date,
          model_year_end_date = EXCLUDED.model_year_end_date,
          updated_by = ${userEmail}::text,
          last_updated = NOW(),
          is_active = true
      `;
    } catch (err) {
      console.log("Error in upsertModelChangeDates:", err);
      throw err;
    }
  }
}

module.exports.modelChangeDatesData = modelChangeDatesData;
