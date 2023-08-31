module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'prevent syntax issues within timelineTriggers',
      category: 'Syntax Issues',
      recommended: true,
      url: 'https://github.com/quisquous/cactbot/blob/main/docs/RaidbossGuide.md#trigger-elements',
    },
    schema: [],
  },

  create: (context) => {
    return {
      'Property[key.name=\'timelineTriggers\'] > ArrayExpression > ObjectExpression > Property[key.name=\'regex\'] > :not(Identifier, Literal)':
        (node) =>
          context.report({
            node,
            message: 'timelineTrigger의 정규식은 리터럴이어야 해요. 예컨데 /^Ability Name$/ 처럼',
          }),
      'Property[key.name=\'timelineTriggers\'] > ArrayExpression > ObjectExpression > Property[key.name=/(?:netRegex.{0,2}|regex.{2})/]':
        (node) =>
          context.report({
            node,
            message: 'timelineTriggers는 오직 "정규식"만 지원해요',
          }),
    };
  },
};
