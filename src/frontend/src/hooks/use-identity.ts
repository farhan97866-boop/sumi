import { useInternetIdentity } from "@caffeineai/core-infrastructure";

/**
 * Thin wrapper over the template's Internet Identity context.
 * Exposes the pieces the suite needs for sign-in gating.
 */
export function useIdentity() {
  const {
    identity,
    login,
    clear,
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    loginError,
  } = useInternetIdentity();

  return {
    identity,
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    loginError,
    login: () => login(),
    logout: clear,
  };
}
