export function logLine(message: string): void {
  console.log(message);
}

export function logError(error: unknown): void {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
}
