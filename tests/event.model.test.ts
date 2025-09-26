/**
 * @fileoverview Tests for EventModel resolution and query helpers
 */

import type { Model } from 'mongoose';
import mongoose from 'mongoose';
import sinon from 'sinon';
import { describe, it, afterEach, assert } from 'poku';
import type { Event } from '@validators/event.validator';
import { EventModel } from '@models/event.model';

describe('EventModel resolveModel', () => {
  afterEach(() => {
    sinon.restore();
    delete (mongoose.models as Record<string, unknown>).Event;
  });

  it('creates model when not previously registered', () => {
    delete (mongoose.models as Record<string, unknown>).Event;
    const fakeModel = {} as Model<Event>;
    const modelSpy = sinon.stub(mongoose, 'model').returns(fakeModel);

    const instance = new EventModel();

    assert.ok(instance);
    assert.strictEqual(modelSpy.calledWith('Event'), true);
  });
});

describe('EventModel findAll', () => {
  afterEach(() => {
    sinon.restore();
  });

  const buildModelStub = () => {
    const query: any = {};
    query.skip = sinon.stub().returns(query);
    query.limit = sinon.stub().returns(query);
    query.sort = sinon.stub().returns(query);
    query.select = sinon.stub().returns(query);
    query.lean = sinon.stub().returns(query);
    query.exec = sinon.stub().resolves([]);

    const countExec = sinon.stub().resolves(0);

    const model = {
      find: sinon.stub().returns(query),
      countDocuments: sinon.stub().returns({ exec: countExec }),
    } as unknown as Model<Event>;

    return { model, query, countExec };
  };

  it('applies sort when query contains sortBy', async () => {
    const { model, query } = buildModelStub();
    const eventModel = new EventModel(model);

    await eventModel.findAll({ sortBy: 'cantidad', sortOrder: 'desc' });

    assert.strictEqual(query.sort.calledWith({ cantidad: -1 }), true);
  });

  it('omits sort when query does not include sortBy', async () => {
    const { model, query } = buildModelStub();
    const eventModel = new EventModel(model);

    await eventModel.findAll();

    assert.strictEqual(query.sort.called, false);
  });
});
