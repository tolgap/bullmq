import { expect } from 'chai';
import { default as IORedis } from 'ioredis';
import { Job, Queue, Worker } from '../src/classes';
import { beforeEach, before, after as afterAll, it } from 'mocha';
import { v4 } from 'uuid';
import { removeAllQueueData } from '../src/utils';

describe.only('sandbox step pattern', () => {
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const prefix = process.env.BULLMQ_TEST_PREFIX || 'bull';
  let queue: Queue;
  let queueName: string;

  let connection;
  before(async function () {
    connection = new IORedis(redisHost, { maxRetriesPerRequest: null });
  });

  beforeEach(async function () {
    queueName = `test-${v4()}`;
    queue = new Queue(queueName, { connection, prefix });
  });

  afterEach(async function () {
    await queue.close();
    await removeAllQueueData(new IORedis(), queueName);
  });

  afterAll(async function () {
    await connection.quit();
  });

  it('should process steps and complete', async () => {
    const processFile = __dirname + '/fixtures/fixture_processor_steps.js';

    const worker = new Worker(queueName, processFile, {
      connection,
      prefix,
      drainDelay: 1,
    });

    const completing = new Promise<void>((resolve, reject) => {
      worker.on('completed', async (job: Job) => {
        try {
          expect(job.data).to.be.eql({
            step: 'FINISH',
            extraDataSecondStep: 'second data',
            extraDataFinishedStep: 'finish data',
          });
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });

    await queue.add('test', { step: 'INITIAL' });

    await completing;

    await worker.close();
  });
});
