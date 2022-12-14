/*********************************************************************
 * i18n-collect.js
 *
 * @author: Florian Walzel
 * @date: 2022-10
 *
 * Usage:
 * $ i18n-collect <source> <target> <options...>
 *
 * valid options:
 * --alphabetical || -a
 * --dryRun || -dr
 * --empty || -e
 * --lng=de,fr,es,etc…
 * --log || -l
 * --separateLngFiles || -sf
 * --translFunc=yourCustomFunctionName
 * --update || -u*
 *
 * Copyright (c) 2020 Florian Walzel, MIT LICENSE
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaininga copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 *********************************************************************/


'use strict';

/****************************************
 * REQUIRE & DEFINE
 ****************************************/

const fs = require('fs')
const { promisify } = require('util')
const readFileAsync = promisify(fs.readFile)
const writeFileAsync = promisify(fs.writeFile)


/****************************************
 * FUNCTIONS
 ****************************************/

/**
 * Asynchronously read file
 *
 * @param file
 * @returns {Promise<*>}
 */
async function readFile (file) {
  try {
    const data = await readFileAsync(file, 'utf8')
    return data
  }
  catch (e) {
    console.log('\x1b[31m%s\x1b[0m', `Error. Could not read ${file}`)
    console.error(e)
    return false
  }
}

/**
 * Asynchronously write file in utf8 encoding
 *
 * @param file
 * @param data
 * @returns {Promise<boolean>}
 */
async function writeFile(file, data) {
  try {
    await writeFileAsync(file, data, 'utf8')
    return true
  }
  catch (e) {
    console.log('\x1b[31m%s\x1b[0m', `Error. Could not write ${file}`)
    console.error(e)
    return false
  }
}

/**
 * Simple object check.
 *
 * @param item
 * @returns {boolean}
 */
function isObject(item) {
  return (item && typeof item === 'object' && ! Array.isArray(item))
}

/**
 * Conditionally removes a substring (file extension)
 * from end of given string.
 *
 * @param str
 * @param ending
 * @returns {*|string[]}
 */
function sanitizeFileExt(str, ending='.json') {
  return str.toLowerCase().endsWith(ending) ? str.slice(0, ending.length * (-1)) : str
}

/**
 * Log the help information to console
 * @returns {boolean}
 */
