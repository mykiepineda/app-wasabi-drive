import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { apiScope } from "./msal-config";
import {
  API_ERROR_MESSAGES,
  ApiRequestError,
  authenticatedFetch,
  getApiAccessToken,
} from "./api-client";

test("requests the configured API scope silently", async () => {
  const acquireTokenSilent = jest.fn().mockResolvedValue({
    accessToken: "test-access-token",
  });
  const instance = { acquireTokenSilent };

  await getApiAccessToken(instance, { homeAccountId: "account-id" });

  expect(acquireTokenSilent).toHaveBeenCalledWith({
    account: { homeAccountId: "account-id" },
    scopes: [apiScope],
  });
});

test("uses redirect acquisition only when MSAL requires interaction", async () => {
  const acquireTokenSilent = jest
    .fn()
    .mockRejectedValue(new InteractionRequiredAuthError("interaction_required"));
  const acquireTokenRedirect = jest.fn().mockResolvedValue(undefined);
  const instance = { acquireTokenSilent, acquireTokenRedirect };
  const account = { homeAccountId: "account-id" };

  await expect(getApiAccessToken(instance, account)).resolves.toBeNull();
  expect(acquireTokenRedirect).toHaveBeenCalledWith({
    account,
    scopes: [apiScope],
  });
});

test("does not call the API after redirect-based token acquisition", async () => {
  const fetchMock = jest.spyOn(global, "fetch");
  const instance = {
    acquireTokenSilent: jest
      .fn()
      .mockRejectedValue(new InteractionRequiredAuthError("interaction_required")),
    acquireTokenRedirect: jest.fn().mockResolvedValue(undefined),
  };

  await expect(
    authenticatedFetch(instance, { homeAccountId: "account-id" }, "/buckets")
  ).resolves.toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();
  fetchMock.mockRestore();
});

test("adds the bearer token while preserving the API key header", async () => {
  const response = { ok: true };
  const fetchMock = jest
    .spyOn(global, "fetch")
    .mockResolvedValue(response);
  const instance = {
    acquireTokenSilent: jest.fn().mockResolvedValue({
      accessToken: "test-access-token",
    }),
  };

  await expect(
    authenticatedFetch(instance, { homeAccountId: "account-id" }, "/buckets", {
      method: "GET",
    })
  ).resolves.toBe(response);

  expect(fetchMock).toHaveBeenCalledWith("/buckets", {
    method: "GET",
    headers: {
      Authorization: "Bearer test-access-token",
      "X-Api-Key": "replace-with-rc1-api-key",
    },
  });
  fetchMock.mockRestore();
});

test.each([
  [401, "authentication"],
  [403, "authorization"],
  [500, "service"],
])("converts HTTP %s into a safe API error", async (status, category) => {
  jest.spyOn(global, "fetch").mockResolvedValue({ ok: false, status });
  const instance = {
    acquireTokenSilent: jest.fn().mockResolvedValue({
      accessToken: "test-access-token",
    }),
  };

  await expect(
    authenticatedFetch(instance, { homeAccountId: "account-id" }, "/buckets")
  ).rejects.toMatchObject({
    category,
    status,
    message: API_ERROR_MESSAGES[category],
  });
  global.fetch.mockRestore();
});

test("converts rejected fetch into a service error", async () => {
  jest.spyOn(global, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
  const instance = {
    acquireTokenSilent: jest.fn().mockResolvedValue({
      accessToken: "test-access-token",
    }),
  };

  await expect(
    authenticatedFetch(instance, { homeAccountId: "account-id" }, "/buckets")
  ).rejects.toEqual(new ApiRequestError("service"));
  global.fetch.mockRestore();
});
