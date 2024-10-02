/*********************************************************************
 * i18n-deepl.js
 * @author: Florian Walzel

 /**
 *  Get an API Key:
 *  @link https://www.deepl.com/de/pro-checkout/account?productId=1200&yearly=false&trial=false
 *
 *  The API Docs
 *  @link https://www.deepl.com/docs-api/translate-text/multiple-sentences/
 */

import deepl from 'deepl-node';
import axios from 'axios';
import fst from 'async-file-tried';
import fs from 'fs';
import path from 'path';


/****************************************
 * HELPER FUNCTIONS
 ****************************************/

/**
 * Flatten an object by recursively writing its values to an array
 *
 * @param obj
 * @returns {*[]}
 */
function __flattenObj(obj) {
  const result = [];
  function recurse(curr) {
    for (let key in curr) {
      if (typeof curr[key] === 'object' && curr[key] !== null) {
        recurse(curr[key]);
      } else {
        result.push(curr[key]);
      }
    }
  }

  recurse(obj);
  return result;
}

/**
 * The inverse operation of __flattenObject(): maps the values of a flat array back to a given object
 *
 * @param obj
 * @param values
 * @returns {*}
 */
function __mapArrayToObj(obj, values, childParam) {
  let index = 0;

  function recurse(curr) {
    for (let key in curr) {
      if (typeof curr[key] === 'object' && curr[key] !== null) {
        recurse(curr[key]);
      } else {
        curr[key] = values[index++][childParam];
      }
    }
  }

  recurse(obj);
  return obj;
}

/** Traverse an object by a given path of sub-nodes and retrieve its value
 *
 * @param obj
 * @param path | given like "my.path.to", will retrieve {my: {path: {to: "Value" }}}
 * @returns {*}
 */
function __getValueFromPath(obj, path) {
  // Split the path into an array of keys
  const keys = path.split('.');

  // Use reduce to traverse the object
  return keys.reduce((acc, key) => {
    if (acc && acc.hasOwnProperty(key)) {
      return acc[key];
    }
    return undefined; // Return undefined if any key is not found
  }, obj);
}

/** Traverse an object by a given path of sub-nodes and set a value
 * at the given position
 *
 * @param obj
 * @param path
 * @param val
 * @private
 */
function __setNestedValue(obj, path, val) {
  const keys = path.split('.');
  keys.reduce((acc, key, index) => {
    // If we're at the last key in the path
    if (index === keys.length - 1) {
      // If the existing value is an object and so is the new value, merge them
      if (typeof acc[key] === 'object' && typeof val === 'object') {
        acc[key] = { ...acc[key], ...val };
      } else {
        acc[key] = val; // Otherwise, set the value directly
      }
    } else {
      // If the key doesn't exist, create an empty object to avoid `undefined`
      if (!acc[key]) acc[key] = {};
    }
    return acc[key];
  }, obj);
}

/** Modify a dot-delimited string by targeting the last segment and replacing it
 *
 * @param str
 * @param replacement
 * @returns {*}
 * @private
 */
function __replaceLastSegment(str, replacement) {
  console.log(typeof split)

  // Split the string into an array using the dot as a delimiter
  let segments = str.split('.');

  // Replace the last segment with the replacement value
  segments[segments.length - 1] = replacement;

  // Join the segments back into a single string
  return segments.join('.');
}

/**
 *
 * @param file
 * @returns {Promise<boolean>}
 * @private
 */
async function __fileExists(file) {
  let [res, err] = await fst.access(file, fst.constants.F_OK)
  return !!res
}


/****************************************
 * PUBLIC FUNCTIONS
 ****************************************/

/**
 * Write th DeepL auth key to .env file
 *
 * @param key
 * @returns {Promise<boolean>}
 */
