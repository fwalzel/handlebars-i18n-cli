/****************************************
 * PUBLIC INTERFACE
 ****************************************/
/**
 * Write th DeepL auth key to .env file
 *
 * @param key
 * @param path
 * @returns {Promise<boolean>}
 */
export function setAuthKey(key: any, path?: string): Promise<boolean>;
/**
 * Function to fetch supported languages from the DeepL API
 *
 * @param authKey
 * @returns {Promise<*>}
 */
export function getSupportedLanguages(authKey: any): Promise<any>;
/**
 * Translate a string or an array of strings using the DeepL API
 *
 * @param authKey
 * @param texts
 * @param sourceLang
 * @param targetLang
 * @param options
 * @returns {Promise<TextResult|TextResult[]>}
 */
export function translateTexts(authKey: any, texts: any, sourceLang: any, targetLang: any, options: any): Promise<TextResult | TextResult[]>;
/** read a json file, translate it with the Deepl API, write the result as json file
 *
 * @param authKey
 * @param JsonSrc
 * @param JsonTarget
 * @param targetLangCode
 * @param sourceNested
 * @param sourceLangCode
 * @param log
 * @param dryRun
 * @param deeplOpts
 * @returns {Promise<boolean>}
 */
export function translateToJSON(authKey: any, JsonSrc: any, JsonTarget: any, sourceLangCode: any, targetLangCode: any, deeplOpts: any, sourceNested: any, log: any, dryRun: any): Promise<boolean>;
//# sourceMappingURL=i18n-deepl.d.ts.map