import { test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MainContent } from "../main-content";

// Mock all child components and contexts
vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: any) => <div>{children}</div>,
  useFileSystem: vi.fn(() => ({ getAllFiles: () => new Map(), refreshTrigger: 0 })),
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: any) => <div>{children}</div>,
  useChat: vi.fn(() => ({
    messages: [],
    input: "",
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    status: "idle",
  })),
}));

vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface">Chat</div>,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree">FileTree</div>,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor">CodeEditor</div>,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame">Preview</div>,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions">Actions</div>,
}));

vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  ResizablePanel: ({ children }: any) => <div>{children}</div>,
  ResizableHandle: () => <div />,
}));

afterEach(cleanup);

test("Preview button is active by default", () => {
  render(<MainContent />);
  const previewBtn = screen.getByRole("button", { name: "Preview" });
  const codeBtn = screen.getByRole("button", { name: "Code" });

  expect(previewBtn.className).toContain("bg-white");
  expect(codeBtn.className).not.toContain("bg-white");
});

test("clicking Code button switches to code view", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  // Preview is shown initially
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();

  // Click Code button
  await user.click(screen.getByRole("button", { name: "Code" }));

  // Code editor is now shown
  expect(screen.getByTestId("code-editor")).toBeDefined();
  expect(screen.queryByTestId("preview-frame")).toBeNull();
});

test("clicking Preview button switches back to preview", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  // Switch to Code first
  await user.click(screen.getByRole("button", { name: "Code" }));
  expect(screen.getByTestId("code-editor")).toBeDefined();

  // Switch back to Preview
  await user.click(screen.getByRole("button", { name: "Preview" }));
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
});

test("active button reflects current view", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  const previewBtn = screen.getByRole("button", { name: "Preview" });
  const codeBtn = screen.getByRole("button", { name: "Code" });

  // Initially Preview is active
  expect(previewBtn.className).toContain("bg-white");
  expect(codeBtn.className).not.toContain("bg-white");

  // After clicking Code, Code is active
  await user.click(codeBtn);
  expect(codeBtn.className).toContain("bg-white");
  expect(previewBtn.className).not.toContain("bg-white");
});
