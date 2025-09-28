/**
 * @fileoverview Tests for UserModel authentication methods
 */

import type { Model } from 'mongoose';
import mongoose from 'mongoose';
import sinon from 'sinon';
import bcrypt from 'bcryptjs';
import { describe, it, beforeEach, afterEach, assert } from 'poku';
import type { User } from '@validators/auth.validator';
import { UserModel } from '@models/user.model';

describe('UserModel', () => {
  let userModel: UserModel;
  let modelStub: sinon.SinonStubbedInstance<Model<User>>;

  beforeEach(() => {
    modelStub = {
      create: sinon.stub(),
      findOne: sinon.stub(),
      countDocuments: sinon.stub(),
    } as any;

    userModel = new UserModel(modelStub as any);
  });

  afterEach(() => {
    sinon.restore();
    delete (mongoose.models as Record<string, unknown>).User;
  });

  describe('create', () => {
    it('creates user with hashed password and UUID', async () => {
      const userData = { username: 'testuser', password: 'password123' };
      const createdUser = {
        id: 'uuid-123',
        username: 'testuser',
        password: 'hashed_password',
        createdAt: new Date(),
        toObject: sinon.stub().returns({
          id: 'uuid-123',
          username: 'testuser',
          createdAt: new Date(),
        }),
      };

      modelStub.create.resolves(createdUser as any);

      const result = await userModel.create(userData);

      assert.strictEqual(modelStub.create.calledOnce, true);
      const createArgs = modelStub.create.firstCall.args[0];
      assert.strictEqual(createArgs.username, 'testuser');
      assert.strictEqual(createArgs.password, 'password123');
      assert.ok(createArgs.id);
      assert.ok(createArgs.createdAt);
      assert.strictEqual(result.username, 'testuser');
      assert.strictEqual(result.id, 'uuid-123');
    });
  });

  describe('findByUsername', () => {
    it('finds user by username including password', async () => {
      const user = {
        id: 'uuid-123',
        username: 'testuser',
        password: 'hashed_password',
        createdAt: new Date(),
      };

      const queryStub = {
        select: sinon.stub().returnsThis(),
        lean: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves(user),
      };

      modelStub.findOne.returns(queryStub as any);

      const result = await userModel.findByUsername('testuser');

      assert.strictEqual(
        modelStub.findOne.calledWith({ username: 'testuser' }),
        true,
      );
      assert.strictEqual(queryStub.select.calledWith({ _id: 0 }), true);
      assert.deepStrictEqual(result, user);
    });

    it('returns null when user not found', async () => {
      const queryStub = {
        select: sinon.stub().returnsThis(),
        lean: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves(null),
      };

      modelStub.findOne.returns(queryStub as any);

      const result = await userModel.findByUsername('nonexistent');

      assert.strictEqual(result, null);
    });
  });

  describe('findById', () => {
    it('finds user by id excluding password', async () => {
      const user = {
        id: 'uuid-123',
        username: 'testuser',
        createdAt: new Date(),
      };

      const queryStub = {
        select: sinon.stub().returnsThis(),
        lean: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves(user),
      };

      modelStub.findOne.returns(queryStub as any);

      const result = await userModel.findById('uuid-123');

      assert.strictEqual(
        modelStub.findOne.calledWith({ id: 'uuid-123' }),
        true,
      );
      assert.strictEqual(
        queryStub.select.calledWith({ _id: 0, password: 0 }),
        true,
      );
      assert.deepStrictEqual(result, user);
    });
  });

  describe('validateCredentials', () => {
    it('returns user when credentials are valid', async () => {
      const user = {
        id: 'uuid-123',
        username: 'testuser',
        password: 'hashed_password',
        createdAt: new Date(),
      };

      const queryStub = {
        select: sinon.stub().returnsThis(),
        lean: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves(user),
      };

      modelStub.findOne.returns(queryStub as any);

      const bcryptStub = sinon.stub(bcrypt, 'compare').resolves(true);

      const result = await userModel.validateCredentials({
        username: 'testuser',
        password: 'password123',
      });

      assert.strictEqual(
        bcryptStub.calledWith('password123', 'hashed_password'),
        true,
      );
      assert.deepStrictEqual(result, user);
    });

    it('returns null when password is invalid', async () => {
      const user = {
        id: 'uuid-123',
        username: 'testuser',
        password: 'hashed_password',
        createdAt: new Date(),
      };

      const queryStub = {
        select: sinon.stub().returnsThis(),
        lean: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves(user),
      };

      modelStub.findOne.returns(queryStub as any);

      const bcryptStub = sinon.stub(bcrypt, 'compare').resolves(false);

      const result = await userModel.validateCredentials({
        username: 'testuser',
        password: 'wrongpassword',
      });

      assert.strictEqual(
        bcryptStub.calledWith('wrongpassword', 'hashed_password'),
        true,
      );
      assert.strictEqual(result, null);
    });

    it('returns null when user does not exist', async () => {
      const queryStub = {
        select: sinon.stub().returnsThis(),
        lean: sinon.stub().returnsThis(),
        exec: sinon.stub().resolves(null),
      };

      modelStub.findOne.returns(queryStub as any);

      const result = await userModel.validateCredentials({
        username: 'nonexistent',
        password: 'password123',
      });

      assert.strictEqual(result, null);
    });
  });

  describe('existsByUsername', () => {
    it('returns true when user exists', async () => {
      const countStub = {
        exec: sinon.stub().resolves(1),
      };

      modelStub.countDocuments.returns(countStub as any);

      const result = await userModel.existsByUsername('testuser');

      assert.strictEqual(
        modelStub.countDocuments.calledWith({ username: 'testuser' }),
        true,
      );
      assert.strictEqual(result, true);
    });

    it('returns false when user does not exist', async () => {
      const countStub = {
        exec: sinon.stub().resolves(0),
      };

      modelStub.countDocuments.returns(countStub as any);

      const result = await userModel.existsByUsername('nonexistent');

      assert.strictEqual(result, false);
    });
  });
});
