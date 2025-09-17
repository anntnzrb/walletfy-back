/**
 * @fileoverview Tests for repository model resolution logic
 */

import type { Model } from 'mongoose';
import type { Event } from '../src/api/events/event.schema';

describe('EventRepository resolveModel', () => {
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

    const module = await import('../src/api/events/event.repository');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const repository = module.eventRepository;

    expect(modelSpy).toHaveBeenCalledWith('Event', expect.anything());
  });
});

describe('EventRepository findAll', () => {
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
    const { EventRepository } = await import('../src/api/events/event.repository');
    const { model, query } = buildModelStub();
    const repository = new EventRepository(model);

    await repository.findAll({ sortBy: 'cantidad', sortOrder: 'desc' });

    expect(query.sort).toHaveBeenCalledWith({ cantidad: -1 });
  });

  it('omits sort when query does not include sortBy', async () => {
    const { EventRepository } = await import('../src/api/events/event.repository');
    const { model, query } = buildModelStub();
    const repository = new EventRepository(model);

    await repository.findAll();

    expect(query.sort).not.toHaveBeenCalled();
  });
});
