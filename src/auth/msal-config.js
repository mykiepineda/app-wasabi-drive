const requiredEntraVariables = [
  "REACT_APP_ENTRA_TENANT_ID",
  "REACT_APP_ENTRA_CLIENT_ID",
  "REACT_APP_ENTRA_API_SCOPE",
];

export const validateEntraConfig = (environment = process.env) => {
  const missingVariables = requiredEntraVariables.filter(
    (variableName) =>
      typeof environment[variableName] !== "string" ||
      environment[variableName].trim() === ""
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required Entra configuration: ${missingVariables.join(", ")}`
    );
  }

  return {
    tenantId: environment.REACT_APP_ENTRA_TENANT_ID,
    clientId: environment.REACT_APP_ENTRA_CLIENT_ID,
    apiScope: environment.REACT_APP_ENTRA_API_SCOPE,
  };
};

const { tenantId, clientId, apiScope } = validateEntraConfig();

export { apiScope };

export const msalConfig = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: `${window.location.origin}/`,
    postLogoutRedirectUri: `${window.location.origin}/`,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: [apiScope],
};
