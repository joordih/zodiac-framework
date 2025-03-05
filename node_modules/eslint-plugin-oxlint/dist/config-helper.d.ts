import { Linter } from 'eslint';
export declare const overrideDisabledRulesForVueAndSvelteFiles: (config: Linter.LegacyConfig<Record<string, "off">>) => Linter.LegacyConfig<Record<string, "off">>;
export declare const splitDisabledRulesForVueAndSvelteFiles: (config: Linter.Config) => Linter.Config[];
