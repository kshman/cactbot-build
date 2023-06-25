// This test loads an individual trigger file and makes validates
// the format and regex calls made.

// JavaScript doesn't allow for possessive operators in regular expressions.

import fs from 'fs';
import path from 'path';

import { assert } from 'chai';

import NetRegexes, {
  buildNetRegexForTrigger,
  keysThatRequireTranslation,
} from '../../resources/netregexes';
import { UnreachableCode } from '../../resources/not_reached';
import PartyTracker from '../../resources/party';
import Regexes from '../../resources/regexes';
import {
  builtInResponseStr,
  triggerFunctions,
  triggerTextOutputFunctions,
} from '../../resources/responses';
import { translateWithReplacements } from '../../resources/translations';
import { RaidbossData } from '../../types/data';
import { Matches } from '../../types/net_matches';
import {
  LooseTimelineTrigger,
  LooseTrigger,
  LooseTriggerSet,
  Output,
  OutputStrings,
  ResponseFunc,
  TriggerFunc,
} from '../../types/trigger';
import raidbossOptions from '../../ui/raidboss/raidboss_options';

const emptyPartyTracker = new PartyTracker();

const getFakeRaidbossData = (triggerSet?: LooseTriggerSet): RaidbossData => {
  return {
    me: '',
    job: 'NONE',
    role: 'none',
    party: emptyPartyTracker,
    lang: 'en',
    parserLang: 'en',
    displayLang: 'en',
    currentHP: 0,
    options: raidbossOptions,
    inCombat: true,
    triggerSetConfig: {},
    ShortName: (x: string | undefined) => x ?? '',
    StopCombat: (): void => {/* noop */},
    ParseLocaleFloat: () => 0,
    CanStun: () => false,
    CanSilence: () => false,
    CanSleep: () => false,
    CanCleanse: () => false,
    CanFeint: () => false,
    CanAddle: () => false,
    ...triggerSet?.initData?.() ?? {},
  };
};

const isResponseFunc = (func: unknown): func is ResponseFunc<RaidbossData, Matches> => {
  return typeof func === 'function';
};

