import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useAuth } from "../use-auth";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock server actions
vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

// Import mocked modules so we can control them
import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // ─── Initial state ────────────────────────────────────────────────────────

  test("starts with isLoading = false", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoading).toBe(false);
  });

  test("exposes signIn, signUp and isLoading", () => {
    const { result } = renderHook(() => useAuth());
    expect(typeof result.current.signIn).toBe("function");
    expect(typeof result.current.signUp).toBe("function");
    expect(typeof result.current.isLoading).toBe("boolean");
  });

  // ─── signIn ───────────────────────────────────────────────────────────────

  describe("signIn", () => {
    test("sets isLoading to true during execution then back to false", async () => {
      let resolveSignIn!: (v: any) => void;
      (signInAction as any).mockReturnValue(
        new Promise((res) => (resolveSignIn = res))
      );
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([]);
      (createProject as any).mockResolvedValue({ id: "proj-1" });

      const { result } = renderHook(() => useAuth());

      let signInPromise!: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("user@example.com", "password123");
      });

      // isLoading should be true while awaiting
      expect(result.current.isLoading).toBe(true);

      // Resolve the action
      await act(async () => {
        resolveSignIn({ success: true });
        await signInPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("returns the result from signInAction on success", async () => {
      (signInAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([{ id: "p1" }]);

      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signIn("user@example.com", "pass1234");
      });

      expect(returnValue).toEqual({ success: true });
    });

    test("returns the result from signInAction on failure", async () => {
      const errorResult = { success: false, error: "Invalid credentials" };
      (signInAction as any).mockResolvedValue(errorResult);

      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signIn("bad@example.com", "wrong");
      });

      expect(returnValue).toEqual(errorResult);
    });

    test("does not call handlePostSignIn when signIn fails", async () => {
      (signInAction as any).mockResolvedValue({ success: false, error: "Bad creds" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "bad");
      });

      expect(getAnonWorkData).not.toHaveBeenCalled();
      expect(getProjects).not.toHaveBeenCalled();
      expect(createProject).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    test("resets isLoading to false even when signInAction throws", async () => {
      (signInAction as any).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "pass1234").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("passes email and password to signInAction", async () => {
      (signInAction as any).mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "mypassword");
      });

      expect(signInAction).toHaveBeenCalledWith("test@example.com", "mypassword");
    });
  });

  // ─── signUp ───────────────────────────────────────────────────────────────

  describe("signUp", () => {
    test("sets isLoading to true during execution then back to false", async () => {
      let resolveSignUp!: (v: any) => void;
      (signUpAction as any).mockReturnValue(
        new Promise((res) => (resolveSignUp = res))
      );
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([]);
      (createProject as any).mockResolvedValue({ id: "proj-new" });

      const { result } = renderHook(() => useAuth());

      let signUpPromise!: Promise<any>;
      act(() => {
        signUpPromise = result.current.signUp("new@example.com", "password123");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignUp({ success: true });
        await signUpPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("returns the result from signUpAction on success", async () => {
      (signUpAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([{ id: "p2" }]);

      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signUp("new@example.com", "pass1234");
      });

      expect(returnValue).toEqual({ success: true });
    });

    test("returns the result from signUpAction on failure", async () => {
      const errorResult = { success: false, error: "Email already registered" };
      (signUpAction as any).mockResolvedValue(errorResult);

      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signUp("existing@example.com", "pass1234");
      });

      expect(returnValue).toEqual(errorResult);
    });

    test("does not call handlePostSignIn when signUp fails", async () => {
      (signUpAction as any).mockResolvedValue({ success: false, error: "Error" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("user@example.com", "pass");
      });

      expect(getAnonWorkData).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    test("resets isLoading to false even when signUpAction throws", async () => {
      (signUpAction as any).mockRejectedValue(new Error("Server error"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("user@example.com", "pass1234").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("passes email and password to signUpAction", async () => {
      (signUpAction as any).mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("signup@example.com", "newpassword");
      });

      expect(signUpAction).toHaveBeenCalledWith("signup@example.com", "newpassword");
    });
  });

  // ─── handlePostSignIn: anon work path ────────────────────────────────────

  describe("handlePostSignIn — anonymous work exists", () => {
    const anonWork = {
      messages: [{ id: "m1", role: "user", content: "Hello" }],
      fileSystemData: { "/App.tsx": { type: "file", content: "export default () => <div/>" } },
    };

    beforeEach(() => {
      (signInAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(anonWork);
      (createProject as any).mockResolvedValue({ id: "anon-project-1" });
    });

    test("creates a project with the anon work data", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "pass1234");
      });

      expect(createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: anonWork.messages,
          data: anonWork.fileSystemData,
        })
      );
    });

    test("gives the project a name with the current time", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "pass1234");
      });

      const callArg = (createProject as any).mock.calls[0][0];
      expect(callArg.name).toMatch(/Design from /);
    });

    test("clears anon work after creating project", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "pass1234");
      });

      expect(clearAnonWork).toHaveBeenCalledTimes(1);
    });

    test("navigates to the new project", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "pass1234");
      });

      expect(mockPush).toHaveBeenCalledWith("/anon-project-1");
    });

    test("does not call getProjects when anon work exists", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "pass1234");
      });

      expect(getProjects).not.toHaveBeenCalled();
    });
  });

  describe("handlePostSignIn — anon data with empty messages is ignored", () => {
    test("treats anonWork with empty messages as no anon work", async () => {
      (signInAction as any).mockResolvedValue({ success: true });
      // anonWork exists but messages is empty
      (getAnonWorkData as any).mockReturnValue({
        messages: [],
        fileSystemData: {},
      });
      (getProjects as any).mockResolvedValue([{ id: "existing-project" }]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "pass1234");
      });

      // Should fall through to getProjects path
      expect(getProjects).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/existing-project");
    });
  });

  describe("handlePostSignIn — no anon work, existing projects", () => {
    const projects = [
      { id: "proj-recent", name: "Recent Project" },
      { id: "proj-older", name: "Older Project" },
    ];

    beforeEach(() => {
      (signInAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue(projects);
    });

    test("navigates to the most recent (first) project", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "pass1234");
      });

      expect(mockPush).toHaveBeenCalledWith("/proj-recent");
    });

    test("does not create a new project when existing projects exist", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "pass1234");
      });

      expect(createProject).not.toHaveBeenCalled();
    });
  });

  describe("handlePostSignIn — no anon work, no existing projects", () => {
    beforeEach(() => {
      (signInAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([]);
      (createProject as any).mockResolvedValue({ id: "brand-new" });
    });

    test("creates a new project with empty messages and data", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "pass1234");
      });

      expect(createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [],
          data: {},
        })
      );
    });

    test("new project name matches 'New Design #<number>'", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "pass1234");
      });

      const callArg = (createProject as any).mock.calls[0][0];
      expect(callArg.name).toMatch(/^New Design #\d+$/);
    });

    test("navigates to the newly created project", async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "pass1234");
      });

      expect(mockPush).toHaveBeenCalledWith("/brand-new");
    });
  });

  // ─── signUp also triggers handlePostSignIn ────────────────────────────────

  describe("signUp also triggers post-sign-in logic", () => {
    test("navigates to existing project after successful signUp", async () => {
      (signUpAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([{ id: "existing-after-signup" }]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "pass1234");
      });

      expect(mockPush).toHaveBeenCalledWith("/existing-after-signup");
    });

    test("creates new project and navigates after signUp with no prior projects", async () => {
      (signUpAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([]);
      (createProject as any).mockResolvedValue({ id: "fresh-proj" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "pass1234");
      });

      expect(mockPush).toHaveBeenCalledWith("/fresh-proj");
    });

    test("migrates anon work to project after signUp", async () => {
      const anonWork = {
        messages: [{ id: "m1", role: "user", content: "Design this" }],
        fileSystemData: { "/App.tsx": {} },
      };

      (signUpAction as any).mockResolvedValue({ success: true });
      (getAnonWorkData as any).mockReturnValue(anonWork);
      (createProject as any).mockResolvedValue({ id: "migrated-proj" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "pass1234");
      });

      expect(createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: anonWork.messages,
          data: anonWork.fileSystemData,
        })
      );
      expect(clearAnonWork).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith("/migrated-proj");
    });
  });
});
