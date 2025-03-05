import * as rulesByScope from "./generated/rules-by-scope.mjs";
import { correctnessRules } from "./generated/rules-by-category.mjs";
import configByScope from "./generated/configs-by-scope.mjs";
import configByCategory from "./generated/configs-by-category.mjs";
import { splitDisabledRulesForVueAndSvelteFiles, overrideDisabledRulesForVueAndSvelteFiles } from "./config-helper.mjs";
const allRules = Object.assign(
  {},
  ...Object.values(rulesByScope)
);
const splitDisabledRulesForVueAndSvelteFilesDeep = (config) => {
  const entries = Object.entries(config).map(
    ([name, config2]) => [name, splitDisabledRulesForVueAndSvelteFiles(config2)]
  );
  return Object.fromEntries(entries);
};
const configs = {
  recommended: overrideDisabledRulesForVueAndSvelteFiles({
    plugins: ["oxlint"],
    rules: correctnessRules
  }),
  all: overrideDisabledRulesForVueAndSvelteFiles({
    plugins: ["oxlint"],
    rules: allRules
  }),
  "flat/all": splitDisabledRulesForVueAndSvelteFiles({
    name: "oxlint/all",
    rules: allRules
  }),
  "flat/recommended": splitDisabledRulesForVueAndSvelteFiles({
    name: "oxlint/recommended",
    rules: correctnessRules
  }),
  ...splitDisabledRulesForVueAndSvelteFilesDeep(configByScope),
  ...splitDisabledRulesForVueAndSvelteFilesDeep(configByCategory)
};
export {
  configs as default
};