const testTriggerFile = (file: string, info: TriggerSetInfo) => {
  let contents: string;
  let triggerSet: LooseTriggerSet;

  before(async () => {
    contents = fs.readFileSync(file).toString();
    // Normalize path
    const importPath = '../../' + path.relative(process.cwd(), file).replace('.ts', '.js');

    // Set a global flag to mark regexes for NetRegexes.doesNetRegexNeedTranslation.
    // See details in that function for more information.
    NetRegexes.setFlagTranslationsNeeded(true);

    // Dynamic imports don't have a type, so add type assertion.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    triggerSet = (await import(importPath)).default as LooseTriggerSet;
  });

  after(() => {
    NetRegexes.setFlagTranslationsNeeded(false);
  });

  // Dummy test so that failures in before show up with better text.
  it('should load properly', () => {/* noop */});

  it('반드시 유니크 아이디를 가져야해요', () => {
    const id = triggerSet.id;
    if (id === undefined) {
      assert.fail('어쨋튼 정의되지 않은 아이디를 갖고 있어요');
      return;
    }
    const prevFile = info.triggerSetId[id];
    if (prevFile === undefined) {
      info.triggerSetId[id] = file;
      return;
    }
    assert.fail(`트리거셋 아이디 충돌: ${id} 아이디는 이미 사용중이예요: ${prevFile}`);
  });

  it('Regexes를 쓰면 안되요', () => {
    const regexes = /(?:(?:regex)(?:|Cn|De|Fr|Ko|Ja)\w*\s*:\w*\s*Regexes\.)/g;
    const results = regexes.exec(contents);
    if (results && results.length > 0) {
      for (const result of results)
        assert.fail(`Regexes 사용: '${result}'`);
    }
  });

  it('should not use non-network triggers', () => {
    const regexesProps = ['regex', 'regexCn', 'regexDe', 'regexFr', 'regexKo', 'regexJa'];
    for (const [index, trigger] of triggerSet.triggers?.entries() ?? []) {
      const id = trigger.id ?? `triggers[${index}]`;

      for (const prop of regexesProps)
        assert.isFalse(prop in trigger, `trigger ${id} has prop ${prop}`);
    }
  });

  it('should always use NetRegexes', () => {
    const regexes = /(?:(?:netRegex)(?:|Cn|De|Fr|Ko|Ja)\w*\s*:\w*\s*\/)[^,]+/g;
    const results = regexes.exec(contents);
    if (results && results.length > 0) {
      for (const result of results)
        assert.fail(`using raw regex: '${result}'`);
    }
  });

  it('should not use an unnecessary group regex', () => {
    const unnecessaryGroupRegex = /\(\?:.(?:\|.)+\)/g;
    const results = unnecessaryGroupRegex.exec(contents);
    if (results) {
      for (const result of results) {
        assert.fail(
          `${file}: Match single character from set '[ab]' should be used in favor of group matching '(?:a|b)' for single characters, found '${result}'`,
        );
      }
    }
  });

  // https://stackoverflow.com/questions/1007981/
  // Parsing code with regular expressions is always a great idea.
  const getParamNames = (funcStr: string): string[] => {
    return funcStr
      .replace(/[/][/].*$/mg, '') // strip single-line comments
      .replace(/\s+/g, '') // strip white space
      .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments
      .replace(/\)(?:{|=>).*$/, '') // remove trailing paren
      .replace(/^[^(]*[(]/, '') // remove leading paren
      .replace(/=[^,]+/g, '') // strip any ES6 defaults
      .split(/,(?![^{]*})/g).filter(Boolean); // split & filter [""]
  };

  it('올바른 matches와 output strings 파라미터를 갖고 있어요', () => {
    for (const [index, currentTrigger] of triggerSet.triggers?.entries() ?? []) {
      const id = currentTrigger.id ?? `triggers[${index}]`;

      let containsMatches = false;
      let containsMatchesParam = false;

      const verifyTrigger = (trigger: LooseTrigger) => {
        for (const func of triggerFunctions) {
          const currentTriggerFunction = trigger[func];
          if (currentTriggerFunction === undefined)
            continue;
          if (func === 'response' && typeof currentTriggerFunction === 'object') {
            // Hack: treat a literal response object as a trigger.  FIXME.
            verifyTrigger(currentTriggerFunction as LooseTrigger);
            continue;
          }
          if (typeof currentTriggerFunction !== 'function')
            continue;
          const funcStr = currentTriggerFunction.toString();

          const containsOutput = /\boutput\.(\w*)\(/.test(funcStr);
          const paramNames = getParamNames(funcStr);
          const containsOutputParam = paramNames.includes('output');
          // TODO: should we error when there is an unused output param? that seems a bit much.
          if (containsOutput && !containsOutputParam)
            assert.fail(`'${id}' 아이디에 'output' 파라미터가 없어요.`);

          containsMatches = containsMatches || /(?<!_)matches/.test(funcStr);
          for (const paramName of paramNames)
            containsMatchesParam = containsMatchesParam || /(?<!_)matches/.test(paramName);

          const builtInResponse = 'cactbot-builtin-response';
          if (funcStr.includes(builtInResponse)) {
            if (typeof currentTriggerFunction !== 'function') {
              assert.fail(
                `${id} 필드 '${func}' 함수는 ${builtInResponse} 기능이 있지만 함수가 아녜요.`,
              );
              continue;
            }
            if (func !== 'response') {
              assert.fail(
                `${id} 팔드 '${func}' 함수는 ${builtInResponse} 기능이 있지만 리스폰스가 아녜요.`,
              );
              continue;
            }
            // Built-in response functions can be safely called once.
            const output = new TestOutputProxy(trigger, {}) as Output;
            const data: RaidbossData = getFakeRaidbossData(triggerSet);
            const triggerFunc: TriggerFunc<RaidbossData, Matches, unknown> = currentTriggerFunction;

            const result = triggerFunc(data, {}, output);
            if (func === 'response' && typeof result === 'object') {
              // Same hack as above.  FIXME.
              verifyTrigger(result as LooseTrigger);
            }
          }
        }
      };
      verifyTrigger(currentTrigger);

      let captures = 0;
      const currentNetRegex = currentTrigger.netRegex;

      if (currentNetRegex !== undefined && currentNetRegex !== null) {
        let netRegexRegex: RegExp;

        if (currentNetRegex instanceof RegExp) {
          netRegexRegex = currentNetRegex;
        } else {
          if (currentTrigger.type === undefined) {
            assert.fail(
              `netTrigger "${id}" 타입과 비졍규형태의 netRegex 속성을 갖고 있어요`,
            );
            continue;
          }
          // TODO: we can check it from keys of `currentNetRegex`.
          netRegexRegex = buildNetRegexForTrigger(currentTrigger.type, currentNetRegex);
        }

        const capture = new RegExp(`(?:${netRegexRegex.toString()})?`).exec('');
        if (!capture) {
          assert.fail(`도달하지 않는 코드라고 해요: "${id}"`);
          throw new UnreachableCode();
        }
        captures = capture.length - 1;
      }

      if (captures > 0) {
        if (!containsMatches) {
          assert.fail(
            `필요 없는 캡쳐 그룹 트리거가 있어요: '${id}'`,
          );
        } else if (!containsMatchesParam) {
          assert.fail(`'${id}' 아이디에는 matches 파라미터가 보이지 않아요.`);
        }
      } else {
        if (containsMatches) {
          assert.fail(
            `트리거 '${id}' 아이디에 대한 정규식 캡처 그룹이 없는데도 matches 파라미터가 있어요.`,
          );
        }
      }
    }
  });

  it('올바른 아이디와 접두사를 갖고 있어요', () => {
    let prefix = null;
    let brokenPrefixes = false;
    // TODO: make this global to this file.
    const ids = new Set();

    for (const set of [triggerSet.triggers, triggerSet.timelineTriggers]) {
      if (!set)
        continue;
      for (const trigger of set) {
        if (!trigger.id) {
          assert.fail(`${trigger.regex?.source ?? '???'} 트리거에 아이디 필드가 없어요`);
          continue;
        }

        // Triggers must be unique.
        if (ids.has(trigger.id))
          assert.fail(`중복된 아이디: '${trigger.id}`);

        ids.add(trigger.id);

        // Only show one broken prefix per file.
        if (brokenPrefixes)
          continue;

        if (prefix === null) {
          prefix = trigger.id;
          continue;
        }

        // Find common prefix.
        let idx = 0;
        const len = Math.min(prefix.length, trigger.id.length);
        for (idx = 0; idx < len; ++idx) {
          if (prefix[idx] !== trigger.id[idx])
            break;
        }
        if (idx === 0) {
          assert.fail(`${file}: 잘못된 아이디 접두사 '${prefix}' 와 '${trigger.id}'`);
          brokenPrefixes = true;
          continue;
        }
        prefix = prefix.slice(0, idx);
      }
    }

    // If there's at least two ids, then the prefix must be a full word.
    // e.g. you can have two triggers like "Prefix Thing 1" and "Prefix Thing 2"
    // you cannot have two triggers like "O4N Thing 1" and "O4S Thing 2",
    // as the prefix "O4" is not a full word (and have a space after it,
    // as "Prefix " does.  This is a bit rigid, but prevents many typos.
    if (ids.size > 1 && !brokenPrefixes && prefix !== null && prefix.length > 0) {
      // if prefix includes more than one word, just remove latter letters.
      if (prefix.includes(' '))
        prefix = prefix.slice(0, prefix.lastIndexOf(' ') + 1);
      if (!prefix.endsWith(' '))
        assert.fail(`아아디 접두사 '${prefix}' 이 것은 완전한 단어가 아녜요. 반드시 공백으로 끝나야 해요`);
    }
  });

  it('전역 유니크 트리거 아이디들을 갖고 있어요', () => {
    for (const set of [triggerSet.triggers, triggerSet.timelineTriggers]) {
      if (!set)
        continue;
      for (const trigger of set) {
        // warned elsewhere
        const id = trigger.id;
        if (id === undefined)
          continue;

        const prevFile = info.triggerId[id];
        if (prevFile === undefined) {
          info.triggerId[id] = file;
          continue;
        }
        assert.fail(`트리거 아이디가 충돌: ${id} 아이디는 이미 사용 중이예요: ${prevFile}`);
      }
    }
  });

  it('does not combine response with texts', () => {
    const bannedItems: (keyof LooseTrigger)[] = [
      'alarmText',
      'alertText',
      'infoText',
      'tts',
    ];

    for (
      const { name, set } of [
        { name: 'triggers', set: triggerSet.triggers },
        { name: 'timelineTriggers', set: triggerSet.timelineTriggers },
      ]
    ) {
      if (!set)
        continue;
      for (const [index, trigger] of set.entries()) {
        const id = trigger.id ?? `${name}[${index}]`;
        if (!trigger.response)
          continue;
        for (const item of bannedItems) {
          if (item in trigger)
            assert.fail(`${id} 함께 사용할 수 없어요: 'response', '${item}'`);
        }
      }
    }
  });

  it('정렬된 트리거 필드를 갖고 있어요', () => {
    // This is the order in which they are run.
    const triggerOrder: (keyof LooseTrigger | keyof LooseTimelineTrigger)[] = [
      'id',
      'type',
      'disabled',
      'netRegex',
      // Other netRegexes are not important in ordering.
      'regex',
      // Other regexes are not important in ordering.
      'beforeSeconds',
      'condition',
      'preRun',
      'delaySeconds',
      'durationSeconds',
      'suppressSeconds',
      // This is where the delay happens.
      'promise',
      // This is where the promise delay happens.
      'sound',
      'soundVolume',
      'response',
      'alarmText',
      'alertText',
      'infoText',
      'tts',
      'run',
      'outputStrings',
    ];

    for (
      const { name, set } of [
        { name: 'triggers', set: triggerSet.triggers },
        { name: 'timelineTriggers', set: triggerSet.timelineTriggers },
      ]
    ) {
      if (!set)
        continue;
      for (const [index, trigger] of set.entries()) {
        const id = trigger.id ?? `${name}[${index}]`;

        let lastIdx = -1;

        const keys = Object.keys(trigger);

        for (const field of triggerOrder) {
          if (!(field in trigger))
            continue;

          const thisIdx = keys.indexOf(field);
          if (thisIdx === -1)
            continue;
          if (thisIdx <= lastIdx) {
            assert.fail(
              `in ${id}, field '${keys[lastIdx] ?? '???'}' must precede '${
                keys[thisIdx] ?? '???'
              }'`,
            );
          }

          lastIdx = thisIdx;
        }
      }
    }
  });

  it('올바른 타임라인 트리거 정규식을 갖고 있어요', () => {
    if (!triggerSet.timelineTriggers)
      return;

    for (const [index, trigger] of triggerSet.timelineTriggers.entries()) {
      const id = trigger.id ?? `timelineTriggers[${index}]`;
      for (const key in trigger) {
        // regex is the only valid regular expression field on a timeline trigger.
        if (key === 'regex')
          continue;
        if (key === 'netRegex')
          assert.fail(`in ${id}, invalid field '${key}' in timelineTrigger`);
      }
    }
  });

  it('올바른 지역 아이디를 갖고 있어요', () => {
    if (!('zoneId' in triggerSet))
      assert.fail(`missing zone id`);
    else if (typeof triggerSet.zoneId === 'undefined')
      assert.fail(`unknown zone id`);

    if ('zoneRegex' in triggerSet)
      assert.fail(`use zoneId instead of zoneRegex`);
  });

  class TestOutputProxy {
    constructor(trigger: LooseTrigger, responseOutputStrings: OutputStrings) {
      return new Proxy(this, {
        get(_target, _name) {
          // We can't validate all possible paths from the trigger,
          // so always succeed here and we'll validate later.
          return () => '';
        },
        set(_target, property: string, value): boolean {
          if (property === 'responseOutputStrings') {
            // The normal output proxy assigns here, but we want to keep the same
            // object so we can inspect it outside the proxy.
            Object.assign(responseOutputStrings, value);
            return true;
          }

          assert.fail(`Trigger ${trigger.id ?? '???'} set invalid '${property}' on output.`);
          return false;
        },
      });
    }
  }

  // responses_test.js will handle testing any response with builtInResponseStr.
  // triggers using `response:` otherwise cannot be tested, because we cannot
  // safely call the response function.
  it('올바른 output strings를 갖고 있어요', () => {
    for (const set of [triggerSet.triggers, triggerSet.timelineTriggers]) {
      if (!set)
        continue;
      for (const [index, trigger] of set.entries()) {
        const id = trigger.id ?? `triggers[${index}]`;

        let outputStrings: OutputStrings = {};
        let response = {};
        if (trigger.response) {
          // Triggers using responses should include the outputStrings in the
          // response func itself, via `output.responseOutputStrings = {};`
          if (trigger.outputStrings) {
            assert.fail(`'response' 와 'outputStrings 둘 다 갖고 있어요: '${id}'.`);
            continue;
          }
          if (typeof trigger.response !== 'function')
            continue;
          const funcStr = trigger.response.toString();
          if (!funcStr.includes(builtInResponseStr)) {
            assert.fail(
              `'${id}' 빌트인 response를  포함하고 있지 않아요: "${builtInResponseStr}".`,
            );
            continue;
          }

          const output = new TestOutputProxy(trigger, outputStrings) as Output;
          const responseFunc = trigger.response;
          if (isResponseFunc(responseFunc)) {
            // Call the function to get the outputStrings.
            const data = getFakeRaidbossData(triggerSet);
            response = responseFunc(data, {}, output) ?? {};

            if (typeof outputStrings !== 'object') {
              assert.fail(`'${id}' 빌트인 response는 outputStrings를 설정하지 않아요.`);
              continue;
            }
          }
        } else {
          if (trigger.outputStrings && typeof outputStrings !== 'object') {
            assert.fail(`'${id}' outputStrings는 오브젝트여야 해요.`);
            continue;
          }
          if (typeof trigger.outputStrings !== 'object') {
            for (const func of triggerTextOutputFunctions) {
              if (func in trigger) {
                assert.fail(`'${id}' outputStrings 필드를 찾을 수 없어요.`);
                break;
              }
            }
            // If no output functions and no output strings, then no error and nothing left to do.
            continue;
          }
          outputStrings = trigger.outputStrings;
        }

        // TODO: should we prevent `output['phrase with spaces']()` style constructions?
        // TODO: should we restrict outputStrings keys to valid variable characters?
        // TODO: should we prevent built in responses from returning other Response functions?

        // TODO: share this with popup-text.js?
        const paramRegex = /\${\s*([^}\s]+)\s*}/g;

        // key => [] of params
        const outputStringsParams: { [key: string]: string[] } = {};

        // For each outputString, find and validate all of the parameters.
        for (const [key, templateObjOrig] of Object.entries(outputStrings)) {
          let templateObj = templateObjOrig;
          if (typeof templateObj === 'string') {
            // Strings are acceptable as output strings, but convert to a translatable object
            // to make the rest of the code simpler.
            templateObj = { en: templateObj };
          }
          if (typeof templateObj !== 'object') {
            assert.fail(`'${id}'의 키 '${key}'의 outputStrings은 번역할 수 없는 오브젝트예요`);
            continue;
          }

          // All languages must have the same set of params.
          for (const [lang, template] of Object.entries(templateObj)) {
            if (typeof template !== 'string') {
              assert.fail(
                `'${id}'의 키 '${key}'의 outputStrings에 문자열이 아닌게 있어요: ${lang}`,
              );
              continue;
            }

            // Build params with a set for uniqueness, but store as an array later for ease of use.
            const params = new Set<string>();
            template.replace(paramRegex, (fullMatch, key: string) => {
              params.add(key);
              return fullMatch;
            });

            // If this is not the first lang, validate it has the same params as previous languages.
            /*
            if (key in outputStringsParams) {
              // prevParams is an array, params is a set.
              const prevParams = outputStringsParams[key];
              let ok = false;
              if (prevParams?.length === params.size)
                ok = prevParams.every((key) => params.has(key));

              if (!ok) {
                assert.fail(
                  `'${key}' in '${id}' outputStrings has inconsistent params among languages`,
                );
                continue;
              }
            }
            */
            outputStringsParams[key] = [...params];

            // Verify that there's no dangling ${
            if (/\${/.test(template.replace(paramRegex, ''))) {
              assert.fail(
                `'${id}'의 키 '${key}'의 outputStrings은 열리기만 했어요 \${ 닫혀있지 않아요 }`,
              );
            }
          }
        }

        const usedOutputStringEntries = new Set();

        // Detects uses of `output[variable]()` which could be anything.
        let dynamicOutputStringAccess = false;

        // Now, we have an optional |outputStrings| and an optional |response|.
        // Verify that any function in |trigger| or |response| using |output|
        // has a corresponding key in |outputStrings|.  But hackily.
        const obj = Object.assign({}, trigger, response);
        for (const objValue of Object.values(obj)) {
          const func: unknown = objValue;
          if (typeof func !== 'function')
            continue;
          const funcStr = func.toString();
          const keys: string[] = [];

          dynamicOutputStringAccess = dynamicOutputStringAccess ||
            /(?:\boutput\[|\boutput[^.\r\n])/.test(funcStr);

          // Validate that any calls to output.word() have a corresponding outputStrings entry.
          funcStr.replace(/\boutput\.(\w*)\(/g, (fullMatch: string, key: string) => {
            if (outputStrings[key] === undefined) {
              assert.fail(`missing key '${key}' in '${id}' outputStrings`);
              return fullMatch;
            }
            usedOutputStringEntries.add(key);
            keys.push(key);
            return fullMatch;
          });

          for (const key of keys) {
            for (const param of outputStringsParams[key] ?? []) {
              if (!Regexes.parse(`\\b${param}\\s*:`).exec(funcStr)) {
                assert.fail(
                  `'${id}' does not define param '${param}' for outputStrings entry '${key}'`,
                );
              }
            }
          }
        }

        // Responses can have unused output strings in some cases, such as ones
        // that work with and without matching.
        if (!dynamicOutputStringAccess) {
          for (const key in outputStrings) {
            if (!usedOutputStringEntries.has(key))
              assert.fail(`'${id}' has unused outputStrings entry '${key}'`);
          }
        }
      }
    }
  });

  it('올바른 타임라인 파일을 갖고 있어요', () => {
    if (triggerSet.timelineFile !== undefined) {
      const timelineFile = path.join(path.dirname(file), triggerSet.timelineFile);
      assert.isTrue(fs.existsSync(timelineFile), `${triggerSet.timelineFile} does not exist`);
    }
  });

  it('정규식 변환이 누락되어 있어요', () => {
    const translations = triggerSet.timelineReplace;
    if (!translations)
      return;

    for (const trans of translations) {
      const locale = trans.locale;
      if (!locale)
        continue;
      // English cannot be missing translations and is always a "partial" translation.
      if (locale === 'en')
        continue;

      if (trans.missingTranslations)
        continue;

      for (const [index, trigger] of triggerSet.triggers?.entries() ?? []) {
        const id = trigger.id ?? `triggers[${index}]`;

        if (trigger.netRegex === undefined)
          continue;

        if (trigger.type === undefined) {
          if (!(trigger.netRegex instanceof RegExp)) {
            assert.fail(
              `${id} 아이디는 'type' 프로퍼티와 RegExp netRegex를 갖고 있지 않아요`,
            );
          }
          continue;
        }

        if (!(trigger.netRegex instanceof RegExp)) {
          // plain object netRegex
          if (trigger.disabled)
            continue;

          const textHasTranslation = (text: string): boolean => {
            return translateWithReplacements(
              text,
              'replaceSync',
              locale,
              translations,
            ).wasTranslated;
          };

          const checkIfFieldHasTranslation = (
            field: string | readonly string[],
            fieldName: string,
          ) => {
            if (typeof field === 'string') {
              assert.isTrue(
                textHasTranslation(field),
                `${id}:로켈 ${locale}:타임라인 대체 항목을 갖고 있지 않아요: ${fieldName} '${field}'`,
              );
            } else {
              for (const s of field) {
                assert.isTrue(
                  textHasTranslation(s),
                  `${id}:로켈 ${locale}:타임라인 대체 항목을 갖고 있지 않아요: ${fieldName} '${s}'`,
                );
              }
            }
          };

          for (const key of keysThatRequireTranslation) {
            type AnonymousParams = {
              [name: string]: string | readonly string[] | boolean | undefined;
            };
            const anonTriggerFields: AnonymousParams = trigger.netRegex;
            const value = anonTriggerFields[key];
            if (value !== undefined && typeof value !== 'boolean')
              checkIfFieldHasTranslation(value, key);
          }

          continue;
        }

        const origRegex = trigger.netRegex?.source?.toLowerCase();
        if (origRegex === undefined)
          continue;

        if (!NetRegexes.doesNetRegexNeedTranslation(origRegex))
          continue;

        const wasTranslated = translateWithReplacements(
          origRegex,
          'replaceSync',
          locale,
          translations,
        ).wasTranslated;

        assert.isTrue(
          wasTranslated,
          `${id}:로캘 ${locale}:정규식용 타임라인 대체 항목을 갖고 있지 않아요 '${origRegex}'`,
        );
      }
    }
  });
};

type TriggerSetInfo = {
  // id -> filename map
  triggerSetId: { [id: string]: string };
  // id -> filename map
  triggerId: { [id: string]: string };
};

const testTriggerFiles = (triggerFiles: string[]): void => {
  const info: TriggerSetInfo = {
    triggerSetId: {},
    triggerId: {},
  };
  describe('trigger test', () => {
    for (const file of triggerFiles) {
      describe(`${file}`, () => testTriggerFile(file, info));
    }
  });
};

export default testTriggerFiles;
