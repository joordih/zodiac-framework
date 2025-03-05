"use strict";
const rulesByScope = require("./generated/rules-by-scope.cjs");
const rulesByCategory = require("./generated/rules-by-category.cjs");
const configsByScope = require("./generated/configs-by-scope.cjs");
const configsByCategory = require("./generated/configs-by-category.cjs");
const configHelper = require("./config-helper.cjs");
const allRules = Object.assign(
  {},
  ...Object.values(rulesByScope)
);
const splitDisabledRulesForVueAndSvelteFilesDeep = (config) => {
  const entries = Object.entries(config).map(
    ([name, config2]) => [name, configHelper.splitDisabledRulesForVueAndSvelteFiles(config2)]
  );
  return Object.fromEntries(entries);
};
const configs = {
  recommended: configHelper.overrideDisabledRulesForVueAndSvelteFiles({
    plugins: ["oxlint"],
    rules: rulesByCategory.correctnessRules
  }),
  all: configHelper.overrideDisabledRulesForVueAndSvelteFiles({
    plugins: ["oxlint"],
    rules: allRules
  }),
  "flat/all": configHelper.splitDisabledRulesForVueAndSvelteFiles({
    name: "oxlint/all",
    rules: allRules
  }),
  "flat/recommended": configHelper.splitDisabledRulesForVueAndSvelteFiles({
    name: "oxlint/recommended",
    rules: rulesByCategory.correctnessRules
  }),
  ...splitDisabledRulesForVueAndSvelteFilesDeep(configsByScope),
  ...splitDisabledRulesForVueAndSvelteFilesDeep(configsByCategory)
};
module.exports = configs;
