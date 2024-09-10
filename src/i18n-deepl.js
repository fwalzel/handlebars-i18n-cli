/*********************************************************************
 * i18n-deepl.js
 *
 * @author: Florian Walzel
 * @date: 2022-10
 *
 * Usage:
 * $ i18n-collect <source> <target> <options...>
 *
 * valid options:
 * --auth-key=Your-DeepL-Auth-Key
 * --pro-api
 * --dryRun || -dr
 * --source-lang=de
 * --target-lang=en
 * --log || -l
 * --configure="free-api|pro-api:Your-DeepL-Auth-Key"



 /**
 *  Get an API Key:
 *  @link https://www.deepl.com/de/pro-checkout/account?productId=1200&yearly=false&trial=false
 *
 *  The API
 *  @link https://www.deepl.com/docs-api/translate-text/multiple-sentences/
 */


import deepl from 'deepl-node';
import axios from 'axios';
import fs from 'async-file-tried';
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
  let [res, err] = await fs.writeFile(file, `export DEEPL_AUTH=${key}`);
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

/**
 *
 * @param file
 * @param subNode
 * @returns {Promise<*>}
 */
async function readI18nJson(file, subNode) {
  let [res, err] = await fs.readJson(file);
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
async function translateJSON(authKey, JsonSrc, JsonTarget, targetLang, sourceLang, sourceSub, options) {
  console.log(`-- translateJSON --`);
  console.log(`authKey: ${authKey}`);
  console.log(`JsonSrc: ${JsonSrc}`);
  console.log(`JsonTarget: ${JsonTarget}`);
  console.log(`sourceLang: ${sourceLang}`);
  console.log(`targetLang: ${targetLang}`);

  const srcObj = await readI18nJson(JsonSrc, sourceLang);
  const translValues = __flattenObj(srcObj);
  const translRes = await translateTexts(authKey, translValues, sourceLang, targetLang, options);
  const translObj = __mapArrayToObj(srcObj, translRes, 'text');
  let resultObj;
  // check if source and target are identical
  if (fs.realpathSync(path.resolve(JsonSrc)) === fs.realpathSync(path.resolve(JsonTarget))) {
    if (!sourceSub) {
      if (srcObj[targetLang])
        Object.assign(srcObj[targetLang], translObj);
      else
        srcObj[targetLang] = translObj;
        resultObj = srcObj;
    } else {

    }
  }
  else {
    resultObj = translObj;
  }
  // write out result
  const [res, err] = await fs.writeJson(JsonTarget, resultObj);
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
  translateJSON
};