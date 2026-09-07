export const getEnv = (key) => {
    if (typeof window !== "undefined" && window.__ENV && window.__ENV[key]) {
        return window.__ENV[key];
    }
    return process.env[key];
};