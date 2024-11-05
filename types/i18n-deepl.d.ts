/****************************************
 * PUBLIC INTERFACE
 ****************************************/
/**
 * Write th DeepL auth key to .env file
 *
 * @param key
 * @returns {Promise<boolean>}
 */
export function setAuthKey(key: any): Promise<boolean>;
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
/** read a json file with the option of returning only
 * a defined subNode of its content
 *
 * @param file
 * @param subNode
 * @returns {Promise<*>}
 */
export function readI18nJson(file: any, subNode: any): Promise<any>;
/** read a json file, translate it with the Deepl API, write the result as json file
 *
 * @param authKey
 * @param JsonSrc
 * @param JsonTarget
 * @param targetLang
 * @param sourceNested
 * @param sourceLang
 * @param log
 * @param dryRun
 * @param deeplOpts
 * @returns {Promise<boolean>}
 */
export function translateToJSON(authKey: any, JsonSrc: any, JsonTarget: any, targetLang: any, sourceNested: any, sourceLang: any, log: any, dryRun: any, deeplOpts: any): Promise<boolean>;
//# sourceMappingURL=i18n-deepl.d.ts.map