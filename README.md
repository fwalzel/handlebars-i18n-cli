# handlebars-i18n-cli

`handlebars-i18n-cli` is an additional command line interface
for [handlebars-i18n](https://github.com/fwalzel/handlebars-i18n.git) and other implementations of i18next in handlebars.

* programmatically extract/ update translation strings from handlebars templates and generate i18next conform
  JSON files from it
* automatic translation of i18next JSON via [DeepL's](https://www.deepl.com/en/pro-api/) free API

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![Node.js Version](https://img.shields.io/badge/Node.js-14.x-green)
[![Build](https://github.com/fwalzel/handlebars-i18n-cli/actions/workflows/node.js.yml/badge.svg)](https://github.com/fwalzel/handlebars-i18n-cli/actions/workflows/node.js.yml/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/fwalzel/handlebars-i18n-cli/badge.svg?branch=main)](https://coveralls.io/github/fwalzel/handlebars-i18n-cli?branch=main)
[![Known Vulnerabilities](https://snyk.io/test/github/fwalzel/handlebars-i18n-cli/badge.svg)](https://snyk.io/test/github/fwalzel/handlebars-i18n-cli/badge.svg)

## Install

```shell
npm i handlebars-i18n-cli --save-dev
npm link handlebars-i18n-cli
```

If you do not link the package, you may run into the error `bash: i18n-collect: command not found`.

<p>&nbsp;</p>

## General Use

### 1. Language Key Extraction 

Abstract syntax is:

```
i18n-collect <source> <target> <options...>
```

This will generate a file `translations.json` holding the translations for `de`, `fr`, and `en` by extracting all key
names intended for i18next translation from all html files in your project:

```shell
i18n-collect my-project/**/*.html my-project/translations.json --lng de,en,fr
```

From a very simple template like this …

```html
<!DOCTYPE html>
<html lang="{{_locale}}">
<head>
    <title>{{__ title}}</title>
</head>
<body>
{{__ body.greeting textvar1="hello" textvar2="world"}}
</body>
</html>
```

… the generated translations.json would be:

```json
{
  "translations": {
    "de": {
      "title": "de of title",
      "body": {
        "greeting": "de of body.greeting with variables {{textvar1}} {{textvar2}}"
      }
    },
    "en": {
      "title": "en of title",
      "body": {
        "greeting": "en of body.greeting with variables {{textvar1}} {{textvar2}}"
      }
    },
    "fr": {
      "title": "fr of title",
      "body": {
        "greeting": "fr of body.greeting with variables {{textvar1}} {{textvar2}}"
      }
    }
  }
}
```

### 2. Automatic Translation via DeepL API

Abstract syntax is:

```
i18n-deepl translate <source> <target> <targetLang> <options...>
```

``` shell
i18n-deepl translate en.json fi.json fi
```

Will run the file en.json against DeepL API. From this file

```
{
  "header": {
    "greet": "Hello World!"
  }
}
```

… will be generated the Finish translation fi.json:

```
{
  "header": {
    "greet": "Hei maailma!"
  }
}
```


## Motivation

Managing large volumes of translations can be a tedious and time-consuming task, for each change in the template needs
to be mapped to all languages. Usually this comes along with a lot of redundant typing or copy/paste action. Moreover
the chance of missing some translation strings increases with many translations in play.

`handlebars-i18n-cli` automates the task of extracting and updating key names indicating translation strings and
generating template JSON files from them. The key names for the translations need to specified only once in the
template, the carry to the according language JSON is done by the CLI. You then only have to fill in according translations.
In case a translation string expects variables for replacement, these variables will be added to your json template.

If you are not using [handlebars-i18n](https://github.com/fwalzel/handlebars-i18n.git) for translation but a custom
integration of i18next into handlebars.js, you might be able to appropriate this cli by using the option --translFunc (
see below).

## Example

Try the examples folder within this repo.

For generating a single JSON file:

```bash
$ i18n-collect examples/templates/*.html examples/generated/translations.json --lng de,fr,en 
```

For one JSON file per language:

```bash
$ i18n-collect examples/templates/*.html examples/generated/translations.json --separateLngFiles --lng de,fr,en 
```

## Source and Target

`<source>`

* The source files can be passed in as [glob](https://www.npmjs.com/package/glob) pattern.
* i18n-collect is agnostic against the data type of the template(s) you want to extract translations keys from. It works
  with `.html` as well as `.js` files.

`<target>`

* The output will always be in `.json` format. The file(s) can then be required for your i18next translation
  as [JSON v2](https://www.i18next.com/misc/json-format#i18next-json-v2)

```
i18next.init({
  compatibilityJSON: 'v2'
});
```

## Usage options

`--alphabetical` or `-a`

This will order the keys to the translation strings alphabetically in the generated json file(s). When the flag
--alphabetical is not set the keys appear in order as within the template(s).

---

`--dryRun` or `-dr`

For simulation: Logs the result to console, but does not write out the file(s) to disk.

---

`--empty` or `-e`

Create empty value strings for the translations in the json files(s). When the flag --empty is not set the
value strings contain current language and key name.

Example:

The template

```html
<h1>{{__ headline userName="Frank"}}</h1>
<p>{{__ paragraph}}</p>
```

would become

```json
{
  "translations": {
    "en": {
      "headline": "{{userName}}",
      "paragraph": ""
    }
  }
}
```

instead of

```json
{
  "translations": {
    "en": {
      "headline": "en of headline with variables {{userName}}",
      "paragraph": "en of paragraph"
    }
  }
}
```

---

`--lng language1,language2,...languageN`

The list of language shortcodes you want to be generated with an own set in the json. Arguments are comma separated (no
blank space between, no quotation marks around).
If no language is defined, "en" is the default.

---

`--log` or `-l`

Logs the final result that is written to the json files(s) into the console as well.

---

`--separateLngFiles` or `-sf`

Write each language in a separate json file instead of a single one.

```bash
$ i18n-collect my-project/template.html my-project/translation.json --lng de,en,fr --separateLngFiles
```

Will generate three json files: **translation.de.json**, **translation.en.json**, and **translation.fn.json** each
holding
only the translation for their respective language. By default all translations are written to a single json file.

---

`--translFunc=yourCustomFunctionName`

If you are not using handlebars-i18n for translations but a custom handlebars helper, you might be able to use
i18n-collect as well.Say your translation function has the name *t* instead of handlebars-i18n’s *__* (double
underscore)
and your template usage would look like

```html
{{t myKeyNameToTranslation}}
```

you can do

```bash
$ i18n-collect my-project/template.html my-project/translation.json --translFunc=t
```

--translFunc=t then substitutes the default *__* with a search for t.

---

`--update` or `-u`

Update an existing .json file with new translations. All keys in the existing .json are kept, new ones from the template
will be added.

Works also with the option --separateLngFiles:

```bash
$ i18n-collect my-project/**/*.html my-project/translation --update --lng de,en,fr --separateLngFiles
```

Leave out the language ending and json file extension and give only the base name for <target>. In this example case
handlebars-i18n-cli would look for *translation.de.json*, *translation.en.json*, and *translation.en.json* to update
them. A language file that does not exist yet will be generated.

<p>&nbsp;</p>

## Programmatical Use

You can use the functions of `handlebars-i18n-cli` in a programatical way too, and make them part of your continuous integration.

---

### Specification for `i18nCollect` Function

#### Function Signature

```typescript
export function i18nCollect(
  source: string, 
  target: string, 
  options?: opts
): Promise<true | void>;
```

#### Description

This function scans the source location for internationalization keys, processes them according to the provided options, 
and writes them to the specified target location. It supports features like sorting keys alphabetically, updating 
existing keys, and generating separate files for each language.

#### Parameters

**Positional Arguments**

| **Name**  | **Type**      | **Description**                         | **Example**               |
|-----------|---------------|-----------------------------------------|---------------------------|
| `source`  | `string`      | Path to the source files.               | `./src/template.html`     |
| `target`  | `string`      | Path to the target files or directory.  | `./src/translations.json` |

**Optional `options` Object Properties**

| **Name**          | **Type**        | **Description**                                                   | **Example**           |
|--------------------|-----------------|-------------------------------------------------------------------|-----------------------|
| `alphabetical`     | `boolean`      | If `true`, sorts keys alphabetically.                             | `true`               |
| `dryRun`           | `boolean`      | If `true`, performs a simulation without modifying files.         | `false`              |
| `lng`              | `Array<string>`| List of language codes to process.                                | `["en", "de", "fr"]` |
| `log`              | `boolean`      | If `true`, enables detailed logging to the console.               | `true`               |
| `separateLngFiles` | `boolean`      | If `true`, creates separate files for each language.              | `true`               |
| `translFunc`       | `string`       | Specifies a custom translation function name to look for in code. | `"t"`                |
| `update`           | `boolean`      | If `true`, updates existing translation keys in the target file.  | `true`               |

#### Returns

Returns a Promise that resolves to: `true`: Indicates successful completion of the operation.
`void`: Indicates the function performed no action.

**Basic Usage**

```javascript
import {i18nCollect} from 'handlebars-i18n-cli';
await i18nCollect('./src/template.html', './src/translations.json');
```

**With Parameters**

```javascript
await i18nCollect('./src/template.html', './src/translations.json', {
  alphabetical: true,
  dryRun: false,
  lng: ['en', 'de', 'fr'],
  log: true,
  separateLngFiles: true,
  translFunc: 't',
  update: true,
});
```
---

### Specification for DeepL Utility Functions

This module provides a set of functions to interact with the DeepL API for authentication, language retrieval, text translation, and JSON file translation.

### Function `setAuthKey`

Writes the DeepL authentication key to a .env file.

#### Function Signature

```typescript
export function setAuthKey(key: string): Promise<boolean>;
```

#### Parameters

| **Name** | **Type**  | **Description**                        | **Example**     |
|----------|-----------|----------------------------------------|-----------------|
| `key`    | `string`  | Your DeepL API authentication key.     | `"abcd1234xyz"` |

#### Returns

`Promise<boolean>`: Resolves to `true` if the key was successfully written; otherwise, `false`.

```javascript
import {setAuthKey} from 'handlebars-i18n-cli';
await setAuthKey('abcd1234xyz');
```

### Function `getSupportedLanguages`

Fetches the list of languages supported by the DeepL API.

#### Function Signature

```typescript
export function getSupportedLanguages(authKey: string): Promise<any>;
```

#### Parameters

| **Name**   | **Type**  | **Description**                                  | **Example**     |
|------------|-----------|--------------------------------------------------|-----------------|
| `authKey`  | `string`  | Your DeepL API authentication key.               | `"abcd1234xyz"` |

#### Returns

`Promise<any>`: Resolves with an object containing the supported languages.

#### Usage Example

```javascript
import {getSupportedLanguages} from 'handlebars-i18n-cli';
let languages = await getSupportedLanguages('abcd1234xyz');
```

### Function `translateToJSON`

Reads a JSON file, translates its content using the DeepL API, and writes the result as a JSON file.

#### Function Signature

```typescript
export function translateToJSON(
    authKey: string,
    JsonSrc: string,
    JsonTarget: string,
    sourceLang: string,
    targetLang: string,
    deeplOpts?: object,
    sourceNested?: string,
    log?: boolean,
    dryRun?: boolean
): Promise<boolean>;

```

#### Parameters

| **Name**        | **Type**         | **Description**                                                  | **Example**                  |
|-----------------|------------------|------------------------------------------------------------------|------------------------------|
| `authKey`       | `string`         | Your DeepL API authentication key.                               | `"abcd1234xyz"`             |
| `JsonSrc`       | `string`         | Path to the source JSON file.                                     | `"./source.json"`           |
| `JsonTarget`    | `string`         | Path to the target JSON file.                                     | `"./target.json"`           |
| `sourceLang`    | `string`         | The source language code. Use `""` for auto-detection.           | `"en"`                      |
| `targetLang`    | `string`         | The target language code.                                         | `"de"`                      |
| `deeplOpts`     | `object` (optional)| Additional DeepL API options (e.g., formality).                  | `{formality: "formal"}`     |
| `sourceNested`  | `string` (optional)| Nested object key to process within the JSON file.                | `"translations"`            |
| `log`           | `boolean` (optional)| If `true`, enables logging of the process.                        | `true`                      |
| `dryRun`        | `boolean` (optional)| If `true`, performs a simulation without modifying the file.      | `false`                     |

#### Returns

`Promise<boolean>`: Resolves to `true` if the operation succeeds; otherwise, `false`.

#### Usage Example

```javascript
import {translateToJSON} from 'handlebars-i18n-cli';

const authKey = "abcd1234xyz"; // Your DeepL API key
const sourceFile = "./translations/source.json"; // Path to the source JSON file
const targetFile = "./translations/translated.json"; // Path to the target JSON file
const sourceLang = "en"; // Source language
const targetLang = "de"; // Target language
const deepLOptions = { formality: "formal" }; // Optional DeepL API options

const res = await translateToJSON(
  authKey,
  sourceFile,
  targetFile,
  sourceLang,
  targetLang,
  deepLOptions,
  "data.translations", // Key for nested translations, we expect source key "en" to be here 
  true, // Enable logging
  false // Not a dry run, so it will modify/create the target file
);
```

---

## Run tests

```bash
npm run test
```

## License

Copyright (c) 2022-24 Florian Walzel,
MIT License
