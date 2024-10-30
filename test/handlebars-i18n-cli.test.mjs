/**
 * Tests for ./src/i18n-collect.js & ./src/i18n-deepl.js
 *
 * usage:
 * $ npm test
 */

import * as chai from 'chai';
import sinon from 'sinon';
import fs from 'fs';
import fst from 'async-file-tried';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
import axios from 'axios';
import deepl from 'deepl-node'; // Assuming deepl is imported in the module
import {stdout} from 'test-console';

const {assert, expect} = chai;
chai.use(chaiAsPromised);
chai.use(sinonChai);

import {i18nCollect} from '../src/i18n-collect.js';

import {
  setAuthKey,
  getSupportedLanguages,
  translateTexts,
  readI18nJson,
  translateToJSON
} from '../src/i18n-deepl.js';


describe('Tests for Command i18n-collect', () => {

  const templSimple = 'test/test-assets/simple.html';
  const customSimple = 'test/test-assets/custom-func.html';

  /*****************************************
   * TEST MAIN INTERFACE
   ****************************************/

  it('[1] FUNC: i18nCollect shall be a function', () => {
    assert.isFunction(i18nCollect);
  });

  it('[2] ERROR: i18nCollect shall error when called without argument', async () => {
    expect(i18nCollect()).to.be.rejectedWith(Error);
  });


  it('[3] ERROR: i18nCollect shall error when called without a second argument', async () => {
    expect(i18nCollect(templSimple)).to.be.rejectedWith(Error);
  });

  it('[4] WARN: i18nCollect shall log when a given file does not contain strings for translation', async () => {
    const inspect = stdout.inspect();
    await i18nCollect('test/test-assets/empty.html', 'test/test-generated/empty.json');
    inspect.restore();
    assert.deepEqual(inspect.output, [
      'Now processing test/test-assets/empty.html\n',
      'No strings for translation found, no files written.\n'
    ]);
  });

  it('[5] LOG: i18nCollect shall log myKey and myVar (with additional text) for language "en" when called with argument --log', async () => {
    const fileNo = 5; // we use the no. of the test here
    const inspect = stdout.inspect();
    await i18nCollect(templSimple, `test/test-generated/test-${fileNo}.json`, {log: true});
    inspect.restore();
    assert.deepEqual(inspect.output, [
      `Now processing test/test-assets/simple.html\n`,
      `{\n  \"translations\": {\n    \"en\": {\n      \"myKey\": \"en of myKey with variables {{myVar}}\"\n    }\n  }\n}\n`
    ]);
  });

  it('[6] ALPHABETICAL: i18nCollect shall log keys for language "en" in alphabetical order when called with argument --alphabetical and --log', async () => {
    const fileNo = 6;
    const inspect = stdout.inspect();
    await i18nCollect('test/test-assets/multiple.html', `test/test-generated/test-${fileNo}.json`, {
      alphabetical: true,
      log: true
    });
    inspect.restore();
    assert.deepEqual(inspect.output, [
      'Now processing test/test-assets/multiple.html\n',
      '{\n  \"translations\": {\n    \"en\": {\n      \"a\": {\n        \"a\": \"en of a.a\",\n        \"b\": \"en of a.b\"\n      },\n      \"b\": \"en of b\"\n    }\n  }\n}\n'
    ]);
  });

  it('[7] EMPTY: i18nCollect shall log myKey and myVar (no text) for language "en" when called with argument --empty and --log', async () => {
    const fileNo = 8;
    const inspect = stdout.inspect();
    await i18nCollect(templSimple, `test/test-generated/test-${fileNo}.json`, {empty: true, log: true});
    inspect.restore();
    assert.deepEqual(inspect.output, [
      `Now processing ${templSimple}\n`,
      '{\n  \"translations\": {\n    \"en\": {\n      \"myKey\": \"{{myVar}}\"\n    }\n  }\n}\n'
    ]);
  });

  it('[8] LNG: i18nCollect shall log myKey and myVar for language "de", "fr", and "es" when called with arguments --lng=de,fr,es and --log', async () => {
    const fileNo = 8;
    const inspect = stdout.inspect();
    await i18nCollect(templSimple, `test/test-generated/test-${fileNo}.json`, {lng: ["de", "fr", "es"], log: true});
    inspect.restore();
    assert.deepEqual(inspect.output, [
      `Now processing ${templSimple}\n`,
      '{\n  \"translations\": {\n    \"de\": {\n      \"myKey\": \"de of myKey with variables {{myVar}}\"\n    },\n    \"fr\": {\n      \"myKey\": \"fr of myKey with variables {{myVar}}\"\n    },\n    \"es\": {\n      \"myKey\": \"es of myKey with variables {{myVar}}\"\n    }\n  }\n}\n'
    ]);
  });

  it('[9] SEPARATE FILES: i18nCollect shall log for three single files when called with arguments --lng=de,fr,es -sf and --log', async () => {
    const fileNo = 9;
    const inspect = stdout.inspect();
    await i18nCollect(templSimple, `test/test-generated/test-${fileNo}.json`, {
      lng: ["de", "fr", "es"],
      log: true,
      separateLngFiles: true
    });
    inspect.restore();
    assert.deepEqual(inspect.output, [
      `Now processing ${templSimple}\n`,
      "{\n  \"de\": {\n    \"myKey\": \"de of myKey with variables {{myVar}}\"\n  }\n}\n",
      `\u001b[34mWrote language keys for 'de' to test/test-generated/test-${fileNo}.de.json\u001b[0m\n`,
      "{\n  \"fr\": {\n    \"myKey\": \"fr of myKey with variables {{myVar}}\"\n  }\n}\n",
      `\u001b[34mWrote language keys for 'fr' to test/test-generated/test-${fileNo}.fr.json\u001b[0m\n`,
      "{\n  \"es\": {\n    \"myKey\": \"es of myKey with variables {{myVar}}\"\n  }\n}\n",
      `\u001b[34mWrote language keys for 'es' to test/test-generated/test-${fileNo}.es.json\u001b[0m\n`
    ]);
  });

  /*
  it('[11] CUSTOM TRANSLATION FUNC: i18nCollect shall log myOtherKey when called with arguments --translFunc=_t and --log', async () => {
    const fileNo = 11;
    const argv = [null, null, customSimple, `test/test-generated/test-${fileNo}.json`, '--translFunc=_t', '--log'];
    const inspect = stdout.inspect();
    await i18nCollect(argv);
    inspect.restore();
    assert.deepEqual(inspect.output, [
      `Now processing ${customSimple}\n`,
      "{\n  \"translations\": {\n    \"en\": {\n      \"myOtherKey\": \"en of myOtherKey\"\n    }\n  }\n}\n",
      `\u001b[32mDone and Ready! Your output was written to test/test-generated/test-${fileNo}.json\u001b[0m\n`
    ]);
  });

  it('[12] UPDATE: i18nCollect shall log for extending existing file when called with arguments --update and --log', async () => {
    const fileNo = 12;
    const argv = [null, null, templSimple, `test/test-generated/test-${fileNo}.json`, '--update', '--log'];
    const inspect = stdout.inspect();
    await i18nCollect(argv);
    inspect.restore();
    assert.deepEqual(inspect.output, [
      `Now processing ${templSimple}\n`,
      "{\n  \"translations\": {\n    \"en\": {\n      \"myKey\": \"en of myKey with variables {{myVar}}\",\n      \"hasAlreadyAKey\": \"WithSomeValue\"\n    }\n  }\n}\n",
      `\u001b[32mDone and Ready! Your output was written to test/test-generated/test-${fileNo}.json\u001b[0m\n`
    ]);
  });*/

});

