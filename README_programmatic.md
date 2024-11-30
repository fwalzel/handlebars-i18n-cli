# handlebars-i18n-cli Programmatical Use

You can use the functions of `handlebars-i18n-cli` in a programatical way, i.e. to make them part of your continuous integration.

---

## Specification for Function _i18nCollect_

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

## Specification for DeepL Utility Functions

This module provides a set of functions to interact with the DeepL API for authentication, language retrieval, text translation, and JSON file translation.

### Function `setAuthKey`

Writes the DeepL authentication key to a .env file.

#### Function Signature

```typescript
export function setAuthKey(key: string, path?: string): Promise<boolean>;
```

#### Parameters

| **Name**          | **Type**  | **Description**                                        | **Example**     |
|-------------------|-----------|--------------------------------------------------------|-----------------|
| `key`             | `string`  | Your DeepL API authentication key.                     | `"abcd1234xyz"` |
| `path` (optional) | `string`  | The path where the `.env` file should go. Default: `./` | `"abcd1234xyz"` |

#### Returns

`Promise<boolean>`: Resolves to `true` if the key was successfully written; otherwise, `false`.

```javascript
import {setAuthKey} from 'handlebars-i18n-cli';
await setAuthKey('abcd1234xyz');
```

Fetch the authKey with `const key = process.env.DEEPL_AUTH;`.


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
