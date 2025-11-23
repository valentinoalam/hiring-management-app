declare module '#main-entry-point' {
  // Replace 'any' with the specific types of your main export if known
  const exports: Record<string, unknown>;
  export = exports;
}