/*describe('i18n-deepl setAuthKey', () => {
  let writeFileStub;

  beforeEach(function () {
    // Stub the fs.writeFile function
    writeFileStub = sinon.stub(fs, 'writeFile');
  });

  afterEach(function () {
    // Restore the original fs.writeFile function
    sinon.restore();
  });

  it('should throw an error if the key is not a string', async function () {
    const invalidKey = 12345; // Example of a non-string key
    await expect(setAuthKey(invalidKey)).to.be.rejectedWith('Provided argument is not a valid deepl auth key.');
  });

  it('should throw an error if the key is an empty string', async function () {
    const invalidKey = ''; // Example of an empty string key
    await expect(setAuthKey(invalidKey)).to.be.rejectedWith('Provided argument is not a valid deepl auth key.');
  });

  it('should return true if the key is valid and the file is written successfully', async function () {
    writeFileStub.resolves([true, null]); // Simulate successful file write
    const validKey = 'valid-auth-key';
    const result = await setAuthKey(validKey);
    expect(result).to.be.true;
    //expect(writeFileStub).to.have.been.calledOnceWithExactly('.env', `export DEEPL_AUTH_KEY='${validKey}'`);
  });

  /!*it('should throw an error if fs.writeFile fails', async function() {
    const fsError = new Error('Failed to write file');
    writeFileStub.rejects(fsError); // Simulate file write error
    const validKey = 'valid-auth-key';
    await expect(await setAuthKey(validKey)).to.be.rejectedWith(fsError);
    expect(writeFileStub).to.have.been.calledOnceWithExactly('.env', `export DEEPL_AUTH_KEY='${validKey}'`);
  });*!/

});*/

