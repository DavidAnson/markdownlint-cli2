// @ts-check

export default {
  "environmentVariables": {
    // Emulate GitHub Actions behavior for consistency (see FORCE_COLOR and FORCE_HYPERLINK)
    // https://docs.github.com/en/actions/reference/workflows-and-actions/variables
    "CI": "true"
  }
};
