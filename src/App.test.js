import { render, screen } from "@testing-library/react";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import App from "./App";

jest.mock("@azure/msal-react", () => ({
  useMsal: jest.fn(),
}));
jest.mock("./pages/Home", () => () => null);

test("renders the Microsoft sign-in interface when unauthenticated", () => {
  useMsal.mockReturnValue({
    accounts: [],
    inProgress: InteractionStatus.None,
  });

  render(<App />);

  expect(
    screen.getByRole("button", { name: /sign in with microsoft/i })
  ).toBeInTheDocument();
});

test("renders the application when an MSAL account is present", () => {
  useMsal.mockReturnValue({
    accounts: [{ username: "user@example.com" }],
    inProgress: InteractionStatus.None,
  });

  render(<App />);

  expect(
    screen.queryByRole("button", { name: /sign in with microsoft/i })
  ).not.toBeInTheDocument();
});

test("shows loading UI while MSAL processes startup interaction", () => {
  useMsal.mockReturnValue({
    accounts: [],
    inProgress: InteractionStatus.HandleRedirect,
  });

  render(<App />);

  expect(
    screen.queryByRole("button", { name: /sign in with microsoft/i })
  ).not.toBeInTheDocument();
  expect(screen.getByRole("img", { hidden: true })).toBeInTheDocument();
});
