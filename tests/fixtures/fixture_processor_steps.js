'use strict';

const delay = require('./delay');

module.exports = async function (job) {
  let step = job.data.step;
  while (step !== 'FINISH') {
    switch (step) {
      case 'INITIAL': {
        await delay(200);
        await job.updateData({
          ...job.data,
          step: 'SECOND',
          extraDataSecondStep: 'second data',
        });
        step = 'SECOND';
        break;
      }
      case 'SECOND': {
        await delay(200);
        await job.updateData({
          ...job.data,
          extraDataFinishedStep: 'finish data',
          step: 'FINISH',
        });
        step = 'FINISH';
        return;
      }
      default: {
        throw new Error('invalid step');
      }
    }
  }
};
