export const cactbotModules = {
  config: 'ui/config/config',
  coverage: 'util/coverage/coverage',
  eureka: 'ui/eureka/eureka',
  raidboss: 'ui/raidboss/raidboss',
  raidemulator: 'ui/raidboss/raidemulator',
  splitter: 'util/logtools/web_splitter',
  test: 'ui/test/test',
};

export const cactbotChunks = {
  raidbossData: 'ui/common/raidboss_data',
};

export const cactbotHtmlChunksMap = {
  'ui/config/config.html': {
    chunks: [
      cactbotChunks.raidbossData,
      cactbotModules.config,
    ],
  },
  'util/coverage/coverage.html': {
    chunks: [
      cactbotChunks.raidbossData,
      cactbotModules.coverage,
    ],
  },
  'ui/eureka/eureka.html': {
    chunks: [
      cactbotModules.eureka,
    ],
  },
  'ui/raidboss/raidboss.html': {
    chunks: [
      cactbotChunks.raidbossData,
      cactbotModules.raidboss,
    ],
  },
  'ui/raidboss/raidboss_alerts_only.html': {
    chunks: [
      cactbotChunks.raidbossData,
      cactbotModules.raidboss,
    ],
  },
  'ui/raidboss/raidboss_silent.html': {
    chunks: [
      cactbotChunks.raidbossData,
      cactbotModules.raidboss,
    ],
  },
  'ui/raidboss/raidboss_timeline_only.html': {
    chunks: [
      cactbotChunks.raidbossData,
      cactbotModules.raidboss,
    ],
  },
  'ui/raidboss/raidemulator.html': {
    chunks: [
      cactbotChunks.raidbossData,
      cactbotModules.raidemulator,
    ],
  },
  'ui/test/test.html': {
    chunks: [
      cactbotModules.test,
    ],
  },
  'util/logtools/splitter.html': {
    chunks: [
      cactbotModules.splitter,
    ],
  },
};
