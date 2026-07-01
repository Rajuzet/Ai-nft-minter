// Empty module shim for browser-incompatible native Node.js dependencies
// Used by Turbopack resolveAlias to silence missing peer-dep warnings from
// @metamask/sdk and pino-pretty when running in a browser environment.
export default {};
