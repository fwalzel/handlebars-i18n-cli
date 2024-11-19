/****************************************
 * i18n-collect.js
 * @author: Florian Walzel
 *
 ****************************************/


/****************************************
 * IMPORT
 ****************************************/

import fst from 'async-file-tried';
import {glob} from 'glob';

/****************************************
 * PRIVATE FUNCTIONS
 ****************************************/

/**
 * Simple object check
 *
 * @param item
 * @returns {boolean}
 */
function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item))
}

/**
 * Conditionally removes a substring (file extension)
 * from end of given string
 *
 * @param str
 * @param ending
 * @returns {*|string[]}
 */
function sanitizeFileExt(str, ending = '.json') {
  return str.toLowerCase().endsWith(ending) ? str.slice(0, ending.length * (-1)) : str
}

/**
 * A collection of functions to extract and handle the
 * strings between mustaches {{ ... }}
 *
 * @type {{str: string,
 * removeFromBetween: ((function(*, *): boolean)|*),
 * getSorted: (function(*, *, *=, *=): []),
 * results: *[], getFromBetween: ((function(*, *): (string|boolean))|*),
 * getAllResults: mustacheBetweens.getAllResults}}
 */
const mustacheBetweens = {
  results: [],
  str: '',
  /**
   * Returns a substring between an opening and
   * a closing string sequence in a given string
   *
   * @param sub1
   * @param sub2
   * @returns {string|boolean}
   */
  getFromBetween: function (sub1, sub2) {
    let SP = this.str.indexOf(sub1) + sub1.length,
      string1 = this.str.slice(0, SP),
      string2 = this.str.slice(SP),
      TP = string1.length + string2.indexOf(sub2);

    return this.str.substring(SP, TP)
  },

  /**
   * Removes a found sequence between an opening and
   * a closing string from a given string
   *
   * @param sub1
   * @param sub2
   * @returns {boolean}
   */
  removeFromBetween: function (sub1, sub2) {
    let removal = sub1 + this.getFromBetween(sub1, sub2) + sub2;
    this.str = this.str.replace(removal, '');
    return true
  },

  /**
   * gets all substrings of a string that are between an opening character sequence (sub1)
   * and a closing sequence (sub2). The Result is stored in parent results array
   *
   * @param sub1
   * @param sub2
   */
  getAllResults: function (sub1, sub2) {
    //  first check to see if we do have both substrings
    if (this.str.indexOf(sub1) < 0 || this.str.indexOf(sub2) < 0)
      return false;
    //  find first result
    let result = this.getFromBetween(sub1, sub2);
    //  replace multiple spaces by a single one, then trim and push it to the results array
    this.results.push(result.replace(/ +(?= )/g, '').trim());
    //  remove the most recently found one from the string
    this.removeFromBetween(sub1, sub2);
    //  recursion in case there are more substrings
    if (this.str.indexOf(sub1) > -1 && this.str.indexOf(sub2) > -1)
      this.getAllResults(sub1, sub2);
  },

  /**
   *
   * @param string
   * @param sub1
   * @param sub2
   * @returns {*}
   */
  getSorted: function (string, translFuncName, sub1 = '{{', sub2 = '}}') {
    this.str = string;
    this.getAllResults(sub1, sub2);
    this.results =
      this.results.filter(
        (el) => {
          return typeof el === 'string' && el.startsWith(`${translFuncName} `)
        })
        .map(
          (el) => {
            //  remove leading translation function and explode string by space
            let splited = el.replace(`${translFuncName} `, '').split(' ');
            //  remove quotation marks around key name in element 0 of array
            splited[0] = splited[0]
              .replace(/"/g, '')
              .replace(/'/g, '');
            //  split remaining string in first element of array by dot (.) to get separate keys of a dot-notated object
            let keys = splited[0].split('.');
            //  transformed is a container object for key
            let transformed = {};
            transformed.keys = keys;
            transformed.replacementVars = [];
            //  split following elements by '=' and preserve first element of split
            for (let i = 1; i < splited.length; i++)
              transformed.replacementVars[i - 1] = splited[i].split('=')[0];

            return transformed
          });
    return this.results
  }
};

/**
 * Filter specific array so that all elements with redundant
 * values keys are removed. Array looks like:
 * [
 *   { keys: [ 'b' ], replacementVars: [] },
 *   { keys: [ 'c' ], replacementVars: [] },
 *   …
 *  ]
 *
 * @param arr
 * @returns {*}
 */
const arrRmvDuplicateValues = (arr) => {
  let seen = {};
  return arr.filter((item) => {
    return seen.hasOwnProperty(item.keys) ? false : seen[item.keys] = true
  })
};


/**
 * Builds a nested object with key-value-pairs from a three-dimensional array
 *
 * @param arr
 * @param lang
 * @param empty
 * @returns {{}}
 */
function objectify(arr, lang = 'en', empty = false) {

  /**
   *
   * @param obj
   * @param val
   * @param arr
   * @param pos
   */
  function __iterateArr(obj, val, arr, pos) {
    if (!obj.hasOwnProperty(arr[pos])) {
      if (pos + 1 < arr.length) {
        obj[arr[pos]] = {};
        __iterateArr(obj[arr[pos]], val, arr, pos + 1);
      } else
        obj[arr[pos]] = val;
    } else if (pos + 1 < arr.length)
      __iterateArr(obj[arr[pos]], val, arr, pos + 1);
  }

  /**
   * Return a joined string form an array, where each element is
   * wrapped in Mustaches {{ }}. ["a", "b", "c"] becomes "{{a}} {{b}} {{c}}"
   *
   * @param arr
   * @param textBefore
   * @returns {string}
   */
  function __listTranslVariables(arr, textBefore = '') {
    let str = '';
    if (arr.length === 0)
      return str;
    for (let elem of arr)
      str += `{{${elem}}} `;
    return textBefore + str.slice(0, -1)
  }

  let obj = {}
  arr.forEach((el) => {
    let prop;
    if (empty)
      prop = __listTranslVariables(el.replacementVars);
    else
      prop = `${lang} of ${el.keys.join('.') + __listTranslVariables(el.replacementVars, ' with variables ')}`;
    __iterateArr(obj, prop, el.keys, 0)
  })

  return obj
}

/**
 * Deep merge two objects whereby all properties of
 * sources are kept and the target properties are added
 *
 * @param target
 * @param ...sources
 */
function mergeDeep(target, ...sources) {
  if (!sources.length)
    return target;

  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key])
          Object.assign(target, {[key]: {}});
        mergeDeep(target[key], source[key]);
      } else
        Object.assign(target, {[key]: source[key]});
    }
  }

  return mergeDeep(target, ...sources)
}

