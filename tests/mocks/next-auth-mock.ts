const NextAuth = jest.fn(() => ({
  handlers: {},
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

export default NextAuth;

jest.mock("next-auth/providers/google", () => ({
  __esModule: true,
  default: jest.fn(() => ({ id: "google", name: "Google" })),
}));

jest.mock("next-auth/providers/credentials", () => ({
  __esModule: true,
  default: jest.fn(() => ({ id: "credentials", name: "Credentials" })),
}));
