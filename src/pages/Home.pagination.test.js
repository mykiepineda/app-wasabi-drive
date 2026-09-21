import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useMsal } from "@azure/msal-react";
import Home from "./Home";
import { authenticatedFetch } from "../auth/api-client";

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
jest.mock("../components/header/Header", () => () => null);
jest.mock("../components/main/Contents", () => ({
  contents,
  onBucketClick,
  onObjectClick,
  onPreviousPageClick,
  onNextPageClick,
}) => {
  const mockReact = require("react");
  const PaginationContext = require("../store/pagination-context").default;
  const ObjectsPerPage = require("../components/main/pagination/ObjectsPerPage").default;
  const pagination = mockReact.useContext(PaginationContext);
  return (
    <div>
      {contents.buckets.map((bucket) => (
        <button key={bucket.Name} onClick={onBucketClick}>
          {bucket.Name}
        </button>
      ))}
      {contents.folders.map((folder) => (
        <button
          key={folder.prefix}
          data-prefix={folder.prefix}
          onClick={onObjectClick}
        >
          {folder.description}
        </button>
      ))}
      {contents.files.map((file) => (
        <span key={file.key}>{file.description}</span>
      ))}
      <button
        disabled={pagination.reachedStart}
        onClick={onPreviousPageClick}
      >
        previous
      </button>
      <button disabled={pagination.reachedEnd} onClick={onNextPageClick}>
        next
      </button>
      <ObjectsPerPage />
    </div>
  );
});

const account = { username: "user@example.com" };

const objectPage = (key, nextContinuationToken, isTruncated = true) => ({
  Contents: [{ Key: key, AccessUrl: `https://objects.example.invalid/${key}` }],
  CommonPrefixes: [],
  KeyCount: 1,
  IsTruncated: isTruncated,
  ...(nextContinuationToken ? { NextContinuationToken: nextContinuationToken } : {}),
});

beforeEach(() => {
  useMsal.mockReturnValue({
    accounts: [account],
    instance: {},
  });
  authenticatedFetch.mockReset();
});

const openBucket = async (initialContent) => {
  render(<Home />);
  fireEvent.click(await screen.findByRole("button", { name: "bucket" }));
  await waitFor(() => expect(screen.getByText(initialContent)).toBeInTheDocument());
};

test("browses without TotalKeyCount and uses opaque cursor history", async () => {
  const firstToken = "opaque/?&# token";
  const secondToken = "second-token";
  authenticatedFetch
    .mockResolvedValueOnce({ json: async () => ({ Buckets: [{ Name: "bucket" }] }) })
    .mockResolvedValueOnce({ json: async () => ({ region: "us-east-1" }) })
    .mockResolvedValueOnce({ json: async () => objectPage("page-1", firstToken) })
    .mockResolvedValueOnce({ json: async () => objectPage("page-2", secondToken) })
    .mockResolvedValueOnce({ json: async () => objectPage("page-1", firstToken) });

  await openBucket("page-1");

  expect(new URL(authenticatedFetch.mock.calls[2][2]).searchParams.has("ContinuationToken")).toBe(
    false
  );

  fireEvent.click(screen.getByRole("button", { name: "next" }));
  await waitFor(() => expect(authenticatedFetch).toHaveBeenCalledTimes(4));
  expect(new URL(authenticatedFetch.mock.calls[3][2]).searchParams.get("ContinuationToken")).toBe(
    firstToken
  );

  fireEvent.click(screen.getByRole("button", { name: "previous" }));
  await waitFor(() => expect(authenticatedFetch).toHaveBeenCalledTimes(5));
  expect(new URL(authenticatedFetch.mock.calls[4][2]).searchParams.get("ContinuationToken")).toBe(
    null
  );
  expect(screen.getByRole("button", { name: "previous" })).toBeDisabled();
});

test("uses safe prefix paths and resets cursor history when page size changes", async () => {
  const prefix = "folder name/#?.";
  authenticatedFetch
    .mockResolvedValueOnce({ json: async () => ({ Buckets: [{ Name: "bucket" }] }) })
    .mockResolvedValueOnce({ json: async () => ({ region: "us-east-1" }) })
    .mockResolvedValueOnce({
      json: async () => ({
        CommonPrefixes: [{ Prefix: prefix }],
        Contents: [],
        KeyCount: 1,
        IsTruncated: false,
      }),
    })
    .mockResolvedValueOnce({ json: async () => objectPage("inside-folder", null, false) })
    .mockResolvedValueOnce({ json: async () => objectPage("page-size-reset", null, false) });

  await openBucket("folder name/#?");
  fireEvent.click(screen.getByRole("button", { name: "folder name/#?" }));
  await waitFor(() => expect(authenticatedFetch).toHaveBeenCalledTimes(4));

  const prefixUrl = new URL(authenticatedFetch.mock.calls[3][2]);
  expect(prefixUrl.pathname).toContain("folder%20name/%23%3F.");

  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "25" },
  });
  await waitFor(() => expect(authenticatedFetch).toHaveBeenCalledTimes(5));
  const resetUrl = new URL(authenticatedFetch.mock.calls[4][2]);
  expect(resetUrl.searchParams.get("MaxKeys")).toBe("25");
  expect(resetUrl.searchParams.has("ContinuationToken")).toBe(false);
});

test("disables Next when the backend reports the final page", async () => {
  authenticatedFetch
    .mockResolvedValueOnce({ json: async () => ({ Buckets: [{ Name: "bucket" }] }) })
    .mockResolvedValueOnce({ json: async () => ({ region: "us-east-1" }) })
    .mockResolvedValueOnce({ json: async () => objectPage("last-page", null, false) });

  await openBucket("last-page");

  expect(screen.getByRole("button", { name: "next" })).toBeDisabled();
});