async function setAuthKey(key) {
  if (typeof key !== 'string' || key === '')
    throw new Error('Provided argument is not a valid deepl auth key.');
  const file = '.env';
  let [res, err] = await fst.writeFile(file, `export DEEPL_AUTH=${key}`);
  if (err) {
    console.error(`Unable to read file ${file}`);
    throw err;
  }
  return true;
}

/**
 * Function to fetch supported languages from the DeepL API
 *
 * @param authKey
 * @returns {Promise<*>}
 */
async function getSupportedLanguages(authKey) {
  if (typeof authKey !== 'string')
    throw new Error('Invalid argument authKey provided.');
  try {
    const response = await axios.get('https://api-free.deepl.com/v2/languages', {
      params: {
        auth_key: authKey,
        type: 'target'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching supported languages:', error.response ? error.response.data : error.message);
    throw error;
  }
}

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
async function translateTexts(authKey, texts, sourceLang, targetLang, options) {
  if (typeof authKey !== 'string')
    throw new Error('Invalid argument authKey provided.');
  const translator = new deepl.Translator(authKey);
  return await translator.translateText(texts, sourceLang, targetLang, options);
}

/** read a json file with the option of returning only
 * a defined subNode of its content
 *
 * @param file
 * @param subNode
 * @returns {Promise<*>}
 */
async function readI18nJson(file, subNode) {
  let [res, err] = await fst.readJson(file);
  if (err) {
    console.error(`Unable to read file: ${file}`);
    throw err;
  }
  if (typeof subNode === 'string') {
    const subEntry = __getValueFromPath(res, subNode);
    if (subEntry)
      return subEntry;
    else
      throw new Error()
  }
  return res;
}

/**
 *
 * @param authKey
 * @param JsonSrc
 * @param JsonTarget
 * @param targetLang
 * @param sourceLang
 * @param sourceSub
 * @param options
 * @returns {Promise<boolean>}
 */
async function translateToJSON(authKey, JsonSrc, JsonTarget, targetLang, sourceLang, sourceSub, options) {
  console.log(`-- translateJSON --`);
  console.log(`authKey: ${authKey}`);
  console.log(`JsonSrc: ${JsonSrc}`);
  console.log(`JsonTarget: ${JsonTarget}`);
  console.log(`sourceLang: ${sourceLang}`);
  console.log(`targetLang: ${targetLang}`);
  console.log(`sourceSub: ${sourceSub}`);

  // read the json source
  const srcObj = await readI18nJson(JsonSrc, sourceLang);
  // flatten the resulting obj to an array
  const translValues = __flattenObj(srcObj);
  // run translation array against DeepL API
  const translRes = await translateTexts(authKey, translValues, sourceLang, targetLang, options);
  // re-build object structure from array
  const translObj = __mapArrayToObj(srcObj, translRes, 'text');

  // the object we are going to write out, holding the result
  let resultObj;

  // check if source and target are the identical file
  if (JsonSrc === JsonTarget
    || (await __fileExists(JsonTarget) &&
      fs.realpathSync(path.resolve(JsonSrc)) === fs.realpathSync(path.resolve(JsonTarget)))) {

    // if the content come from a nested source
    if (sourceSub) {
      // traverse in the obj one node before last and insert (or merge) the translation
      const traverse = __replaceLastSegment(sourceSub, targetLang);
      __setNestedValue(srcObj, traverse, translObj);
    } else {
      (srcObj[targetLang])
        ? Object.assign(srcObj[targetLang], translObj)
        : srcObj[targetLang] = translObj;
    }
    resultObj = srcObj;
  }
  else {
    resultObj = translObj;
  }
  // write out result
  console.log(resultObj);
  const [res, err] = await fst.writeJson(JsonTarget, resultObj);
  if (err) {
    console.error(`Unable to write file ${JsonTarget}`);
    throw err;
  }
  return true;
}

// Export the functions
export {
  setAuthKey,
  getSupportedLanguages,
  translateTexts,
  readI18nJson,
  translateToJSON
};