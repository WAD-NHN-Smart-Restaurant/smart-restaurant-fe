// Pure utility functions
export const isClient = () => typeof window !== "undefined";
export const isServer = () => typeof window === "undefined";
