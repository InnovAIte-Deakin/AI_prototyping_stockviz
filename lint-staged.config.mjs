const isLegacyPath = (filePath) =>
  filePath.startsWith("frontend/") || filePath.startsWith("backend/");

const toQuotedPaths = (filePaths) => filePaths.map((filePath) => `"${filePath}"`).join(" ");

const config = {
  "*.{ts,tsx,js,jsx}": (filePaths) => {
    const filteredPaths = filePaths.filter((filePath) => !isLegacyPath(filePath));

    if (filteredPaths.length === 0) {
      return [];
    }

    return `eslint --fix --max-warnings=0 --no-warn-ignored ${toQuotedPaths(filteredPaths)}`;
  },
  "*.{json,md,yml,yaml,css}": (filePaths) => {
    const filteredPaths = filePaths.filter((filePath) => !isLegacyPath(filePath));

    if (filteredPaths.length === 0) {
      return [];
    }

    return `prettier --write ${toQuotedPaths(filteredPaths)}`;
  },
};

export default config;
