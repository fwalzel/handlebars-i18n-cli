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
  //console.log(`auth-key: ${authKey}`);
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
function mapArrayToObject(obj, values) {
  let index = 0;

  function recurse(curr) {
    for (let key in curr) {
      if (typeof curr[key] === 'object' && curr[key] !== null) {
        recurse(curr[key]);
      } else {
        curr[key] = values[index++];
      }
    }
  }

  recurse(obj);
  return obj;
}

/**
 *
 * @param file
 * @param sourceLang
 * @returns {Promise<*>}
 */
async function readI18nJson(file, sourceLang) {
  let [res, err] = await fs.readJson(file, 'utf8');
  if (err) {
    console.error(`Unable to read file ${file}`);
    throw err;
  }
  return (sourceLang && res[sourceLang])
    ? res[sourceLang]
    : res;
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
async function translateJSON(authKey, JsonSrc, JsonTarget, sourceLang, targetLang, options) {
  const srcObj = readI18nJson(JsonSrc, sourceLang);
  const translValues = flattenObject(srcObj);
  const translRes = translateTexts(authKey, translValues, sourceLang, targetLang, options);
  const translObj = mapArrayToObject(srcObj, translRes);
  //todo: if JSON target = null append to existing
  const [res, err] = await fs.writeJson(JsonTarget, translObj, 'utf8');
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


/*
const { exec } = require('child_process')
const path = require('path')
const {
  writeJSON,
  readFile,
  fileExists,
  iterateObj,
  execPromised,
} = require('./lib/includes.js')


const DEEPL_FREE_URL = 'https://api-free.deepl.com/v2/translate'
const DEEPL_PRO_URL = 'https://api.deepl.com/v2/translate'
const DEEPL_AUTH_KEY = '0d520e59-eea9-24e7-908f-b2184b3039bb:fx'
const VALID_LANGS = ['BG', 'CS', 'DA', 'DE', 'EL', 'EN', 'EN-GB', 'EN-US', 'ES', 'ET', 'FI', 'FR', 'HU',
  'ID', 'IT', 'JA', 'KO', 'LT', 'LV', 'NB', 'NL', 'PL', 'PT', 'PT-BR', 'PT-PT', 'RO', 'RU', 'SK', 'SL',
  'SV', 'TR', 'UK', 'ZH']
const VALID_LANGS_REDUCED = VALID_LANGS.reduce((m, i) => { return m + ', ' + i })


const str = 'Hello%2C%20world!'
const targetLang = 'DE'

//const apiCall = `curl -X POST '${DEEPL_URL}' -H 'Authorization: DeepL-Auth-Key ${DEEPL_AUTH_KEY}' -d 'text=${str}' -d 'target_lang=${targetLang}'`;

//console.log(apiCall);

/!*exec(apiCall, (error, stdout, stderr) => {
  if (error) {
    console.log(`error: ${error.message}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
});*!/

/!****************************************
 * EXPORT PUBLIC INTERFACE
 ****************************************!/

exports.cli = async (argv) => {

  //  take in cli arguments from process argv
  let args = [ ]
  for (let i = 2; i < argv.length; i++)
    args.push(argv[i])

  //  validation: error when no argument was given
  if (args.length === 0)
    throw new Error(`No arguments given. Please specify SOURCE and TARGET or use option --configure. 
      Call argument --help for further Information.`)

  //  answer to argument 'help'
  if (args.length === 1 && ['help', '--help', '-h'].includes(args[0]))
    return console.log('help!')

  //  answer to argument '--configure'
  if (args[0].startsWith('--configure=')) {
    const deeplauthKey = args[0].split('=')[1]
    const jsonFileName = (args[1] === '--pro-api') ?
      'deepl-pro-api-key' : 'deepl-free-api-key'
    if (await writeJSON(`${jsonFileName}.json`, { authKey : deeplauthKey }))
      console.log('\x1b[32m%s\x1b[0m', `Saved Deepl API key in ${path.resolve(jsonFileName)}.json`)
    process.exit(0)
  }

  //  prepare translation request
  //  --------------------------------

  //  validation: error when no second argument TARGET was given
  if (args.length === 1)
    throw new Error(`Missing second argument for TARGET. 
      Call argument --help for further Information.`)

  //  validation: error when no target language was defined
  const targetLangArg = args.filter((el) => el.startsWith('--target-lang='))
  if (targetLangArg.length === 0)
    throw new Error(`Missing argument --target-lang. Please specify the language you want the
      translation made to. Call argument --help for further Information.`)

  //  validation: check if target language short code is supported
  const targetLang = targetLangArg[0].split('=')[1].toUpperCase()
  if (! VALID_LANGS.includes(targetLang))
    throw new Error(`Invalid Parameter for --target-lang. "${targetLang}" can not be accepted as language shortcode.
      Valid target language parameters are: ${ VALID_LANGS_REDUCED }.`)

  //  form target_lang parameter
  const apiParamTargetLang = ` -d 'target_lang=${targetLang}'`

  //  form source_lang parameter
  let apiParamSourceLang = ''
  const sourceLangArg = args.filter((el) => el.startsWith('--source-lang='))
  if (sourceLangArg.length !== 0) {
    const sourceLang = sourceLangArg[0].split('=')[1].toUpperCase()
    //  validation: check if source language short code is supported, warn if not
    if (! VALID_LANGS.includes(sourceLang))
      console.log('Falling back to auto detection.')
    else
      apiParamSourceLang =` -d 'source_lang=${targetLang}'`
  }

  //  check if pro API shall be called
  let deeplAuthKey
  let apiParamUrl

  const deeplAuthKeyArg = args.filter((el) => el.startsWith('--auth-key='))
  if (deeplAuthKeyArg.length === 1) {
    console.log(deeplAuthKeyArg)
    deeplAuthKey = deeplAuthKeyArg[0].split('=')[1]
    apiParamUrl = (args.includes('--pro-api')) ?
      DEEPL_PRO_URL : DEEPL_FREE_URL
  }
  else {
    if (await fileExists('deepl-pro-api-key.json')) {
      deeplAuthKey = JSON.parse(await readFile('deepl-pro-api-key.json'))
      apiParamUrl = DEEPL_PRO_URL
    }
    if (await fileExists('deepl-free-api-key.json')) {
      deeplAuthKey = JSON.parse(await readFile('deepl-free-api-key.json'))
      apiParamUrl = DEEPL_FREE_URL
    }
  }

  //  error when no auth key available
  if (typeof deeplAuthKey === 'undefined')
    throw new Error(`No deepL api key given. Plese use option --auth-key or --configure (for permanent storage of auth key).
      Call argument --help for further Information.`)

  //  form authorization parameter
  const apiParamAuth = ` -H 'Authorization: DeepL-Auth-Key ${deeplAuthKey}'`

  //  create an array "sources" by filtering out all options from the args
  let sources = args.filter(
    (el) => ! (el === 'help' || el.startsWith('--') || el.startsWith('-'))
  )

  //  ... then removing last element as being the <target>
  const source = sources[0]
  const target = sources.pop()

  //  read in and parse source file
  const jsonFile = await readFile(source)
  const translationBase = JSON.parse(jsonFile)

  //  flatten the object to an array
  let translArray = [];
  iterateObj(translationBase, function(val) { translArray.push(val.replaceAll(' ', '%20'))})

  // define the text argument for api call
  const apiParamText = ` -d 'text=${JSON.stringify(translArray)}'`

  // form string for api call
  const apiCall = 'curl -X POST '
    + apiParamUrl
    + apiParamAuth
    + apiParamTargetLang
    + apiParamSourceLang
    + apiParamText

  //console.log(apiCall)

  //const apiResult = await execPromised(apiCall)

  /!*const apiResult = exec(apiCall, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`)
      return;
    }
    console.log(`stdout: ${stdout}`)
    return stdout
  })

  console.log(apiResult)

  // make copy of original object
  const tranlatedObj = JSON.parse(JSON.stringify(translationBase));

  const Result = JSON.parse(apiResult)
  console.log(Result)

  iterateObj(tranlatedObj, (el, i, absIt) => {
    tranlatedObj[i] = Result.translations[0].text[absIt].replaceAll('%20', ' ');
    /!*console.log(el);
    console.log(i);
    console.log(absIt);*!/
  })

  console.log(tranlatedObj)

  await writeJSON(`translationsByDeepl-${targetLang}.json`, tranlatedObj)

  console.log('good');*!/


  // running the query against API
  exec(apiCall, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`)
      return;
    }
    console.log(`stdout: ${stdout}`)
    return stdout
  })




}*/
