export function shouldEnableGoogleSignIn(options: {
  isDev: boolean;
  isExpoGo: boolean;
  platformOs: string;
  webHostname?: string;
}): boolean {
  if (options.isDev || options.isExpoGo) return true;

  if (options.platformOs === "web") {
    return (
      options.webHostname === "localhost" ||
      options.webHostname === "127.0.0.1"
    );
  }

  return false;
}
