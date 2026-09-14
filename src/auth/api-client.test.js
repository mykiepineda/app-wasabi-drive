import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { apiScope } from "./msal-config";
import { authenticatedFetch, getApiAccessToken } from "./api-client";

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

test("adds the bearer token while preserving the API key header", async () => {
  const fetchMock = jest
    .spyOn(global, "fetch")
    .mockResolvedValue({ ok: true });
  const instance = {
    acquireTokenSilent: jest.fn().mockResolvedValue({
      accessToken: "test-access-token",
    }),
  };

  await authenticatedFetch(instance, { homeAccountId: "account-id" }, "/buckets", {
    method: "GET",
  });

  expect(fetchMock).toHaveBeenCalledWith("/buckets", {
    method: "GET",
    headers: {
      Authorization: "Bearer test-access-token",
      "X-Api-Key": undefined,
    },
  });
  fetchMock.mockRestore();
});
