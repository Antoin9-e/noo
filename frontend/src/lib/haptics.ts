// Android vibre, iOS ignore silencieusement
export function tap(pattern: number | number[] = 10) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* rien */
  }
}
