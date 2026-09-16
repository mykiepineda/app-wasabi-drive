import { render, screen, waitFor } from "@testing-library/react";
import { useMsal } from "@azure/msal-react";
import Home from "./Home";
import {
  API_ERROR_MESSAGES,
  ApiRequestError,
  authenticatedFetch,
} from "../auth/api-client";

jest.mock("@azure/msal-react", () => ({
  useMsal: jest.fn(),
}));
jest.mock("../auth/api-client", () => {
  const actual = jest.requireActual("../auth/api-client");
  return {
    ...actual,
    authenticatedFetch: jest.fn(),
  };
});

const account = { username: "user@example.com" };

beforeEach(() => {
  useMsal.mockReturnValue({
    accounts: [account],
    instance: { logoutRedirect: jest.fn() },
  });
  authenticatedFetch.mockReset();
});

test.each([
  [401, "authentication"],
  [403, "authorization"],
])("renders the safe message for HTTP %s", async (status, category) => {
  authenticatedFetch.mockRejectedValue(new ApiRequestError(category, status));

  render(<Home />);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    API_ERROR_MESSAGES[category]
  );
  expect(
    screen.queryByText(/security|object id|bearer|trusted/i)
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).toBeInTheDocument();
});

test("renders connectivity message for rejected fetch without starting login", async () => {
  const loginRedirect = jest.fn();
  useMsal.mockReturnValue({
    accounts: [account],
    instance: { loginRedirect, logoutRedirect: jest.fn() },
  });
  authenticatedFetch.mockRejectedValue(new ApiRequestError("service"));

  render(<Home />);

  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      API_ERROR_MESSAGES.service
    )
  );
  expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  expect(loginRedirect).not.toHaveBeenCalled();
  expect(
    screen.queryByText(API_ERROR_MESSAGES.authorization)
  ).not.toBeInTheDocument();
});