/****************************************
 * EXPORT PUBLIC INTERFACE
 ****************************************/
declare interface opts {
  alphabetical?: boolean,
  dryRun?: boolean,
  lng?: Array<string>,
  log?: boolean,
  separateLngFiles?: boolean,
  update?: boolean,
}
export function i18nCollect(source: string, target: string, options?: opts): Promise<true | void>;
//# sourceMappingURL=i18n-collect.d.ts.map
