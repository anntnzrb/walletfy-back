/**
 * @fileoverview Tests for repository model resolution logic
 */

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
