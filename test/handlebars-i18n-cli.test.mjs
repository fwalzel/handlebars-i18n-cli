/**
 * Tests for ./src/i18n-collect.js
 *
 * usage:
 * $ npm test
 */

import * as chai from 'chai';
import sinon from 'sinon';
import fs from 'fs';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
import axios from 'axios';
import {stdout} from 'test-console';
const { assert, expect } = chai;
chai.use(chaiAsPromised);
chai.use(sinonChai);

// import * as i18nCollect from '../src/i18n-collect.js';

import { setAuthKey,
  getSupportedLanguages,
  translateTexts,
  readI18nJson,
  translateJSON } from '../src/i18n-deepl.js';




/*describe('Tests for Command i18n-collect', () => {

  const templSimple = 'test/test-assets/simple.html';
  const customSimple = 'test/test-assets/custom-func.html';

  /!****************************************
   * TEST MAIN INTERFACE
   ****************************************!/
  
  it('[1] FUNC: cli shall be a function', () => {
    assert.isFunction(cli);
  });

  it('[2] ERROR: cli shall error when called without argument', async () => {
    const argv = [null, null];
    expect(cli(argv)).to.be.rejectedWith(Error);
  });

  it('[3] HELP: cli shall log help when called with argument --help', () => {
    const argv = [null, null, '--help']
    const output = stdout.inspectSync(() => { cli(argv) });
    assert.deepEqual(output, [
        '\u001b[2mUsage:\n',
        'i18n-collect <source> <target> <options...>\n',
        '\n',
        '<source>                 path to handlebars.js template file(s), glob pattern allowed\n',
        '<target>                 json file(s) to write result to\n',
        '\n',
        '<options>\n',
        '--alphabetical or -a     will order the keys to the translation strings alphabetically in the json\n',
        '                         default: keys in order of appearance as within the template(s)\n',
        '--dryRun or -dr          will log the result(s) but not write out json file(s)\n',
        '--empty or -e            will create empty value strings for the translations in the json\n',
        '                         default: value strings contain current language and key name\n',
        '--lng=en,fr,es,…         the languages you want to be generated\n',
        '                         default: en\n',
        '--log or -l              log final results to console\n',
        '--separateLngFiles       write each language in a separate json file\n',
        '  or -sf                 default: all languages are written as arrays in one json file\n',
        '--translFunc=customName  a custom name of the translation function used in the templates\n',
        '                         default: __ like handlebars-i18n notation: {{__ keyToTranslate}}\n',
        '--update or -u           updates existing json files(s) after changes made in template file(s)\n',
        '\u001b[0m\n' ]
    );
  });

  it('[4] ERROR: cli shall error when called without a second argument', async () => {
    const argv = [null, null, 'someText']
    expect(cli(argv)).to.be.rejectedWith(Error);
  });

  it('[5] WARN: cli shall log when a given file does not contain strings for translation',async () => {
    const argv = [null, null, 'test/test-assets/empty.html', 'test/test-generated/empty.json'];
    const inspect = stdout.inspect();
    await cli(argv);
    inspect.restore();
    assert.deepEqual(inspect.output, [
      'Now processing test/test-assets/empty.html\n',
      'No strings for translation found, no files written.\n'
    ]);
  });

  it('[6] LOG: cli shall log myKey and myVar (with additional text) for language "en" when called with argument --log', async () => {
    const fileNo = 6; // we use the no. of the test here
    const argv = [null, null, templSimple, `test/test-generated/test-${fileNo}.json`, '--log'];
    const inspect = stdout.inspect();
    await cli(argv);
    inspect.restore();
    assert.deepEqual(inspect.output, [
      `Now processing ${templSimple}\n`,
      '{\n  \"translations\": {\n    \"en\": {\n      \"myKey\": \"en of myKey with variables {{myVar}}\"\n    }\n  }\n}\n',
      `\u001b[32mDone and Ready! Your output was written to test/test-generated/test-${fileNo}.json\u001b[0m\n`
    ]);
  });

  it('[7] ALPHABETICAL: cli shall log keys for language "en" in alphabetical order when called with argument --alphabetical and --log', async () => {
    const fileNo = 7;
    const argv = [null, null, 'test/test-assets/multiple.html', `test/test-generated/test-${fileNo}.json`, '--alphabetical', '--log'];
    const inspect = stdout.inspect();
    await cli(argv);
    inspect.restore();
    assert.deepEqual(inspect.output, [
      'Now processing test/test-assets/multiple.html\n',
      '{\n  \"translations\": {\n    \"en\": {\n      \"a\": {\n        \"a\": \"en of a.a\",\n        \"b\": \"en of a.b\"\n      },\n      \"b\": \"en of b\"\n    }\n  }\n}\n',
      `\u001b[32mDone and Ready! Your output was written to test/test-generated/test-${fileNo}.json\u001b[0m\n`
    ]);
  });
  
  it('[8] EMPTY: cli shall log myKey and myVar (no text) for language "en" when called with argument --empty and --log', async () => {
    const fileNo = 8;
    const argv = [null, null, templSimple, `test/test-generated/test-${fileNo}.json`, '--empty', '--log'];
    const inspect = stdout.inspect();
    await cli(argv);
    inspect.restore();
    assert.deepEqual(inspect.output, [
       `Now processing ${templSimple}\n`,
      '{\n  \"translations\": {\n    \"en\": {\n      \"myKey\": \"{{myVar}}\"\n    }\n  }\n}\n',
      `\u001b[32mDone and Ready! Your output was written to test/test-generated/test-${fileNo}.json\u001b[0m\n`
    ]);
  });

  it('[9] LNG: cli shall log myKey and myVar for language "de", "fr", and "es" when called with arguments --lng=de,fr,es and --log', async () => {
    const fileNo = 9;
    const argv = [null, null, templSimple, `test/test-generated/test-${fileNo}.json`, '--lng=de,fr,es', '--log'];
    const inspect = stdout.inspect();
    await cli(argv);
    inspect.restore();
    assert.deepEqual(inspect.output, [
       `Now processing ${templSimple}\n`,
      '{\n  \"translations\": {\n    \"de\": {\n      \"myKey\": \"de of myKey with variables {{myVar}}\"\n    },\n    \"fr\": {\n      \"myKey\": \"fr of myKey with variables {{myVar}}\"\n    },\n    \"es\": {\n      \"myKey\": \"es of myKey with variables {{myVar}}\"\n    }\n  }\n}\n',
      `\u001b[32mDone and Ready! Your output was written to test/test-generated/test-${fileNo}.json\u001b[0m\n`
    ]);
  });

  it('[10] SEPARATE FILES: cli shall log for three single files when called with arguments --lng=de,fr,es -sf and --log', async () => {
    const fileNo = 10;
    const argv = [null, null, templSimple, `test/test-generated/test-${fileNo}.json`, '--lng=de,fr,es', '-sf', '--log'];
    const inspect = stdout.inspect();
    await cli(argv);
    inspect.restore();
    assert.deepEqual(inspect.output, [
      `Now processing ${templSimple}\n`,
      "{\n  \"de\": {\n    \"myKey\": \"de of myKey with variables {{myVar}}\"\n  }\n}\n",
      `\u001b[34mWrote language keys for 'de' to test/test-generated/test-${fileNo}.de.json\u001b[0m\n`,
      "{\n  \"fr\": {\n    \"myKey\": \"fr of myKey with variables {{myVar}}\"\n  }\n}\n",
      `\u001b[34mWrote language keys for 'fr' to test/test-generated/test-${fileNo}.fr.json\u001b[0m\n`,
      "{\n  \"es\": {\n    \"myKey\": \"es of myKey with variables {{myVar}}\"\n  }\n}\n",
      `\u001b[34mWrote language keys for 'es' to test/test-generated/test-${fileNo}.es.json\u001b[0m\n`,
      "\u001b[32mYou’re good. All Done.\u001b[0m\n"
    ]);
  });

  it('[11] CUSTOM TRANSLATION FUNC: cli shall log myOtherKey when called with arguments --translFunc=_t and --log', async () => {
    const fileNo = 11;
    const argv = [null, null, customSimple, `test/test-generated/test-${fileNo}.json`, '--translFunc=_t', '--log'];
    const inspect = stdout.inspect();
    await cli(argv);
    inspect.restore();
    assert.deepEqual(inspect.output, [
      `Now processing ${customSimple}\n`,
      "{\n  \"translations\": {\n    \"en\": {\n      \"myOtherKey\": \"en of myOtherKey\"\n    }\n  }\n}\n",
      `\u001b[32mDone and Ready! Your output was written to test/test-generated/test-${fileNo}.json\u001b[0m\n`
    ]);
  });

  it('[12] UPDATE: cli shall log for extending existing file when called with arguments --update and --log', async () => {
    const fileNo = 12;
    const argv = [null, null, templSimple, `test/test-generated/test-${fileNo}.json`, '--update', '--log'];
    const inspect = stdout.inspect();
    await cli(argv);
    inspect.restore();
    assert.deepEqual(inspect.output, [
      `Now processing ${templSimple}\n`,
      "{\n  \"translations\": {\n    \"en\": {\n      \"myKey\": \"en of myKey with variables {{myVar}}\",\n      \"hasAlreadyAKey\": \"WithSomeValue\"\n    }\n  }\n}\n",
      `\u001b[32mDone and Ready! Your output was written to test/test-generated/test-${fileNo}.json\u001b[0m\n`
    ]);
  });

});*/

