const { generateValidList, generateValidObject } = require('./eslint-utils');

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'suggest the triggerSet property order',
      category: 'Stylistic Issues',
      recommended: true,
      url:
        'https://github.com/OverlayPlugin/cactbot/blob/main/docs/RaidbossGuide.md#trigger-properties',
    },
    fixable: 'code',
    schema: [
      {
        'type': 'object',
        'properties': {
          'module': {
            'enum': ['raidboss'],
          },
        },
        'additionalProperties': false,
      },
    ],
    messages: {
      sortKeys:
        'Expected triggerSet properties ordered like {{expectedOrder}} (\'{{beforeKey}}\' should be before \'{{nextKey}}\')',
    },
  },
  create: (context) => {
    const raidbossOrderList = [
      'id',
      'zoneId',
      'config',
      'overrideTimelineFile',
      'timelineFile',
      'timeline',
      'resetWhenOutOfCombat',
      'initData',
      'timelineStyles',
      'timelineTriggers',
      'triggers',
      'timelineReplace',
    ];
    const optionModule = context.options[0] ? context.options[0].module : undefined;
    if (!optionModule || optionModule !== 'raidboss')
      return;
    const orderList = raidbossOrderList;
    return {
      'VariableDeclarator[id.name=\'triggerSet\'] > ObjectExpression': (node) => {
        const properties = node.properties;

        const validList = generateValidList(orderList, properties);

        if (validList.length >= 1) {
          const sourceCode = context.getSourceCode();
          validList.forEach((valid) => {
            context.report({
              node,
              loc: node.loc,
              messageId: 'sortKeys',
              data: {
                expectedOrder: `[${orderList.join(',')}]`,
                beforeKey: valid.beforeKey,
                nextKey: valid.nextKey,
              },
              fix: (fixer) => {
                const replacementText = generateValidObject(orderList, properties, sourceCode);
                if (replacementText)
                  return fixer.replaceTextRange(node.range, replacementText);
              },
            });
          });
        }
      },
    };
  },
};
