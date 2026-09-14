import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { apiScope } from "./msal-config";

const tokenRequest = (account) => ({
  account,
  scopes: [apiScope],
});

export const getApiAccessToken = async (instance, account) => {
  try {
    const response = await instance.acquireTokenSilent(tokenRequest(account));
    return response.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      await instance.acquireTokenRedirect(tokenRequest(account));
      return null;
    }
    throw error;
  }
};

export const authenticatedFetch = async (
  instance,
  account,
  input,
  options = {}
) => {
  const accessToken = await getApiAccessToken(instance, account);
  if (!accessToken) {
    return null;
  }

  return fetch(input, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${accessToken}`,
      "X-Api-Key": process.env.REACT_APP_API_KEY,
    },
  });
};