function logHelp() {
  console.log('\x1b[2m%s', 'Usage:')
  console.log('i18n-collect <source> <target> <options...>')
  console.log('')
  console.log('<source>                 path to handlebars.js template file(s), glob pattern allowed')
  console.log('<target>                 json file(s) to write result to')
  console.log('')
  console.log('<options>')
  console.log('--alphabetical or -a     will order the keys to the translation strings alphabetically in the json')
  console.log('                         default: keys in order of appearance as within the template(s)')
  console.log('--dryRun or -dr          will log the result(s) but not write out json file(s)')
  console.log('--empty or -e            will create empty value strings for the translations in the json')
  console.log('                         default: value strings contain current language and key name')
  console.log('--lng=en,fr,es,…         the languages you want to be generated')
  console.log('                         default: en')
  console.log('--log or -l              log final results to console')
  console.log('--separateLngFiles       write each language in a separate json file')
  console.log('  or -sf                 default: all languages are written as arrays in one json file')
  console.log('--translFunc=customName  a custom name of the translation function used in the templates')
  console.log('                         default: __ like handlebars-i18n notation: {{__ keyToTranslate}}')
  console.log('--update or -u           updates existing json files(s) after changes made in template file(s)')
  console.log('\x1b[0m')
  return true
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
  results : [ ],
  str : '',
  /**
   * Returns a substring between an opening and
   * a closing string sequence in a given string
   *
   * @param sub1
   * @param sub2
   * @returns {string|boolean}
   */
  getFromBetween : function(sub1, sub2) {
    if (this.str.indexOf(sub1) < 0 || this.str.indexOf(sub2) < 0)
      return false
    let SP = this.str.indexOf(sub1) + sub1.length,
        string1 = this.str.substr(0, SP),
        string2 = this.str.substr(SP),
        TP = string1.length + string2.indexOf(sub2)
    return this.str.substring(SP, TP)
  },

  /**
   * Removes a found sequence between an opening and
   * a closing string from a a given string
   *
   * @param sub1
   * @param sub2
   * @returns {boolean}
   */
  removeFromBetween : function(sub1, sub2) {
    if (this.str.indexOf(sub1) < 0 || this.str.indexOf(sub2) < 0)
      return false
    let removal = sub1 + this.getFromBetween(sub1, sub2) + sub2
    this.str = this.str.replace(removal,'')
  },

  /**
   * gets all substrings of a string that are between an opening character sequence (sub1)
   * and a closing sequence (sub2). The Result is stored in parent results array.
   *
   * @param sub1
   * @param sub2
   */
  getAllResults : function(sub1, sub2) {
    //  first check to see if we do have both substrings
    if (this.str.indexOf(sub1) < 0 || this.str.indexOf(sub2) < 0)
      return false
    //  find first result
    let result = this.getFromBetween(sub1, sub2)
    //  replace multiple spaces by a single one, then trim and push it to the results array
    this.results.push(result.replace(/ +(?= )/g,'').trim())
    //  remove the most recently found one from the string
    this.removeFromBetween(sub1, sub2)
    //  recursion in case there are more substrings
    if (this.str.indexOf(sub1) > -1 && this.str.indexOf(sub2) > -1)
      this.getAllResults(sub1, sub2)
  },

  /**
   *
   * @param string
   * @param sub1
   * @param sub2
   * @returns {*}
   */
  getSorted : function(string, translFuncName, sub1='{{', sub2='}}') {
    this.str = string
    this.getAllResults(sub1, sub2)
    this.results =
      this.results.filter(
      (el) => {
        return typeof el === 'string' && el.startsWith(`${translFuncName} `)
      })
      .map(
        (el) => {
          //  remove leading translation function and explode string by space
          let splited = el.replace(`${translFuncName} `, '').split(' ')
          //  remove quotation marks around key name in element 0 of array
          splited[0] = splited[0]
            .replace(/"/g, '')
            .replace(/'/g, '')
          //  split remaining string in first element of array by dot (.) to get separate keys of a dot-notated object
          let keys = splited[0].split('.')
          //  transformed is a container object for key
          let transformed = { }
          transformed.keys = keys
          transformed.replacementVars = [ ]
          //  split following elements by '=' and preserve first element of split
          for (let i = 1; i < splited.length; i++)
            transformed.replacementVars[i-1] = splited[i].split('=')[0]

          return transformed
      })
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
  let seen = { }
  return arr.filter((item) => {
    return seen.hasOwnProperty(item.keys) ? false : seen[item.keys] = true
  })
}


/**
 * Builds a nested object with key-value-pairs from a three-dimensional array.
 *
 * @param arr
 * @param lang
 * @param empty
 * @returns {{}}
 */
function objectify (arr, lang='en', empty = false) {

  /**
   *
   * @param obj
   * @param val
   * @param arr
   * @param pos
   */
  function __iterateArr (obj, val, arr, pos) {
    if (! obj.hasOwnProperty(arr[pos])) {
      if (pos + 1 < arr.length) {
        obj[arr[pos]] = { }
        __iterateArr(obj[arr[pos]], val, arr, pos + 1)
      }
      else
        obj[arr[pos]] = val;
    }
    else if (pos+1 < arr.length)
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
  function __listTranslVariables(arr, textBefore= '')  {
    let str = '';
    if (arr.length === 0)
      return str;
    for (let elem of arr)
      str += `{{${elem}}} `;
    return textBefore + str.slice(0, -1);
  }

  let obj = { }
  arr.forEach((el) => {
    let prop;
    if (empty)
      prop = __listTranslVariables(el.replacementVars);
    else
      prop = `${lang} of ${el.keys.join('.') + __listTranslVariables(el.replacementVars, ' with variables ')}`
    __iterateArr(obj, prop, el.keys, 0)
  })

  return obj
}

/**
 * Deep merge two objects whereby all properties of
 * sources are kept and the target properties are added.
 *
 * @param target
 * @param ...sources
 */
function mergeDeep(target, ...sources) {
  if (! sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (! target[key])
          Object.assign(target, {[key]: { }});
        mergeDeep(target[key], source[key]);
      } else
        Object.assign(target, {[key]: source[key]});
    }
  }

  return mergeDeep(target, ...sources);
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
  //  determine the longest array in keys properties
  let depth = 0;
  for (let inst of arr)
    if (inst.keys.length > depth)
      depth = inst.keys.length;

  //  iterate from longest to shortest and sort
  for (let i = depth-1; i>=0; i--) {
    arr = arr.sort((a, b) => {
      if ( a.keys[i] !== undefined && b.keys[i] !== undefined )
        return a.keys[i] > b.keys[i] ? -1 : 1;
      else
        return a.keys[i] !== undefined ? -1 : 1
    });
  }
  //  we get a descending array, so we invert it
  return arr.reverse();
}


/****************************************
 * EXPORT PUBLIC INTERFACE
 ****************************************/

exports.cli = async (argv) => {

  //  take in cli arguments from process argv
  let args = [ ]
  for (let i = 2; i < argv.length; i++)
    args.push(argv[i])

  //  validation: error when no argument was given
  if (args.length === 0)
    throw new Error(`No arguments given. Please specify SOURCE and TARGET. 
      Call argument --help for further Information.`)

  //  only one argument was given
  if (args.length === 1) {
    //  answer to argument 'help'
    if (['help', '--help', '-h'].includes(args[0]))
      return logHelp()
    //  error the missing second argument
    else
      throw new Error(`Missing second argument for TARGET. 
        Call argument --help for further Information.`)
  }

  //  register vars
  let hndlbrKeys = [ ],
    sources,
    targetFileName,
    targetFileNameSeparated,
    translationFuncName,
    pos = -1,
    languages,
    translObj,
    outputObj;

  //  create an array "sources" by filtering out all options from args
  sources = args.filter(
    (el) => ! (el === 'help' || el.startsWith('--') || el.startsWith('-'))
  )

  //  then removing last element as being the <target>
  targetFileName = sources.pop()

  //  check for argument '--translFunc=someName' => a custom function name was given
  args.forEach((el, key) => {
    if (el.startsWith('--translFunc=')) return pos = key
  })
  translationFuncName = (pos >= 0) ? args[pos].split('=')[1] : '__'

  //  read in file(s) and join contents keeping only unique key names
  for (let file of sources) {
    console.log(`Now processing ${file}`)
    let content = await readFile(file)
    hndlbrKeys = hndlbrKeys.concat(
      mustacheBetweens.getSorted(content, translationFuncName)
    )
  }

  //  break if no strings for translation where found
  if (hndlbrKeys.length === 0)
    return console.log('No strings for translation found, no files written.')

  //  remove all duplicate value entries in position 'keys' of array hndlbrKeys
  hndlbrKeys = arrRmvDuplicateValues(hndlbrKeys)

  //  evaluate argument '--alphabetical' for sorting
  if (args.includes('--alphabetical') || args.includes('-a'))
    hndlbrKeys = deepSort(hndlbrKeys)

  //  form an array of languages from argument '--lng='
  languages = args.filter((el) => {
    return el.startsWith('--lng=')
  }).map((el) => {
    return el.split('=')[1].split(',')
  })[0]

  //  if no language parameter is passed set 'en' as default language
  if (typeof languages === 'undefined') languages = ['en']


  //  WRITE TO ONE FILE PER LANGUAGE
  //  ------------------------------------------------

  //  evaluate argument '--separateLngFiles' to output each language in a separate file
  if (args.includes('--separateLngFiles') || args.includes('-sf')) {

    //  if user entered argument for target ending with .json, remove it
    targetFileName = sanitizeFileExt(targetFileName)

    for (let lng of languages) {
      //  join file name per language such as myfile.de.json, myfile.en.json, ...
      targetFileNameSeparated =
        (targetFileName.startsWith('/') ? targetFileName.substring(1) : targetFileName) + '.' + lng + '.json'

      //  create output object per language and add keys in nested object form
      outputObj = { }
      outputObj[lng] = objectify(hndlbrKeys, lng, args.includes('--empty') || args.includes('-e'))

      //  if argument '--update' was given, existing files per language are read in, parsed,
      //  and the new translation Object is merged onto the existing translation
      if (args.includes('--update') || args.includes('-u')) {
        let existingTransl = await readFile(targetFileNameSeparated)
        existingTransl = JSON.parse(existingTransl)
        outputObj = mergeDeep(outputObj[lng], existingTransl)
      }

      //  convert output object to json with linebreaks and indenting of 2 spaces
      const fileOutputJson = JSON.stringify(outputObj, null, 2)

      //  log output per language
      if (args.includes('--log') || args.includes('-l')
        || args.includes('--dryRun') || args.includes('-dr'))
        console.log(fileOutputJson)

      //  write files only if no --dryRun option was set
      if (! args.includes('--dryRun') && ! args.includes('-dr'))
        //  write out the json to target file per language
        if (await writeFile(targetFileNameSeparated, fileOutputJson))
          console.log('\x1b[34m%s\x1b[0m', `Wrote language keys for '${lng}' to ${targetFileNameSeparated}`)
    }

    return (args.includes('--dryRun') || args.includes('-dr')) ?
      console.log('\x1b[36m%s\x1b[0m', 'This was a dry run. No files witten.')
      :
      console.log('\x1b[32m%s\x1b[0m', `You’re good. All Done.`)
  }

  //  WRITE SINGLE FILE CONTAINING ALL LANGUAGES
  //  ------------------------------------------------
  else {
    //  create object to hold the translations and create a key for every language
    //  add all handlebars translation keys to each language key as nested objects
    translObj = {translations: { }}
    languages.forEach((lng) => {
      translObj.translations[lng] = objectify(hndlbrKeys, lng, args.includes('--empty') || args.includes('-e'))
    })

    //  if argument '--update' was given, an existing file is read in, parsed,
    //  and the new translation Object is merged onto the existing translations
    if (args.includes('--update') || args.includes('-u')) {
      let existingTransl = await readFile(targetFileName)
      existingTransl = JSON.parse(existingTransl)
      outputObj = mergeDeep(translObj, existingTransl)
    }
    else
      outputObj = translObj

    //  convert output object to json with linebreaks and indenting of 2 spaces
    const fileOutputJson = JSON.stringify(outputObj,null, 2)

    //  log the final object to console if option '--log' or '--dryRun' was set
    if (args.includes('--log') || args.includes('-l')
      || args.includes('--dryRun') || args.includes('-dr'))
      console.log(fileOutputJson)

    //  exit if option '--dryRun' was set
    if (args.includes('--dryRun') || args.includes('-dr')) {
      console.log('\x1b[36m%s\x1b[0m', 'This was a dry run. No file witten.')
      process.exit(0)
    }

    //  write out the json to target file
    if (await writeFile(targetFileName, fileOutputJson))
      return console.log('\x1b[32m%s\x1b[0m', `Done and Ready! Your output was written to ${targetFileName}`)
  }
}