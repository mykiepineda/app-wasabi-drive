const tenantId = process.env.REACT_APP_ENTRA_TENANT_ID;
const clientId = process.env.REACT_APP_ENTRA_CLIENT_ID;

export const apiScope = process.env.REACT_APP_ENTRA_API_SCOPE;

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
  scopes: apiScope ? [apiScope] : [],
};
