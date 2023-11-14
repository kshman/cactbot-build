export const cactbotModules = {
  config: 'ui/config/config',
  coverage: 'util/coverage/coverage',
  eureka: 'ui/eureka/eureka',
  oopsyraidsyLive: 'ui/oopsyraidsy/oopsy_live',
  oopsyraidsySummary: 'ui/oopsyraidsy/oopsy_summary',
  oopsyraidsyViewer: 'ui/oopsyraidsy/oopsy_viewer',
  raidboss: 'ui/raidboss/raidboss',
  raidemulator: 'ui/raidboss/raidemulator',
  splitter: 'util/logtools/web_splitter',
  test: 'ui/test/test',
};

export const cactbotChunks = {
  raidbossData: 'ui/common/raidboss_data',
  oopsyraidsyData: 'ui/common/oopsyraidsy_data',
};

export const cactbotHtmlChunksMap = {
  'ui/config/config.html': {
    chunks: [
      cactbotChunks.raidbossData,
      cactbotChunks.oopsyraidsyData,
      cactbotModules.config,
    ],
  },
  'util/coverage/coverage.html': {
    chunks: [
      cactbotChunks.raidbossData,
      cactbotChunks.oopsyraidsyData,
      cactbotModules.coverage,
    ],
  },
  'ui/eureka/eureka.html': {
    chunks: [
      cactbotModules.eureka,
    ],
  },
  'ui/oopsyraidsy/oopsy_summary.html': {
    chunks: [
      cactbotChunks.oopsyraidsyData,
      cactbotModules.oopsyraidsySummary,
    ],
  },
  'ui/oopsyraidsy/oopsy_viewer.html': {
    chunks: [
      cactbotChunks.oopsyraidsyData,
      cactbotModules.oopsyraidsyViewer,
    ],
  },
  'ui/oopsyraidsy/oopsyraidsy.html': {
    chunks: [
      cactbotChunks.oopsyraidsyData,
      cactbotModules.oopsyraidsyLive,
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
