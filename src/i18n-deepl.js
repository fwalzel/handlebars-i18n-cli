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
import fs from 'async-file-tried';

/**
 * Write th DeepL auth key to .env file
 *
 * @param key
 * @returns {Promise<boolean>}
 */
async function setAuthKey(key) {
  if (typeof key !== 'string' || key === '') {
    throw new Error('Provided argument is not a valid deepl auth key.')
  }
  const file = 'deepl-auth.env';
  let [res, err] = await fs.writeFile(file, `export DEEPL_AUTH_KEY='${key}'`, 'utf8');
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
  try {
    const response = await axios.get('https://api-free.deepl.com/v2/languages', {
      params: {
        auth_key: authKey || process.env.DEEPL_AUTH_KEY,
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
 * Function to translate a string or an array of strings using the DeepL API
 *
 * @param authKey
 * @param texts
 * @param sourceLang
 * @param targetLang
 * @param options
 * @returns {Promise<TextResult|TextResult[]>}
 */
async function translateTexts(authKey, texts, sourceLang, targetLang, options) {
  console.log(`auth-key: ${authKey}`);
  console.log(`texte: ${texts}`);
  console.log(`sourceLang: ${sourceLang}`);
  const translator = new deepl.Translator(authKey);
  const res = await translator.translateText(texts, sourceLang, targetLang, options);
  //console.log(res);
  return res;
}

/**
 * Flatten an object by recursively writing the values to an array
 *
 * @param obj
 * @returns {*[]}
 */
function flattenObject(obj) {
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
 * The inverse operation of flattenObject(): maps the values of a flat array back to a given object
 *
 * @param obj
 * @param values
 * @returns {*}
 */
function mapArrayToObject(obj, values, childParam) {
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

/**
 *
 * @param obj
 * @param path
 * @returns {*}
 */
function getValueFromPath(obj, path) {
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
  //console.log(`result reading JSON:`);
  //console.log(res);
  if (typeof subNode === 'string') {
    const subEntry = getValueFromPath(res, subNode);
    if (subEntry)
      return subEntry;
    else
      throw new Error()
  }
  else return res;
}

/**
 *
 * @param authKey
 * @param JsonSrc
 * @param JsonTarget
 * @param sourceLang
 * @param targetLang
 * @param options
 * @returns {Promise<boolean>}
 */
async function translateJSON(authKey, JsonSrc, JsonTarget, targetLang, sourceLang, options) {
  console.log(`-- translateJSON --`);
  console.log(`authKey: ${authKey}`);
  console.log(`JsonSrc: ${JsonSrc}`);
  console.log(`JsonTarget: ${JsonTarget}`);
  console.log(`sourceLang: ${sourceLang}`);
  console.log(`targetLang: ${targetLang}`);

  const srcObj = await readI18nJson(JsonSrc, sourceLang);
  const translValues = flattenObject(srcObj);
  const translRes = await translateTexts(authKey, translValues, sourceLang, targetLang, options);
  const translObj = mapArrayToObject(srcObj, translRes, 'text');
  //todo: if JSON target = null append to existing
  const [res, err] = await fs.writeJson(JsonTarget, translObj);
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