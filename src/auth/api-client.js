import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { apiScope } from "./msal-config";

export const API_ERROR_MESSAGES = {
  authentication:
    "Your session could not be authenticated. Please sign out and sign in again.",
  authorization:
    "Your Microsoft account is signed in, but it is not authorized to use Wasabi Drive.",
  service: "Wasabi Drive could not reach the service. Please try again.",
};

export class ApiRequestError extends Error {
  constructor(category, status) {
    super(API_ERROR_MESSAGES[category]);
    this.name = "ApiRequestError";
    this.category = category;
    this.status = status;
  }
}

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

  let response;
  try {
    response = await fetch(input, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${accessToken}`,
        "X-Api-Key": process.env.REACT_APP_API_KEY,
      },
    });
  } catch {
    throw new ApiRequestError("service");
  }

  if (!response.ok) {
    const category =
      response.status === 401
        ? "authentication"
        : response.status === 403
          ? "authorization"
          : "service";
    throw new ApiRequestError(category, response.status);
  }

  return response;
};
