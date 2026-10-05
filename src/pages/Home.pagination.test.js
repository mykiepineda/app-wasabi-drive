import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useMsal } from "@azure/msal-react";
import Home, { breadcrumbsReducer } from "./Home";
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
let mockContentsProps;
jest.mock("../components/main/Contents", () => (props) => {
  mockContentsProps = props;
  const {
    contents,
    onBucketClick,
    onObjectClick,
    onPreviousPageClick,
    onNextPageClick,
  } = props;
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
  mockContentsProps = null;
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

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

test("ignores a stale folder response after a newer navigation request starts", async () => {
  const staleFolderResponse = deferred();
  const newerFolderResponse = deferred();

  authenticatedFetch.mockImplementation((instance, account, input) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.endsWith("/buckets")) {
      return Promise.resolve({
        json: async () => ({ Buckets: [{ Name: "bucket" }] }),
      });
    }
    if (/\/buckets\/[^/]+\/region$/.test(url)) {
      return Promise.resolve({ json: async () => regionResponse });
    }
    if (/\/buckets\/[^/]+\/objects\//.test(url)) {
      if (url.includes("folder-a")) {
        return staleFolderResponse.promise;
      }
      if (url.includes("folder-b")) {
        return newerFolderResponse.promise;
      }
      return Promise.resolve({
        json: async () => ({
          CommonPrefixes: [{ Prefix: "folder-a/" }, { Prefix: "folder-b/" }],
          Contents: [],
          KeyCount: 2,
          IsTruncated: false,
        }),
      });
    }

    return Promise.reject(new Error(`Unexpected request ${url}`));
  });

  render(<Home />);
  fireEvent.click(await screen.findByRole("button", { name: "bucket" }));
  await waitFor(() => expect(screen.getByText("folder-a")).toBeInTheDocument());

  const onObjectClick = mockContentsProps.onObjectClick;
  fireEvent.click(screen.getByRole("button", { name: "folder-a" }));
  await waitFor(() => expect(authenticatedFetch).toHaveBeenCalledWith(
    expect.any(Object),
    account,
    expect.stringContaining("/objects/folder-a/"),
    expect.objectContaining({ method: "GET" })
  ));

  act(() => {
    onObjectClick({
      stopPropagation: jest.fn(),
      currentTarget: { dataset: { prefix: "folder-b/" } },
    });
  });
  await waitFor(() => expect(authenticatedFetch).toHaveBeenCalledWith(
    expect.any(Object),
    account,
    expect.stringContaining("/objects/folder-b/"),
    expect.objectContaining({ method: "GET" })
  ));

  await act(async () => {
    newerFolderResponse.resolve({
      json: async () => ({
        Contents: [{ Key: "folder-b/newer.txt", AccessUrl: "https://objects.example.invalid/folder-b/newer.txt" }],
        CommonPrefixes: [],
        KeyCount: 1,
        IsTruncated: false,
      }),
    });
  });

  await waitFor(() => expect(screen.getByText("newer.txt")).toBeInTheDocument());

  await act(async () => {
    staleFolderResponse.resolve({
      json: async () => ({
        Contents: [{ Key: "folder-a/stale.txt", AccessUrl: "https://objects.example.invalid/folder-a/stale.txt" }],
        CommonPrefixes: [],
        KeyCount: 1,
        IsTruncated: false,
      }),
    });
  });

  await waitFor(() => expect(screen.queryByText("stale.txt")).not.toBeInTheDocument());
  expect(screen.getByText("newer.txt")).toBeInTheDocument();
});

test("hides the previous page while Next or Previous is loading", async () => {
  const pageTwoResponse = deferred();
  const previousPageResponse = deferred();
  let firstPageRequestCount = 0;
  const nextToken = "page-two-token";

  authenticatedFetch.mockImplementation((instance, account, input) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    if (url.pathname.endsWith("/buckets")) {
      return Promise.resolve({
        json: async () => ({ Buckets: [{ Name: "bucket" }] }),
      });
    }
    if (/\/buckets\/[^/]+\/region$/.test(url.pathname)) {
      return Promise.resolve({ json: async () => regionResponse });
    }
    if (/\/buckets\/[^/]+\/objects\//.test(url.pathname)) {
      const continuationToken = url.searchParams.get("ContinuationToken");
      if (continuationToken === nextToken) {
        return pageTwoResponse.promise;
      }
      firstPageRequestCount += 1;
      if (firstPageRequestCount === 1) {
        return Promise.resolve({
          json: async () => objectPage("page-1", nextToken),
        });
      }
      return previousPageResponse.promise;
    }

    return Promise.reject(new Error(`Unexpected request ${url}`));
  });

  await openBucket("page-1");

  fireEvent.click(screen.getByRole("button", { name: "next" }));
  await waitFor(() => expect(authenticatedFetch).toHaveBeenCalledTimes(5));
  expect(screen.queryByText("page-1")).not.toBeInTheDocument();

  await act(async () => {
    pageTwoResponse.resolve({
      json: async () => objectPage("page-2", null, false),
    });
  });
  expect(await screen.findByText("page-2")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "previous" }));
  await waitFor(() => expect(authenticatedFetch).toHaveBeenCalledTimes(7));
  expect(screen.queryByText("page-2")).not.toBeInTheDocument();

  await act(async () => {
    previousPageResponse.resolve({
      json: async () => objectPage("page-1", nextToken),
    });
  });
  expect(await screen.findByText("page-1")).toBeInTheDocument();
});

test("does not show a service error when an intentional request aborts", async () => {
  const abortError = new Error("The operation was aborted");
  abortError.name = "AbortError";
  authenticatedFetch.mockImplementation((instance, account, input) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.endsWith("/buckets")) {
      return Promise.reject(abortError);
    }
    return Promise.reject(new Error(`Unexpected request ${url}`));
  });

  render(<Home />);

  await waitFor(() => expect(authenticatedFetch).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
});

test("breadcrumbsReducer keeps state immutable when reusing an existing breadcrumb", () => {
  const state = [
    { target: "Buckets", level: 1 },
    { target: "bucket", level: 2 },
    { target: "folder/", level: 3 },
  ];

  const nextState = breadcrumbsReducer(state, { target: "bucket" });

  expect(nextState).toEqual([{ target: "Buckets", level: 1 }, { target: "bucket", level: 2 }]);
  expect(nextState).not.toBe(state);
  expect(state).toHaveLength(3);
});

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
  await waitFor(() => expect(screen.getByText("inside-folder")).toBeInTheDocument());

  const prefixUrl = new URL(authenticatedFetch.mock.calls[3][2]);
  expect(prefixUrl.pathname).toContain("folder%20name/%23%3F./");
  expect(prefixUrl.searchParams.has("ContinuationToken")).toBe(false);

  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "25" },
  });
  await waitFor(() => expect(authenticatedFetch).toHaveBeenCalledTimes(5));
  await waitFor(() => expect(screen.getByText("page-size-reset")).toBeInTheDocument());
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
