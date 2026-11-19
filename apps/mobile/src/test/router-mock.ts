/** Shared stand-in for expo-router's imperative API so screen tests can assert navigation. */
export const routerMock = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
};
