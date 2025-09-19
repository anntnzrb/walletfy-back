/**
 * @fileoverview Tests for EventModel resolution and query helpers
 */

import type { Model } from 'mongoose';
import type { Event } from '../src/validators/event.validator';

describe('EventModel resolveModel', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('mongoose');
  });

  it('creates model when not previously registered', async () => {
    const actualMongoose = jest.requireActual('mongoose');
    const mongooseDefault = actualMongoose.default ?? actualMongoose;
    const modelSpy = jest.fn();

    jest.resetModules();
    jest.doMock('mongoose', () => ({
      __esModule: true,
      ...actualMongoose,
      default: { ...mongooseDefault, models: {}, model: modelSpy },
      models: {},
      model: modelSpy,
      connection: { ...mongooseDefault.connection, readyState: 0 },
      STATES: mongooseDefault.STATES,
      connect: mongooseDefault.connect,
      disconnect: mongooseDefault.disconnect,
      Schema: mongooseDefault.Schema,
    }));

    const module = await import('../src/models/event.model');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const model = module.eventModel;

    expect(modelSpy).toHaveBeenCalledWith('Event', expect.anything());
  });
});

describe('EventModel findAll', () => {
  const buildModelStub = () => {
    const query: any = {};
    query.skip = jest.fn().mockReturnValue(query);
    query.limit = jest.fn().mockReturnValue(query);
    query.sort = jest.fn().mockReturnValue(query);
    query.select = jest.fn().mockReturnValue(query);
    query.lean = jest.fn().mockReturnValue(query);
    query.exec = jest.fn().mockResolvedValue([]);

    const countExec = jest.fn().mockResolvedValue(0);

    const model = {
      find: jest.fn().mockReturnValue(query),
      countDocuments: jest.fn().mockReturnValue({ exec: countExec }),
    } as unknown as Model<Event>;

    return { model, query, countExec };
  };

  it('applies sort when query contains sortBy', async () => {
    const { EventModel } = await import('../src/models/event.model');
    const { model, query } = buildModelStub();
    const eventModel = new EventModel(model);

    await eventModel.findAll({ sortBy: 'cantidad', sortOrder: 'desc' });

    expect(query.sort).toHaveBeenCalledWith({ cantidad: -1 });
  });

  it('omits sort when query does not include sortBy', async () => {
    const { EventModel } = await import('../src/models/event.model');
    const { model, query } = buildModelStub();
    const eventModel = new EventModel(model);

    await eventModel.findAll();

    expect(query.sort).not.toHaveBeenCalled();
  });
});
