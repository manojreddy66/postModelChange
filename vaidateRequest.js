it("Unit Test Case 3: The API should return validation error with a 400 status code when accessed with an empty event.", async () => {
  console.log(
    "*****************Unit Test Case 3: The API should return validation error with a 400 status code when accessed with an empty event.*****************"
  );

  const event = {};
  const result = await lambda.handler(event);

  assert.equal(result.statusCode, 400);

  const response = JSON.parse(result.body);
  assert.deepEqual(response, {
    errorMessage: [
      "ValidationError: scenarioId is required and must be a uuid.",
      "ValidationError: userEmail is required and must be a string.",
      "ValidationError: data is required and must be an array with atleast 1 item.",
    ],
  });
});

it("Unit Test Case 4: The API should return a validation error (400) - scenarioId is missing.", async () => {
  console.log(
    "*****************Unit Test Case 4: The API should return a validation error with a 400 status code - scenarioId is missing.*****************"
  );

  const event = {
    body: JSON.stringify({
      userEmail: "gangone.priyadarshini@toyota.com",
      data: [
        {
          subSeries: "RAV4",
          modelYear: "MY 25",
          startProdDate: "2024-06-01",
          endProdDate: "2027-09-30",
        },
      ],
    }),
  };

  const result = await lambda.handler(event);
  assert.equal(result.statusCode, 400);

  const response = JSON.parse(result.body);
  assert.deepEqual(response, {
    errorMessage: ["ValidationError: scenarioId is required and must be a uuid."],
  });
});

it("Unit Test Case 5: The API should return a validation error (400) - invalid scenarioId.", async () => {
  console.log(
    "*****************Unit Test Case 5: The API should return a validation error with a 400 status code - invalid scenarioId.*****************"
  );

  const event = {
    body: JSON.stringify({
      scenarioId: "invalid_uuid",
      userEmail: "gangone.priyadarshini@toyota.com",
      data: [
        {
          subSeries: "RAV4",
          modelYear: "MY 25",
          startProdDate: "2024-06-01",
          endProdDate: "2027-09-30",
        },
      ],
    }),
  };

  const result = await lambda.handler(event);
  assert.equal(result.statusCode, 400);

  const response = JSON.parse(result.body);
  assert.deepEqual(response, {
    errorMessage: ["ValidationError: scenarioId is required and must be a uuid."],
  });
});

it("Unit Test Case 6: The API should return a validation error (400) - userEmail is missing.", async () => {
  console.log(
    "*****************Unit Test Case 6: The API should return a validation error with a 400 status code - userEmail is missing.*****************"
  );

  const event = {
    body: JSON.stringify({
      scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
      data: [
        {
          subSeries: "RAV4",
          modelYear: "MY 25",
          startProdDate: "2024-06-01",
          endProdDate: "2027-09-30",
        },
      ],
    }),
  };

  const result = await lambda.handler(event);
  assert.equal(result.statusCode, 400);

  const response = JSON.parse(result.body);
  assert.deepEqual(response, {
    errorMessage: ["ValidationError: userEmail is required and must be a string."],
  });
});

it("Unit Test Case 7: The API should return a validation error (400) - invalid userEmail.", async () => {
  console.log(
    "*****************Unit Test Case 7: The API should return a validation error with a 400 status code - invalid userEmail.*****************"
  );

  const event = {
    body: JSON.stringify({
      scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
      userEmail: "not-an-email",
      data: [
        {
          subSeries: "RAV4",
          modelYear: "MY 25",
          startProdDate: "2024-06-01",
          endProdDate: "2027-09-30",
        },
      ],
    }),
  };

  const result = await lambda.handler(event);
  assert.equal(result.statusCode, 400);

  const response = JSON.parse(result.body);
  assert.deepEqual(response, {
    errorMessage: ["ValidationError: Invalid userEmail."],
  });
});
it("Unit Test Case 8: The API should return a validation error (400) - data is missing.", async () => {
  console.log(
    "*****************Unit Test Case 8: The API should return a validation error with a 400 status code - data is missing.*****************"
  );

  const event = {
    body: JSON.stringify({
      scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
      userEmail: "gangone.priyadarshini@toyota.com",
    }),
  };

  const result = await lambda.handler(event);
  assert.equal(result.statusCode, 400);

  const response = JSON.parse(result.body);
  assert.deepEqual(response, {
    errorMessage: [
      "ValidationError: data is required and must be an array with atleast 1 item.",
    ],
  });
});

