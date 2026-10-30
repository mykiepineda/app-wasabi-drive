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
}) => (
  <div>
    {contents.buckets.map((bucket) => (
      <button key={bucket.Name} onClick={onBucketClick}>
        {bucket.Name}
      </button>
    ))}
    {contents.files.map((file) => (
      <div
        key={file.key}
        data-testid="file"
        data-thumbnail-access-url={file.thumbnailAccessUrl}
      >
        <a href={file.accessUrl}>{file.description}</a>
      </div>
    ))}
  </div>
));

const account = { username: "user@example.com" };
const accessUrl =
  "https://objects.example.invalid/file?X-Amz-Signature=fake-signature";
const thumbnailAccessUrl =
  "https://objects.example.invalid/file.webp?X-Amz-Signature=fake-thumbnail";

beforeEach(() => {
  useMsal.mockReturnValue({
    accounts: [account],
    instance: {},
  });
  authenticatedFetch.mockReset();
});

test("carries backend AccessUrl and ThumbnailAccessUrl into the rendered file", async () => {
  authenticatedFetch
    .mockResolvedValueOnce({
      json: async () => ({ Buckets: [{ Name: "bucket" }] }),
    })
    .mockResolvedValueOnce({
      json: async () => ({ region: "us-east-1" }),
    })
    .mockResolvedValueOnce({
      json: async () => ({
        Contents: [
          {
            Key: "photo.jpg",
            AccessUrl: accessUrl,
            ThumbnailAccessUrl: thumbnailAccessUrl,
          },
        ],
        KeyCount: 1,
        TotalKeyCount: 1,
        MaxKeys: 10,
      }),
    });

  render(<Home />);
  fireEvent.click(await screen.findByRole("button", { name: "bucket" }));

  await waitFor(() =>
    expect(screen.getByRole("link", { name: "photo.jpg" })).toHaveAttribute(
      "href",
      accessUrl
    )
  );
  expect(screen.getByTestId("file")).toHaveAttribute(
    "data-thumbnail-access-url",
    thumbnailAccessUrl
  );
});
