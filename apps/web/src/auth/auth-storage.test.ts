import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { authStorage } from "@/auth/auth-storage";

describe("authStorage", () => {
  const user = {
    id: "user-1",
    name: "Maria Silva",
    email: "maria@email.com",
  };

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should return null when there is no stored session", () => {
    expect(authStorage.getAccessToken()).toBeNull();
    expect(authStorage.getUser()).toBeNull();
  });

  it("should save and retrieve the session", () => {
    authStorage.saveSession("access-token", user);

    expect(authStorage.getAccessToken()).toBe("access-token");

    expect(authStorage.getUser()).toEqual(user);
  });

  it("should clear the stored session", () => {
    authStorage.saveSession("access-token", user);

    authStorage.clearSession();

    expect(authStorage.getAccessToken()).toBeNull();
    expect(authStorage.getUser()).toBeNull();
  });

  it("should remove an invalid stored user and return null", () => {
    localStorage.setItem("currency-quote:user", "invalid-json");

    expect(authStorage.getUser()).toBeNull();

    expect(localStorage.getItem("currency-quote:user")).toBeNull();
  });
});
