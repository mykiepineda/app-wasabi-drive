import { fireEvent, render, screen } from "@testing-library/react";
import { useMsal } from "@azure/msal-react";
import Links from "./Links";
import { msalConfig } from "../../auth/msal-config";

jest.mock("@azure/msal-react", () => ({
  useMsal: jest.fn(),
}));

test("signs out through MSAL redirect", () => {
  const logoutRedirect = jest.fn();
  useMsal.mockReturnValue({
    instance: { logoutRedirect },
    accounts: [{ username: "user@example.com" }],
  });

  render(<Links />);
  fireEvent.click(screen.getByRole("button", { name: /logout/i }));

  expect(logoutRedirect).toHaveBeenCalledWith({
    account: { username: "user@example.com" },
    postLogoutRedirectUri: msalConfig.auth.postLogoutRedirectUri,
  });
});
