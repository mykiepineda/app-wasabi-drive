import { render, screen } from "@testing-library/react";
import File from "./File";

const accessUrl =
  "https://objects.example.invalid/file?X-Amz-Signature=fake-signature";

test("uses the authorized URL for a file link", () => {
  render(<File accessUrl={accessUrl} description="notes.txt" />);

  expect(screen.getByRole("link")).toHaveAttribute("href", accessUrl);
});

test("uses the authorized URL for an image thumbnail", () => {
  render(<File accessUrl={accessUrl} description="photo.png" />);

  expect(screen.getByRole("img")).toHaveAttribute("src", accessUrl);
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
