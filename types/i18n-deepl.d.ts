/****************************************
 * PUBLIC INTERFACE
 ****************************************/
import {TextResult} from "deepl-node";

/**
 * Write th DeepL auth key to .env file
 *
 * @param key
 * @returns {Promise<boolean>}
 */
export function setAuthKey(key: string): Promise<boolean>;
/**
 * Function to fetch supported languages from the DeepL API
 *
 * @param authKey
 * @returns {Promise<*>}
 */
export function getSupportedLanguages(authKey: string): Promise<any>;

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
export function translateTexts(authKey: string, texts: Array<string>, sourceLang: string, targetLang: string, options?: object): Promise<TextResult | TextResult[]>;
/** read a json file, translate it with the Deepl API, write the result as json file
 *
 * @param authKey
 * @param JsonSrc
 * @param JsonTarget
 * @param targetLang
 * @param sourceLang
 * @param deeplOpts
 * @param sourceNested
 * @param log
 * @param dryRun
 * @returns {Promise<boolean>}
 */
export function translateToJSON(authKey: string, JsonSrc: string, JsonTarget: string, sourceLang: string, targetLang: string, deeplOpts?: object, sourceNested?: string, log?: boolean, dryRun?: boolean): Promise<boolean>;
//# sourceMappingURL=i18n-deepl.d.ts.map
