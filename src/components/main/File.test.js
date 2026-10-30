import { fireEvent, render, screen } from "@testing-library/react";
import File from "./File";

const accessUrl =
  "https://objects.example.invalid/file?X-Amz-Signature=fake-signature";
const thumbnailAccessUrl =
  "https://objects.example.invalid/file.webp?X-Amz-Signature=fake-thumbnail";

test("uses the authorized URL for a file link", () => {
  render(<File accessUrl={accessUrl} description="notes.txt" />);

  expect(screen.getByRole("link")).toHaveAttribute("href", accessUrl);
});

test("uses the authorized URL and native loading hints for an image", () => {
  render(<File accessUrl={accessUrl} description="photo.png" />);

  const image = screen.getByRole("img");

  expect(image).toHaveAttribute("src", accessUrl);
  expect(image).toHaveAttribute("alt", "photo.png");
  expect(image).toHaveAttribute("loading", "lazy");
  expect(image).toHaveAttribute("decoding", "async");
  expect(screen.getByRole("link")).toHaveAttribute("href", accessUrl);
});

test("uses a supplied thumbnail for image preview but opens the original", () => {
  render(
    <File
      accessUrl={accessUrl}
      thumbnailAccessUrl={thumbnailAccessUrl}
      description="photo.jpg"
    />
  );

  const image = screen.getByRole("img");
  const link = screen.getByRole("link");

  expect(image).toHaveAttribute("src", thumbnailAccessUrl);
  expect(image).toHaveAttribute("alt", "photo.jpg");
  expect(image).toHaveAttribute("loading", "lazy");
  expect(image).toHaveAttribute("decoding", "async");
  expect(link).toHaveAttribute("href", accessUrl);
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noreferrer");
});

test("falls back from a failed thumbnail to the original once", () => {
  render(
    <File
      accessUrl={accessUrl}
      thumbnailAccessUrl={thumbnailAccessUrl}
      description="photo.jpg"
    />
  );

  const image = screen.getByRole("img");
  fireEvent.error(image);

  expect(screen.getByRole("img")).toHaveAttribute("src", accessUrl);
  expect(screen.getByRole("link")).toHaveAttribute("href", accessUrl);
});

test("stops showing an image after the original preview also fails", () => {
  render(
    <File
      accessUrl={accessUrl}
      thumbnailAccessUrl={thumbnailAccessUrl}
      description="photo.jpg"
    />
  );

  fireEvent.error(screen.getByRole("img"));
  fireEvent.error(screen.getByRole("img"));

  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(screen.getByRole("link")).toHaveAttribute("href", accessUrl);
});

test("retries the preview when a supplied signed URL changes", () => {
  const { rerender } = render(
    <File
      prefix="object-key"
      accessUrl={accessUrl}
      thumbnailAccessUrl={thumbnailAccessUrl}
      description="photo.jpg"
    />
  );

  fireEvent.error(screen.getByRole("img"));
  fireEvent.error(screen.getByRole("img"));
  expect(screen.queryByRole("img")).not.toBeInTheDocument();

  const refreshedThumbnailUrl =
    "https://objects.example.invalid/refreshed.webp?X-Amz-Signature=fake-refresh";
  rerender(
    <File
      prefix="object-key"
      accessUrl={accessUrl}
      thumbnailAccessUrl={refreshedThumbnailUrl}
      description="photo.jpg"
    />
  );

  expect(screen.getByRole("img")).toHaveAttribute(
    "src",
    refreshedThumbnailUrl
  );
});

test("retries the preview when the file identity changes", () => {
  const { rerender } = render(
    <File
      prefix="first-object"
      accessUrl={accessUrl}
      thumbnailAccessUrl={thumbnailAccessUrl}
      description="photo.jpg"
    />
  );

  fireEvent.error(screen.getByRole("img"));
  fireEvent.error(screen.getByRole("img"));
  expect(screen.queryByRole("img")).not.toBeInTheDocument();

  rerender(
    <File
      prefix="second-object"
      accessUrl={accessUrl}
      thumbnailAccessUrl={thumbnailAccessUrl}
      description="photo.jpg"
    />
  );

  expect(screen.getByRole("img")).toHaveAttribute("src", thumbnailAccessUrl);
});

test("uses the authorized URL for a video source", () => {
  const { container } = render(
    <File
      accessUrl={accessUrl}
      thumbnailAccessUrl={thumbnailAccessUrl}
      description="clip.mp4"
    />
  );

  expect(container.querySelector("video source")).toHaveAttribute(
    "src",
    accessUrl
  );
  expect(container.querySelector("img")).toBeNull();
  expect(screen.getByRole("link")).toHaveAttribute("href", accessUrl);
});

test("does not construct a raw URL when AccessUrl is absent", () => {
  const { container } = render(<File description="photo.png" />);

  expect(container.querySelector("a")).not.toHaveAttribute("href");
  expect(screen.getByRole("img")).not.toHaveAttribute("src");
  expect(container.innerHTML).not.toContain("wasabisys.com");
});

test("does not use a malformed thumbnail as an image URL", () => {
  render(
    <File
      accessUrl={accessUrl}
      thumbnailAccessUrl="not-a-valid-url"
      description="photo.jpg"
    />
  );

  expect(screen.getByRole("img")).toHaveAttribute("src", accessUrl);
});
