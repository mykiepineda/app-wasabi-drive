import { render, screen } from "@testing-library/react";
import File from "./File";

const accessUrl =
  "https://objects.example.invalid/file?X-Amz-Signature=fake-signature";

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

test("uses the authorized URL for a video source", () => {
  const { container } = render(
    <File accessUrl={accessUrl} description="clip.mp4" />
  );

  expect(container.querySelector("video source")).toHaveAttribute(
    "src",
    accessUrl
  );
  expect(screen.getByRole("link")).toHaveAttribute("href", accessUrl);
});

test("does not construct a raw URL when AccessUrl is absent", () => {
  const { container } = render(<File description="photo.png" />);

  expect(container.querySelector("a")).not.toHaveAttribute("href");
  expect(screen.getByRole("img")).not.toHaveAttribute("src");
  expect(container.innerHTML).not.toContain("wasabisys.com");
});