/*
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
    const mockResponse = {data: [{language: 'EN'}, {language: 'DE'}]};
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
*/

/*
describe('i18n-deepl translateTexts', () => {
  let authKey, texts, sourceLang, targetLang, options, translatorStub;

  beforeEach(() => {
    authKey = 'valid-auth-key';
    texts = ['Hello', 'World'];
    sourceLang = 'EN';
    targetLang = 'FR';
    options = {formality: 'informal'};

    // Mock deepl.Translator
    translatorStub = sinon.stub(new deepl.Translator(authKey));
    sinon.stub(deepl, 'Translator').returns(translatorStub);
  });

  afterEach(() => {
    sinon.restore(); // Reset all stubs/mocks/spies between tests
  });

  it('should throw an error if authKey is not a string', async () => {
    try {
      await translateTexts(12345, texts, sourceLang, targetLang, options);
    } catch (error) {
      expect(error.message).to.equal('Invalid argument authKey provided.');
    }
  });

  it('should call deepl.Translator with correct authKey', async () => {
    translatorStub.translateText.resolves(['Bonjour', 'Monde']);

    await translateTexts(authKey, texts, sourceLang, targetLang, options);

    expect(deepl.Translator).to.have.been.calledWith(authKey);
    expect(translatorStub.translateText).to.have.been.calledWith(texts, sourceLang, targetLang, options);
  });

  it('should return translated texts from deepl.Translator', async () => {
    const translatedTexts = ['Bonjour', 'Monde'];
    translatorStub.translateText.resolves(translatedTexts);

    const result = await translateTexts(authKey, texts, sourceLang, targetLang, options);

    expect(result).to.deep.equal(translatedTexts);
  });

  it('should throw an error when deepl.Translator.translateText fails', async () => {
    const error = new Error('Translation failed');
    translatorStub.translateText.rejects(error);

    try {
      await translateTexts(authKey, texts, sourceLang, targetLang, options);
    } catch (err) {
      expect(err.message).to.equal('Translation failed');
    }
  });
});
*/

