import { fireEvent, render, screen } from "@testing-library/react";
import { useMsal } from "@azure/msal-react";
import Login from "./Login";
import { loginRequest } from "../auth/msal-config";

jest.mock("@azure/msal-react", () => ({
  useMsal: jest.fn(),
}));

test("starts Microsoft sign-in with the configured request", async () => {
  const loginRedirect = jest.fn().mockResolvedValue(undefined);
  useMsal.mockReturnValue({ instance: { loginRedirect } });

  render(<Login />);
  fireEvent.click(
    screen.getByRole("button", { name: /sign in with microsoft/i })
  );

  expect(loginRedirect).toHaveBeenCalledWith(loginRequest);
});
