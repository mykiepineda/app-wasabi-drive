import { validateEntraConfig } from "./msal-config";

const validConfig = {
  REACT_APP_ENTRA_TENANT_ID: "tenant-id",
  REACT_APP_ENTRA_CLIENT_ID: "client-id",
  REACT_APP_ENTRA_API_SCOPE: "api://scope/WasabiDrive.Access",
};

test("accepts a complete Entra configuration", () => {
  expect(validateEntraConfig(validConfig)).toEqual({
    tenantId: "tenant-id",
    clientId: "client-id",
    apiScope: "api://scope/WasabiDrive.Access",
  });
});

test.each([
  "REACT_APP_ENTRA_TENANT_ID",
  "REACT_APP_ENTRA_CLIENT_ID",
  "REACT_APP_ENTRA_API_SCOPE",
])("rejects whitespace-only %s without exposing configured values", (variableName) => {
  const environment = {
    ...validConfig,
    [variableName]: "   ",
  };

  expect(() => validateEntraConfig(environment)).toThrow(
    new RegExp(variableName)
  );
  expect(() => validateEntraConfig(environment)).toThrowError(
    expect.not.stringContaining("tenant-id")
  );
});

test("rejects an undefined required variable", () => {
  const environment = { ...validConfig };
  delete environment.REACT_APP_ENTRA_CLIENT_ID;

  expect(() => validateEntraConfig(environment)).toThrow(
    /REACT_APP_ENTRA_CLIENT_ID/
  );
});