describe('i18n-deepl setAuthKey', () => {
  let writeFileStub;

  beforeEach(function() {
    // Stub the fs.writeFile function
    writeFileStub = sinon.stub(fs, 'writeFile');
  });

  afterEach(function() {
    // Restore the original fs.writeFile function
    sinon.restore();
  });

  it('should throw an error if the key is not a string', async function() {
    const invalidKey = 12345; // Example of a non-string key
    await expect(setAuthKey(invalidKey)).to.be.rejectedWith('Provided argument is not a valid deepl auth key.');
  });

  it('should throw an error if the key is an empty string', async function() {
    const invalidKey = ''; // Example of an empty string key
    await expect(setAuthKey(invalidKey)).to.be.rejectedWith('Provided argument is not a valid deepl auth key.');
  });

  it('should return true if the key is valid and the file is written successfully', async function() {
    writeFileStub.resolves([true, null]); // Simulate successful file write
    const validKey = 'valid-auth-key';
    const result = await setAuthKey(validKey);
    expect(result).to.be.true;
    //expect(writeFileStub).to.have.been.calledOnceWithExactly('deepl-auth.env', `export DEEPL_AUTH_KEY='${validKey}'`);
  });

  /*it('should throw an error if fs.writeFile fails', async function() {
    const fsError = new Error('Failed to write file');
    writeFileStub.rejects(fsError); // Simulate file write error
    const validKey = 'valid-auth-key';
    await expect(await setAuthKey(validKey)).to.be.rejectedWith(fsError);
    expect(writeFileStub).to.have.been.calledOnceWithExactly('deepl-auth.env', `export DEEPL_AUTH_KEY='${validKey}'`);
  });*/

});

describe('i18n-deepl getSupportedLanguages', function () {
  let axiosGetStub;

  beforeEach(function () {
    // Stub axios.get to control its behavior in tests
    axiosGetStub = sinon.stub(axios, 'get');
  });

  afterEach(function () {
    // Restore the original behavior of axios.get after each test
    sinon.restore();
  });

  it('should throw an error when no authKey is provided', async function () {
    await expect(getSupportedLanguages()).to.be.rejectedWith('Invalid argument authKey provided.');
  });

  it('should fetch supported languages when authKey is valid', async function () {
    // Mock the response for the axios.get request
    const mockResponse = { data: [{ language: 'EN' }, { language: 'DE' }] };
    axiosGetStub.resolves(mockResponse);

    const result = await getSupportedLanguages('valid-auth-key');

    // Assert that the function returns the expected result
    expect(result).to.deep.equal(mockResponse.data);
    expect(axiosGetStub.calledOnce).to.be.true;
  });

  it('should throw an error when axios request fails', async function () {
    // Mock a failed axios.get request
    axiosGetStub.rejects(new Error('Network error'));

    await expect(getSupportedLanguages('valid-auth-key')).to.be.rejectedWith('Network error');
  });
});
