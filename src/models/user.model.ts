/**
 * @fileoverview User model layer backed by MongoDB using mongoose
 */

import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import type { User, CreateUser, LoginUser } from '@validators/auth.validator';

/** Hydrated mongoose document representing a User */
type UserDocument = HydratedDocument<User>;

/**
 * Mongoose schema definition for User authentication
 */
const userSchema = new Schema<User>(
  {
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
    toObject: {
      transform: (
        _doc,
        ret: User & { _id?: unknown },
      ): Omit<User, 'password'> => {
        delete ret._id;
        delete (ret as { password?: string }).password;
        return ret as Omit<User, 'password'>;
      },
    },
  },
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
    return;
  }

  const saltRounds = 10;
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// Add indexes for optimal query performance
userSchema.index({ username: 1 });

const resolveModel = (): Model<User> => {
  return (
    (mongoose.models.User as Model<User> | undefined) ??
    mongoose.model<User>('User', userSchema)
  );
};

/**
 * Model providing CRUD operations for User entities stored in MongoDB
 */
export class UserModel {
  private readonly model: Model<User>;

  /**
   * @param model Optional mongoose model (exposed for testing)
   */
  constructor(model: Model<User> = resolveModel()) {
    this.model = model;
  }

  /**
   * Creates a new user with hashed password
   */
  async create(userData: CreateUser): Promise<Omit<User, 'password'>> {
    const userToCreate: User = {
      id: uuidv4(),
      username: userData.username,
      password: userData.password,
      createdAt: new Date(),
    };

    const createdDoc: UserDocument = await this.model.create(userToCreate);
    return createdDoc.toObject<Omit<User, 'password'>>();
  }

  /**
   * Finds user by username including password for authentication
   */
  async findByUsername(username: string): Promise<User | null> {
    const user = await this.model
      .findOne({ username })
      .select({ _id: 0 })
      .lean()
      .exec();

    return user as User | null;
  }

  /**
   * Finds user by ID excluding password
   */
  async findById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.model
      .findOne({ id })
      .select({ _id: 0, password: 0 })
      .lean()
      .exec();

    return user as Omit<User, 'password'> | null;
  }

  /**
   * Validates user credentials
   */
  async validateCredentials(loginData: LoginUser): Promise<User | null> {
    const user = await this.findByUsername(loginData.username);
    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(
      loginData.password,
      user.password,
    );
    return isPasswordValid ? user : null;
  }

  /**
   * Checks if username already exists
   */
  async existsByUsername(username: string): Promise<boolean> {
    const count = await this.model.countDocuments({ username }).exec();
    return count > 0;
  }
}

/**
 * Singleton UserModel instance used across controllers
 */
export const userModel = new UserModel();
