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
const regionResponse = { region: "us-east-1" };

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
    .mockResolvedValueOnce({ json: async () => regionResponse })
    .mockResolvedValueOnce({ json: async () => objectPage("page-1", firstToken) })
    .mockResolvedValueOnce({ json: async () => regionResponse })
    .mockResolvedValueOnce({ json: async () => objectPage("page-2", secondToken) })
    .mockResolvedValueOnce({ json: async () => regionResponse })
    .mockResolvedValueOnce({ json: async () => objectPage("page-1", firstToken) });

  await openBucket("page-1");

  expect(new URL(authenticatedFetch.mock.calls[2][2]).searchParams.has("ContinuationToken")).toBe(
    false
  );

  fireEvent.click(screen.getByRole("button", { name: "next" }));
  await waitFor(() => expect(authenticatedFetch).toHaveBeenCalledTimes(5));
  expect(new URL(authenticatedFetch.mock.calls[4][2]).searchParams.get("ContinuationToken")).toBe(
    firstToken
  );
  expect(await screen.findByText("page-2")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "previous" }));
  await waitFor(() => expect(authenticatedFetch).toHaveBeenCalledTimes(7));
  expect(new URL(authenticatedFetch.mock.calls[6][2]).searchParams.get("ContinuationToken")).toBe(
    null
  );
  expect(await screen.findByText("page-1")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "previous" })).toBeDisabled();
});

test("uses safe prefix paths and resets cursor history when page size changes", async () => {
  const prefix = "folder name/#?./";
  authenticatedFetch
    .mockResolvedValueOnce({ json: async () => ({ Buckets: [{ Name: "bucket" }] }) })
    .mockResolvedValueOnce({ json: async () => regionResponse })
    .mockResolvedValueOnce({
      json: async () => ({
        CommonPrefixes: [{ Prefix: prefix }],
        Contents: [],
        KeyCount: 1,
        IsTruncated: false,
      }),
    })
    .mockResolvedValueOnce({ json: async () => objectPage(`${prefix}inside-folder`, null, false) })
    .mockResolvedValueOnce({ json: async () => objectPage(`${prefix}page-size-reset`, null, false) });

  await openBucket("folder name/#?.");
  fireEvent.click(screen.getByRole("button", { name: "folder name/#?." }));
  await waitFor(() => expect(authenticatedFetch).toHaveBeenCalledTimes(4));

  const prefixUrl = new URL(authenticatedFetch.mock.calls[3][2]);
  expect(prefixUrl.pathname).toContain("folder%20name/%23%3F./");
  expect(prefixUrl.searchParams.has("ContinuationToken")).toBe(false);

  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "25" },
  });
  await waitFor(() => expect(authenticatedFetch).toHaveBeenCalledTimes(5));
  const resetUrl = new URL(authenticatedFetch.mock.calls[4][2]);
  expect(resetUrl.searchParams.get("MaxKeys")).toBe("25");
  expect(resetUrl.searchParams.has("ContinuationToken")).toBe(false);
  expect(screen.getByRole("combobox")).toHaveValue("25");
});

test("entering a folder resets previously accumulated cursor history", async () => {
  const bucketToken = "bucket-next-token";
  authenticatedFetch
    .mockResolvedValueOnce({ json: async () => ({ Buckets: [{ Name: "bucket" }] }) })
    .mockResolvedValueOnce({ json: async () => regionResponse })
    .mockResolvedValueOnce({ json: async () => objectPage("page-1", bucketToken) })
    .mockResolvedValueOnce({ json: async () => regionResponse })
    .mockResolvedValueOnce({
      json: async () => ({
        CommonPrefixes: [{ Prefix: "folder/" }],
        Contents: [],
        KeyCount: 1,
        IsTruncated: false,
      }),
    })
    .mockResolvedValueOnce({ json: async () => objectPage("folder/inside-folder", null, false) });

  await openBucket("page-1");

  fireEvent.click(screen.getByRole("button", { name: "next" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "folder" })).toBeInTheDocument());
  expect(new URL(authenticatedFetch.mock.calls[4][2]).searchParams.get("ContinuationToken")).toBe(
    bucketToken
  );

  fireEvent.click(screen.getByRole("button", { name: "folder" }));
  await waitFor(() => expect(screen.getByText("inside-folder")).toBeInTheDocument());

  const folderUrl = new URL(authenticatedFetch.mock.calls[5][2]);
  expect(folderUrl.pathname).toContain("/objects/folder/");
  expect(folderUrl.searchParams.has("ContinuationToken")).toBe(false);
  expect(screen.getByRole("button", { name: "previous" })).toBeDisabled();
});

test("disables Next when the backend reports the final page", async () => {
  authenticatedFetch
    .mockResolvedValueOnce({ json: async () => ({ Buckets: [{ Name: "bucket" }] }) })
    .mockResolvedValueOnce({ json: async () => regionResponse })
    .mockResolvedValueOnce({ json: async () => objectPage("last-page", null, false) });

  await openBucket("last-page");

  expect(screen.getByRole("button", { name: "next" })).toBeDisabled();
});
