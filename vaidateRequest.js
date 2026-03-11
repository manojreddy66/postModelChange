const Joi = require("joi");

/**
 * @description Returns schema to validate POST model change dates request
 * @returns {Object} Joi schema
 */
function getValidationSchema() {
  return Joi.object({
    scenarioId: Joi.string().trim().uuid().required().messages({
      "any.required": "ValidationError: scenarioId is required and must be a uuid.",
      "string.base": "ValidationError: scenarioId is required and must be a uuid.",
      "string.empty": "ValidationError: scenarioId is required and must be a uuid.",
      "string.guid": "ValidationError: scenarioId is required and must be a uuid.",
    }),

    userEmail: Joi.string().trim().email().required().messages({
      "any.required": "ValidationError: userEmail is required and must be a string.",
      "string.base": "ValidationError: userEmail is required and must be a string.",
      "string.empty": "ValidationError: userEmail is required and must be a string.",
      "string.email": "ValidationError: Invalid userEmail.",
    }),

    data: Joi.array()
      .min(1)
      .required()
      .items(
        Joi.object({
          modelYear: Joi.string()
            .trim()
            .pattern(/^MY\s?\d{2}$/)
            .required()
            .messages({
              "any.required":
                "ValidationError: modelYear is required and must be a string in the format MY YY.",
              "string.base":
                "ValidationError: modelYear is required and must be a string in the format MY YY.",
              "string.empty":
                "ValidationError: modelYear is required and must be a string in the format MY YY.",
              "string.pattern.base":
                "ValidationError: modelYear is required and must be a string in the format MY YY.",
            }),

          subSeries: Joi.string().trim().required().messages({
            "any.required": "ValidationError: subSeries is required and must be a string.",
            "string.base": "ValidationError: subSeries is required and must be a string.",
            "string.empty": "ValidationError: subSeries is required and must be a string.",
          }),

          startProdDate: Joi.string()
            .trim()
            .pattern(/^\d{4}-\d{2}-\d{2}$/)
            .required()
            .messages({
              "any.required":
                "ValidationError: startProdDate is required and must be a string in the format YYYY-MM-DD.",
              "string.base":
                "ValidationError: startProdDate is required and must be a string in the format YYYY-MM-DD.",
              "string.empty":
                "ValidationError: startProdDate is required and must be a string in the format YYYY-MM-DD.",
              "string.pattern.base":
                "ValidationError: startProdDate is required and must be a string in the format YYYY-MM-DD.",
            }),

          endProdDate: Joi.string()
            .trim()
            .pattern(/^\d{4}-\d{2}-\d{2}$/)
            .required()
            .messages({
              "any.required":
                "ValidationError: endProdDate is required and must be a string in the format YYYY-MM-DD.",
              "string.base":
                "ValidationError: endProdDate is required and must be a string in the format YYYY-MM-DD.",
              "string.empty":
                "ValidationError: endProdDate is required and must be a string in the format YYYY-MM-DD.",
              "string.pattern.base":
                "ValidationError: endProdDate is required and must be a string in the format YYYY-MM-DD.",
            }),
        })
      )
      .messages({
        "any.required":
          "ValidationError: data is required and must be an array with atleast 1 item.",
        "array.base":
          "ValidationError: data is required and must be an array with atleast 1 item.",
        "array.min":
          "ValidationError: data is required and must be an array with atleast 1 item.",
      }),
  });
}

module.exports = {
  getValidationSchema,
};