it("Unit Test Case 9: The API should return a validation error (400) - data is empty array.", async () => {
  console.log(
    "*****************Unit Test Case 9: The API should return a validation error with a 400 status code - data is empty array.*****************"
  );

  const event = {
    body: JSON.stringify({
      scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
      userEmail: "gangone.priyadarshini@toyota.com",
      data: [],
    }),
  };

  const result = await lambda.handler(event);
  assert.equal(result.statusCode, 400);

  const response = JSON.parse(result.body);
  assert.deepEqual(response, {
    errorMessage: [
      "ValidationError: data is required and must be an array with atleast 1 item.",
    ],
  });
});

it("Unit Test Case 10: The API should return a validation error (400) - invalid modelYear.", async () => {
  console.log(
    "*****************Unit Test Case 10: The API should return a validation error with a 400 status code - invalid modelYear.*****************"
  );

  const event = {
    body: JSON.stringify({
      scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
      userEmail: "gangone.priyadarshini@toyota.com",
      data: [
        {
          subSeries: "RAV4",
          modelYear: "25",
          startProdDate: "2024-06-01",
          endProdDate: "2027-09-30",
        },
      ],
    }),
  };

  const result = await lambda.handler(event);
  assert.equal(result.statusCode, 400);

  const response = JSON.parse(result.body);
  assert.deepEqual(response, {
    errorMessage: [
      "ValidationError: modelYear is required and must be a string in the format MY YY.",
    ],
  });
});
it("Unit Test Case 11: The API should return a validation error (400) - subSeries is missing.", async () => {
  console.log(
    "*****************Unit Test Case 11: The API should return a validation error with a 400 status code - subSeries is missing.*****************"
  );

  const event = {
    body: JSON.stringify({
      scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
      userEmail: "gangone.priyadarshini@toyota.com",
      data: [
        {
          modelYear: "MY 25",
          startProdDate: "2024-06-01",
          endProdDate: "2027-09-30",
        },
      ],
    }),
  };

  const result = await lambda.handler(event);
  assert.equal(result.statusCode, 400);

  const response = JSON.parse(result.body);
  assert.deepEqual(response, {
    errorMessage: ["ValidationError: subSeries is required and must be a string."],
  });
});

it("Unit Test Case 12: The API should return a validation error (400) - startProdDate is missing.", async () => {
  console.log(
    "*****************Unit Test Case 12: The API should return a validation error with a 400 status code - startProdDate is missing.*****************"
  );

  const event = {
    body: JSON.stringify({
      scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
      userEmail: "gangone.priyadarshini@toyota.com",
      data: [
        {
          subSeries: "RAV4",
          modelYear: "MY 25",
          endProdDate: "2027-09-30",
        },
      ],
    }),
  };

  const result = await lambda.handler(event);
  assert.equal(result.statusCode, 400);

  const response = JSON.parse(result.body);
  assert.deepEqual(response, {
    errorMessage: [
      "ValidationError: startProdDate is required and must be a string in the format YYYY-MM-DD.",
    ],
  });
});

it("Unit Test Case 13: The API should return a validation error (400) - endProdDate is missing.", async () => {
  console.log(
    "*****************Unit Test Case 13: The API should return a validation error with a 400 status code - endProdDate is missing.*****************"
  );

  const event = {
    body: JSON.stringify({
      scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
      userEmail: "gangone.priyadarshini@toyota.com",
      data: [
        {
          subSeries: "RAV4",
          modelYear: "MY 25",
          startProdDate: "2024-06-01",
        },
      ],
    }),
  };

  const result = await lambda.handler(event);
  assert.equal(result.statusCode, 400);

  const response = JSON.parse(result.body);
  assert.deepEqual(response, {
    errorMessage: [
      "ValidationError: endProdDate is required and must be a string in the format YYYY-MM-DD.",
    ],
  });
});

it("Unit Test Case 14: The API should return a validation error (400) - startProdDate must be earlier than endProdDate.", async () => {
  console.log(
    "*****************Unit Test Case 14: The API should return a validation error with a 400 status code - startProdDate must be earlier than endProdDate.*****************"
  );

  process.env.VALIDATION = "nodata";

  const event = {
    body: JSON.stringify({
      scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
      userEmail: "gangone.priyadarshini@toyota.com",
      data: [
        {
          subSeries: "RAV4",
          modelYear: "MY 25",
          startProdDate: "2025-12-30",
          endProdDate: "2025-01-01",
        },
      ],
    }),
  };

  const result = await lambda.handler(event);
  assert.equal(result.statusCode, 400);

  const response = JSON.parse(result.body);
  assert.deepEqual(response, {
    errorMessage: [
      "ValidationError: For subseries RAV4, model year MY 25: startProdDate must be earlier than endProdDate.",
      "ValidationError: For subseries RAV4, model year MY 25: endProdDate must be later than startProdDate.",
    ],
  });
});


