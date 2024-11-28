/*********************************************************************
 * i18n-deepl.js
 * @author: Florian Walzel
 *
 *  Get an API Key:
 *  @link https://www.deepl.com/de/pro-checkout/account?productId=1200&yearly=false&trial=false
 *
 *  The API Docs:
 *  @link https://www.deepl.com/docs-api/translate-text/multiple-sentences/
 */


/****************************************
 * IMPORT
 ****************************************/

import deepl from 'deepl-node';
import axios from 'axios';
import fst from 'async-file-tried';
import path from 'path';


/****************************************
 * PRIVATE FUNCTIONS
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
  return result
}

/**
 * The inverse operation of __flattenObject(): maps the values of a flat array back to a given object
 *
 * @param obj
 * @param values
 * @param childParam
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
  return obj
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
 * @param langCode
 * @private
 */
function __setNestedValue(obj, path, val, langCode) {
  const keys = path.split('.');

  function iterate(ob, keys, insert, lngCode, i = 0) {
    let key = keys[i];
    if (i < keys.length - 1) {
      i = i+1;
      iterate(ob[key], keys, insert, langCode, i);
    }
    else {
      ob[key][langCode] = (typeof ob[key][langCode] === 'object')
        ? {...ob[key][langCode], ...insert}
        : ob[key][langCode] = insert;
    }
  }

  iterate(obj, keys, val, langCode);
  return true
}


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
async function setAuthKey(key, path='./') {
  if (typeof key !== 'string' || key === '')
    throw new Error('Provided argument is not a valid DeepL auth key.');
  const file = '.env';
  let [res, err] = await fst.writeFile([path, file], `export DEEPL_AUTH=${key}`);
  if (err) {
    throw new Error(`Failed to write file ${file}`);
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
  if (typeof authKey !== 'string' || authKey === '')
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
  if (typeof authKey !== 'string' || authKey === '')
    throw new Error('Invalid argument authKey provided.');
  const translator = new deepl.Translator(authKey);
  let [res, err] =
    await fst.asyncHandler(() => translator.translateText(texts, sourceLang, targetLang, options));
  if (err)
    throw (err);
  return res;
}


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
async function translateToJSON(
  authKey,
  JsonSrc,
  JsonTarget,
  sourceLangCode,
  targetLangCode,
  deeplOpts,
  sourceNested,
  log,
  dryRun) {

  // read the json source
  let [srcObj, err] = await fst.readJson(JsonSrc);
  if (err) {
    console.error(`Unable to read file: ${file}`);
    throw err;
  }

  // make a copy of srcObj to avoid circular references
  const modifiedObj = JSON.parse(JSON.stringify(srcObj));

  // define variable to hold the parsed JSON
  let srcObjParsed;

  // extract the nested key if exists
  if (typeof sourceNested === 'string' && sourceNested !== '') {
    const subEntry = __getValueFromPath(srcObj, sourceNested);
    if (!subEntry)
      throw new Error(`The nested key "${sourceNested}" does not exist in JSON file "${JsonSrc}"`);
    srcObjParsed = subEntry;
  }
  // if not, the source object is the parsed object
  else
    srcObjParsed = srcObj;

  // in key destination access the child key with the source language code,
  // otherwise assume we are already in the key with the source lang code
  const srcObjPart = (srcObjParsed[sourceLangCode])
    ? srcObjParsed[sourceLangCode]
    : srcObjParsed;

  // flatten the resulting object to an array
  const translValues = __flattenObj(srcObjPart);

  // run translation array against DeepL API
  const translRes = await translateTexts(authKey, translValues, sourceLangCode, targetLangCode, deeplOpts);

  // re-build object structure from array
  const translObj = __mapArrayToObj(srcObjPart, translRes, 'text');

  // declare the object we are going to write out, holding the result
  let resultObj;

  // check if source and target are identical either as string, or resolve in the same file
  if (JsonSrc === JsonTarget
    || (await fst.exists(JsonTarget) &&
      fst.realpath(path.resolve(JsonSrc)) === fst.realpath(path.resolve(JsonTarget)))) {

    // if the content comes from a nested source
    if (typeof sourceNested === 'string' && sourceNested !== '') {
      // ... traverse in the object and insert or merge the translation
      __setNestedValue(modifiedObj, sourceNested, translObj, targetLangCode);
    } else {
      // ... if not, see if the target node exists
      (modifiedObj[targetLangCode])
        ? Object.assign(modifiedObj[targetLangCode], translObj) // ... and merge data with existing prop
        : modifiedObj[targetLangCode] = translObj; // ... else set a new prop
    }
    resultObj = modifiedObj;
  } else {
    // error if the target file name exists
    if (await fst.exists(JsonTarget))
      throw new Error(`The target file "${JsonTarget}" already exists. 
      Please prompt a different file name or remove the existing file.`);
    // ... if ok, set the resulting object
    resultObj = translObj;
  }

  // log if requested
  if (log || dryRun)
    console.log(resultObj);

  // write out result if it is not a dry run
  if (!dryRun) {
    const [res, err] = await fst.writeJson(JsonTarget, resultObj);
    if (err) {
      console.error(`Unable to write file: ${JsonTarget}`);
      throw err;
    }
  }

  return true
}

// Export the functions
export {
  setAuthKey,
  getSupportedLanguages,
  translateTexts,
  translateToJSON
};
