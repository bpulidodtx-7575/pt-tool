/**
 * Conventional Commits. The point is not ceremony — it is that a scanning
 * reader can tell from `git log --oneline` alone whether a commit changed
 * behaviour (`feat`/`fix`) or only its surroundings (`chore`/`docs`/`test`).
 */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Default is 100; long-but-clear subjects beat truncated-but-short ones.
    "header-max-length": [2, "always", 120],
  },
};