it("Unit Test Case 15: The API should return a validation error (400) - startProdDate must be one day after previous model year endProdDate.", async () => {
  console.log(
    "*****************Unit Test Case 15: The API should return a validation error with a 400 status code - startProdDate must be one day after previous model year endProdDate.*****************"
  );

  process.env.VALIDATION = "nodata";

  const event = {
    body: JSON.stringify({
      scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
      userEmail: "gangone.priyadarshini@toyota.com",
      data: [
        {
          subSeries: "RAV4",
          modelYear: "MY 25",
          startProdDate: "2024-06-01",
          endProdDate: "2025-12-30",
        },
        {
          subSeries: "RAV4",
          modelYear: "MY 26",
          startProdDate: "2026-01-02", // should be 2025-12-31
          endProdDate: "2027-09-30",
        },
      ],
    }),
  };

  const result = await lambda.handler(event);
  assert.equal(result.statusCode, 400);

  const response = JSON.parse(result.body);
  assert.deepEqual(response, {
    errorMessage: [
      "ValidationError: For subseries RAV4, model year MY 26: startProdDate must be one day after previous model year endProdDate.",
    ],
  });
});

it("Unit Test Case 16: The API should return a validation error (400) - First model year start must be same or earlier than scenario start.", async () => {
  console.log(
    "*****************Unit Test Case 16: The API should return a validation error with a 400 status code - First model year start must be same or earlier than scenario start.*****************"
  );

  process.env.VALIDATION = "nodata";

  const event = {
    body: JSON.stringify({
      scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
      userEmail: "gangone.priyadarshini@toyota.com",
      data: [
        {
          subSeries: "RAV4",
          modelYear: "MY 25",
          startProdDate: "2024-07-01", // later than scenario start month (assumed 202406)
          endProdDate: "2027-09-30",
        },
      ],
    }),
  };

  const result = await lambda.handler(event);
  assert.equal(result.statusCode, 400);

  const response = JSON.parse(result.body);
  assert.deepEqual(response, {
    errorMessage: [
      "ValidationError: For subseries RAV4: First model year start must be same or earlier than scenario start.",
    ],
  });
});


it("Unit Test Case 17: The API should return a validation error (400) - Last model year start must be same or later than scenario end.", async () => {
  console.log(
    "*****************Unit Test Case 17: The API should return a validation error with a 400 status code - Last model year start must be same or later than scenario end.*****************"
  );

  process.env.VALIDATION = "nodata";

  const event = {
    body: JSON.stringify({
      scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
      userEmail: "gangone.priyadarshini@toyota.com",
      data: [
        {
          subSeries: "RAV4",
          modelYear: "MY 25",
          startProdDate: "2024-06-01",
          endProdDate: "2027-08-30", // earlier than scenario end month (assumed 202709)
        },
      ],
    }),
  };

  const result = await lambda.handler(event);
  assert.equal(result.statusCode, 400);

  const response = JSON.parse(result.body);
  assert.deepEqual(response, {
    errorMessage: [
      "ValidationError: For subseries RAV4: Last model year start must be same or later than scenario end.",
    ],
  });
});

it("Unit Test Case 18: The API should return internal server error with a 500 status code - DB error.", async () => {
  console.log(
    "*****************Unit Test Case 18: The API should return internal server error with a 500 status code - DB error.*****************"
  );

  process.env.VALIDATION = "dberror";

  const event = {
    body: JSON.stringify({
      scenarioId: "a2940022-37f7-46ba-9fac-11fdb213914c",
      userEmail: "gangone.priyadarshini@toyota.com",
      data: [
        {
          subSeries: "RAV4",
          modelYear: "MY 25",
          startProdDate: "2024-06-01",
          endProdDate: "2027-09-30",
        },
      ],
    }),
  };

  const result = await lambda.handler(event);
  assert.equal(result.statusCode, 500);

  assert.deepEqual(JSON.parse(result.body).errorMessage, "Internal Server Error");
});

