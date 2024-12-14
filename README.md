# handlebars-i18n-cli

`handlebars-i18n-cli` is an additional command line interface
for [handlebars-i18n](https://github.com/fwalzel/handlebars-i18n.git) and other implementations of i18next in handlebars.

* programmatically extract/ update translation strings from handlebars templates and generate i18next conform
  JSON files from it
* automatic translation of i18next JSON via [DeepL’s](https://www.deepl.com/en/pro-api/) free API

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![Node.js version](https://img.shields.io/badge/node-%3E%3D14-brightgreen)
[![Build](https://github.com/fwalzel/handlebars-i18n-cli/actions/workflows/node.js.yml/badge.svg)](https://github.com/fwalzel/handlebars-i18n-cli/actions/workflows/node.js.yml/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/fwalzel/handlebars-i18n-cli/badge.svg?branch=main)](https://coveralls.io/github/fwalzel/handlebars-i18n-cli?branch=main)
[![Known Vulnerabilities](https://snyk.io/test/github/fwalzel/handlebars-i18n-cli/badge.svg)](https://snyk.io/test/github/fwalzel/handlebars-i18n-cli/badge.svg)
![npm](https://img.shields.io/npm/dt/handlebars-i18n-cli)

## Install

```shell
npm i handlebars-i18n-cli --save-dev
npm link handlebars-i18n-cli
```

If you do not link the package, you may run into the error `bash: i18n-collect: command not found`.

## General Use

### 1. Language Key Extraction: _i18n-collect_ 

#### Syntax:

```
i18n-collect <source> <target> <options...>
```

#### Example:

Generate a file `translations.json` holding the translations for `de`, `fr`, and `en` by extracting all key
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

### 2. Automatic Translation via DeepL API: _i18n-deepl_

#### Syntax:

```
i18n-deepl translate <source> <target> <targetLang> <options...>
```

#### Example:

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


## Purpose / Motivation

Managing large volumes of translations can be a tedious and time-consuming task, for each change in the template needs
to be mapped to all languages. Usually this comes along with a lot of redundant typing or copy/paste action. Moreover
the chance of missing some translation strings increases with many translations in play.

`handlebars-i18n-cli` automates the task of extracting and updating key names indicating translation strings and
generating template JSON files from them. The key names for the translations need to specified only once in the
template, the carry to the according language JSON is done by the CLI. You then only have to fill in according translations.
In case a translation string expects variables for replacement, these variables will be added to your json template.

If you are not using [handlebars-i18n](https://github.com/fwalzel/handlebars-i18n.git) for translation but a custom integration of i18next into handlebars.js, you 
might be able to appropriate this cli by using the option --translFunc (
see below).

Also `handlebars-i18n-cli` allows you to **auto-translate** a JSON file with an existing translation to another language  
via the DeepL API, while the original key names and JSOn structure are kept.

## Example

Try the examples folder within this repo.

For generating a single JSON file:

```bash
i18n-collect examples/templates/*.html examples/generated/translations.json --lng de,fr,en 
```

For one JSON file per language:

```bash
i18n-collect examples/templates/*.html examples/generated/translations.json --separateLngFiles --lng de,fr,en 
```

## Programmatical Use

You can use `handlebars-i18n-cli` in a programmatical way too. For import and integration of the Javascript Functions see
[handlebars-i18n-cli Programmatical Use](README_programmatic.md).


## Detailed Description for Command _i18n-collect_ 

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

### Usage options

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
i18n-collect my-project/template.html my-project/translation.json --lng de,en,fr --separateLngFiles
```

Will generate three json files: **translation.de.json**, **translation.en.json**, and **translation.fn.json** each
holding only the translation for their respective language. By default all translations are written to a single json file.

---

`--translFunc=yourCustomFunctionName`

If you are not using handlebars-i18n for translations but a custom handlebars helper, you might be able to use
i18n-collect as well.Say your translation function has the name *t* instead of handlebars-i18n’s *__* (double
underscore) and your template usage would look like

```html
{{t myKeyNameToTranslation}}
```

you can do

```bash
i18n-collect my-project/template.html my-project/translation.json --translFunc=t
```

--translFunc=t then substitutes the default *__* with a search for t.

---

`--update` or `-u`

Update an existing .json file with new translations. All keys in the existing .json are kept, new ones from the template
will be added.

Works also with the option --separateLngFiles:

```bash
i18n-collect my-project/**/*.html my-project/translation --update --lng de,en,fr --separateLngFiles
```

Leave out the language ending and json file extension and give only the base name for <target>. In this example case
handlebars-i18n-cli would look for *translation.de.json*, *translation.en.json*, and *translation.en.json* to update
them. A language file that does not exist yet will be generated.


## Detailed Description for _i18n-deepl_ Commands

i18n-deepl is a command-line tool to translate i18next JSON files using the DeepL API. Below is a detailed guide to its 
commands and usage. To use this tool, you need a valid DeepL API key. Set this key using the setAuth command or provide 
it directly via the --auth-key option when running commands.

### 1. `setAuth`

Saves your DeepL Auth Key as an environment variable in a .env file for future use.

#### Syntax

```
i18n-deepl setAuth <authKey>
```

#### Example

```bash
i18n-deepl setAuth abcdefghijklmnopqrstuvwxyz123456
```

#### Output

```
Success. DeepL Auth Key is now set.
```

### 2. `languages`
   
#### Description

Lists all languages supported by the DeepL API.

#### Syntax

```
i18n-deepl languages [--auth-key <authKey>]
```

#### Options

```
--auth-key <authKey>: (Optional) Provide the DeepL Auth Key directly. If not provided, the tool uses the key from the .env file.
```

#### Example

```bash
i18n-deepl languages
```

#### Output

```
DeepL’s Supported Languages:
EN - English
DE - German
FR - French
...
```

### 3. `translate`

Translates the contents of a JSON file into the specified target language and saves the output in a new JSON file.
Prerequisite is a (free) API Key for DeepL’s translation service. Get the key [here](https://www.deepl.com/en/pro#developer).

#### Syntax

```
i18n-deepl translate <source> <target> <targetLang> [options]
```

#### Arguments

+ `<source>`: Path to the source JSON file (e.g., ./translations.json). When target and source file are identical, the 
  result will be added (merged) to the existing file. New translations will be added, existing ones are kept. 
+ `<target>`: Path where the translated JSON file will be saved.
+ `<targetLang>`: Target language code (e.g., **fr** for French, **es** for Spanish).

#### Options

+ `--auth-key, -ak <authKey>`: (Optional) Provide the DeepL Auth Key directly.
+ `--source-lang, -sl <sourceLang>`: (Optional) Specify the source language (e.g., en for English). Defaults to auto-detection.
+ `--source-nested, -sn <sourceNested>`: (Optional) Specify a nested key within the JSON for translation (e.g., data.translations).
+ `--log, -l`: (Optional) Log the translation process to the console.
+ `--dryRun, -dr`: (Optional) Perform a dry run, logging the process without modifying or saving data.
+ `--options, -o <options>`: (Optional) Pass additional DeepL API options as an object (e.g., --options="{formality: 'less'}").

#### Example

```bash
i18n-deepl translate ./source.json ./output.json fr --source-lang en --log
```


#### Output

```
Translation complete. See ./output.json for your results.
```


## Run tests

```bash
npm run test
```

## License

Copyright (c) 2022-24 Florian Walzel,
MIT License