/*
describe('i18n-deepl translateToJSON', () => {

  afterEach(() => {
    sinon.restore(); // Restore mocks after each test
  });

  it('should translate a JSON file and write the translated result to a target file', async () => {
    // Mock reading the JSON source file
    const mockJsonData = {greeting: "Hello"};
    sinon.stub(fst, 'readJson').resolves([mockJsonData, null]);

    // Mock DeepL translation result
    const mockTranslationResult = [{text: "Hallo"}];
    sinon.stub(deepl.Translator.prototype, 'translateText').resolves(mockTranslationResult);

    // Mock writing the translated result to a target file
    const writeJsonMock = sinon.stub(fst, 'writeJson').resolves([true, null]);

    // Execute the function
    const result = await translateToJSON('authKey', 'src.json', 'target.json', 'de', '', 'en', false, false, {});

    // Assertions
    expect(writeJsonMock).to.have.been.calledWith('target.json', {greeting: 'Hallo'});
    expect(result).to.be.true;
  });

  it('should log the translation result but not write the file when dryRun is true', async () => {
    // Mock reading the JSON source file
    const mockJsonData = {greeting: "Hello"};
    sinon.stub(fst, 'readJson').resolves([mockJsonData, null]);

    // Mock DeepL translation result
    const mockTranslationResult = [{text: "Hallo"}];
    sinon.stub(deepl.Translator.prototype, 'translateText').resolves(mockTranslationResult);

    // Mock writing (it should NOT be called)
    const writeJsonMock = sinon.stub(fst, 'writeJson');

    // Spy on console.log to check if it's called
    const logSpy = sinon.spy(console, 'log');

    // Execute the function
    const result = await translateToJSON('authKey', 'src.json', 'target.json', 'de', '', 'en', false, true, {});

    // Assertions
    expect(writeJsonMock).not.to.have.been.called;
    expect(logSpy).to.have.been.calledWith({greeting: 'Hallo'});
    expect(result).to.be.true;

    // Restore console.log spy
    logSpy.restore();
  });


  /!*it('should throw an error if the target file already exists', async () => {
    // Mock reading the JSON source file
    const mockJsonData = {greeting: "Hello"};
    sinon.stub(fst, 'readJson').resolves([mockJsonData, null]);

    // Mock file existence and realpathSync
    sinon.stub(fst, 'access').resolves([true, null]);
    sinon.stub(fs, 'realpathSync').returns('/path/to/src.json');

    try {
      await translateToJSON('authKey', 'src.json', 'target.json', 'de', '', 'en', false, false, {});
    } catch (err) {
      expect(err.message).to.include('The target file target.json already exists.');
    }
  });*!/

  /!*it('should translate a nested structure in the JSON file and insert into the target', async () => {
    // Mock reading the JSON source file with a nested structure
    const mockJsonData = {nested: {greeting: "Hello"}};
    sinon.stub(fst, 'readJson').resolves([mockJsonData, null]);

    // Mock DeepL translation result
    const mockTranslationResult = [{text: "Hallo"}];
    sinon.stub(deepl.Translator.prototype, 'translateText').resolves(mockTranslationResult);

    // Mock writing the translated result
    const writeJsonMock = sinon.stub(fst, 'writeJson').resolves([true, null]);

    // Execute the function
    const result = await translateToJSON('authKey', 'src.json', 'target.json', 'de', 'nested', 'en', false, false, {});

    // Assertions
    expect(writeJsonMock).to.have.been.calledWith('target.json', {nested: {greeting: 'Hallo'}});
    expect(result).to.be.true;
  });
*!/
  /!*it('should throw an error if DeepL API call fails', async () => {
    // Mock reading the JSON source file
    const mockJsonData = {greeting: "Hello"};
    sinon.stub(fst, 'readJson').resolves([mockJsonData, null]);

    // Mock DeepL API failure
    sinon.stub(deepl.Translator.prototype, 'translateText').rejects(new Error('API Error'));

    try {
      await translateToJSON('authKey', 'src.json', 'target.json', 'de', '', 'en', false, false, {});
    } catch (err) {
      expect(err.message).to.equal('API Error');
    }
  });
*!/
});
*/