/**
 * deep sort an array by the values stored
 * in the "keys" property. Incoming array looks like this:
 *   [
 *    { keys: [ 'a' ], replacementVars: [] },
 *    { keys: [ 'b', 'a' ], replacementVars: [] },
 *    …
 *   ]
 * @param arr
 * @returns arr
 */
function deepSort(arr) {
  let depth = 0;
  //  determine the longest array in keys properties
  for (let inst of arr)
    if (inst.keys.length > depth)
      depth = inst.keys.length;

  //  iterate from longest to shortest and sort
  for (let i = depth - 1; i >= 0; i--) {
    arr = arr.sort((a, b) => {
      if (a.keys[i] !== undefined && b.keys[i] !== undefined)
        return a.keys[i] > b.keys[i] ? -1 : 1;
      else
        return a.keys[i] !== undefined ? -1 : 1;
    });
  }
  //  we get a descending array, so we invert it
  return arr.reverse()
}


/****************************************
 * EXPORT PUBLIC INTERFACE
 ****************************************/

async function i18nCollect(source, target, options) {

  if (typeof source !== 'string')
    throw new Error(`First argument SOURCE must be of type string. Please specify a valid SOURCE.`);

  if (typeof target !== 'string')
    throw new Error(`Second argument TARGET must be of type string. Please specify a valid TARGET.`);

  options = options || {};

  if (typeof options !== 'object' && !Array.isArray(options) && Object.prototype.toString.call(options))
    throw new Error(`Third argument OPTIONS must be of type object. Please specify a valid OPTION.`);

  //  register vars
  let hndlbrKeys = [],
    translObj,
    outputObj;

  // get glob from source
  const templateFiles = await glob(source, {ignore: 'node_modules/**'})

  // extract translations keys from file(s) in array hndlbrKeys
  for (let file of templateFiles) {
    console.log(`Now processing ${file}`);
    let [content, err] = await fst.readFile(file, 'utf8');
    if (err)
      throw (err);
    //console.log(content)
    hndlbrKeys = hndlbrKeys.concat(
      mustacheBetweens.getSorted(content, options.translFunc || '__')
    );
  }

  //  break if no strings for translation where found
  if (hndlbrKeys.length === 0)
    return console.log('No strings for translation found, no files written.');

  //  remove all duplicate value entries in position 'keys' of array hndlbrKeys
  hndlbrKeys = arrRmvDuplicateValues(hndlbrKeys);

  //  evaluate argument '--alphabetical' for sorting
  if (options.alphabetical)
    hndlbrKeys = deepSort(hndlbrKeys)

  //  form an array of languages from argument '--lng
  const languages = (Array.isArray(options.lng) && options.lng.length > 0)
    ? options.lng
    : ['en'];


  //  WRITE TO ONE FILE PER LANGUAGE
  //  ------------------------------------------------

  //  evaluate argument '--separateLngFiles' to output each language in a separate file
  if (options.separateLngFiles) {

    //  if user entered argument for target ending with .json, remove it
    let targetFileName = sanitizeFileExt(target)

    for (let lng of languages) {

      //  join file name per language such as myfile.de.json, myfile.en.json, ...
      let targetFileNameSeparated = (targetFileName.startsWith('/')
          ? targetFileName.substring(1)
          : targetFileName)
        + '.' + lng + '.json';

      //  create output object per language and add keys in nested object form
      outputObj = {}
      outputObj[lng] = objectify(hndlbrKeys, lng, options.empty)

      //  if option 'update' was given, existing files per language are read in, parsed,
      //  and the new translation Object is merged onto the existing translation
      if (options.update) {
        let [res, err] = await fst.readJson(targetFileNameSeparated);
        if (err)
          throw (err);
        outputObj = mergeDeep(outputObj[lng], res)
      }

      //  convert output object to json with linebreaks and indenting of 2 spaces
      const fileOutputJson = JSON.stringify(outputObj, null, 2)

      //  log output per language
      if (options.log || options.dryRun)
        console.log(fileOutputJson)

      let [write, e] = [undefined, undefined];

      //  write files only if no --dryRun option was set
      if (!options.dryRun)
        //  write out the json to target file per language
        [write, e] = await fst.writeFile(targetFileNameSeparated, fileOutputJson);
      if (e)
        throw (e);
      console.log('\x1b[34m%s\x1b[0m', `Wrote language keys for '${lng}' to ${targetFileNameSeparated}`)
    }

    if (options.dryRun)
      console.log('\x1b[36m%s\x1b[0m', 'This was a dry run. No files witten.');
  }

    //  WRITE SINGLE FILE CONTAINING ALL LANGUAGES
  //  ------------------------------------------------
  else {
    //  create object to hold the translations and create a key for every language
    //  add all handlebars translation keys to each language key as nested objects
    translObj = {translations: {}}
    languages.forEach((lng) => {
      translObj.translations[lng] = objectify(hndlbrKeys, lng, options.empty)
    })

    //  if argument '--update' was given, an existing file is read in, parsed,
    //  and the new translation Object is merged onto the existing translations
    if (options.update) { //todo: update needs fix
      let [res, err] = await fst.readJson(target);
      if (err)
        throw (err);
      outputObj = mergeDeep(translObj.translations, res)
    } else
      outputObj = translObj

    //  convert output object to json with linebreaks and indenting of 2 spaces
    const fileOutputJson = JSON.stringify(outputObj, null, 2)

    //  log the final object to console if option '--log' or '--dryRun' was set
    if (options.log || options.dryRun)
      console.log(fileOutputJson)

    //  exit if option '--dryRun' was set
    if (options.dryRun) {
      console.log('\x1b[36m%s\x1b[0m', 'This was a dry run. No file witten.')
      process.exit(0)
    }

    //  write out the json to target file
    let [res, err] = await fst.writeFile(target, fileOutputJson);
    if (err)
      throw (err);
  }
  return true;
}

// Export the function
export {
  i18nCollect
}
