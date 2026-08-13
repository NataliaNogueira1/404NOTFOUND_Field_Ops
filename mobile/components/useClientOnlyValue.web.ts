// On web, this module is only loaded on the client bundle.
export function useClientOnlyValue<S, C>(_server: S, client: C): S | C {
  return client;
}
