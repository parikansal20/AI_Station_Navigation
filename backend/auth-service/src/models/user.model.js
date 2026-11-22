const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 1. Define Mongoose Schema
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: [
        'user',
        'admin',
        'subadmin_coolie',
        'subadmin_golfcart',
        'subadmin_emergency',
        'subadmin_complaints',
        'operator',
        'staff'
      ],
      default: 'user'
    },
    refreshTokens: [{ type: String }]
  },
  {
    timestamps: true
  }
);

// Virtual for id getter
UserSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    delete ret.refreshTokens;
    return ret;
  }
});

UserSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const MongooseUser = mongoose.models.User || mongoose.model('User', UserSchema);

// In-Memory Fallback store if MongoDB is not connected
const memoryUsers = [];
const memoryRefreshTokens = new Map();

const isMongoConnected = () => mongoose.connection.readyState === 1;

function sanitizeDoc(doc) {
  if (!doc) return null;
  if (typeof doc.toObject === 'function') {
    return doc.toObject();
  }
  return doc;
}

class UserModel {
  /**
   * Seed default system accounts (Super Admin, Sub-Admins, Normal User)
   */
  static async seedDefaults() {
    const defaultAccounts = [
      {
        name: 'SAARTHI Master Station Admin',
        email: 'admin@saarthi.gov.in',
        password: 'Admin@123',
        role: 'admin'
      },
      {
        name: 'Coolie Assistance Sub-Admin',
        email: 'coolie.admin@saarthi.gov.in',
        password: 'Coolie@123',
        role: 'subadmin_coolie'
      },
      {
        name: 'Golf Cart Service Sub-Admin',
        email: 'golfcart.admin@saarthi.gov.in',
        password: 'Golfcart@123',
        role: 'subadmin_golfcart'
      },
      {
        name: 'Emergency Response Sub-Admin',
        email: 'emergency.admin@saarthi.gov.in',
        password: 'Emergency@123',
        role: 'subadmin_emergency'
      },
      {
        name: 'Grievance & Complaints Sub-Admin',
        email: 'complaints.admin@saarthi.gov.in',
        password: 'Complaints@123',
        role: 'subadmin_complaints'
      },
      {
        name: 'Passenger User',
        email: 'user@saarthi.gov.in',
        password: 'User@123',
        role: 'user'
      }
    ];

    if (isMongoConnected()) {
      for (const acc of defaultAccounts) {
        const count = await MongooseUser.countDocuments({ email: acc.email.toLowerCase() });
        if (count === 0) {
          const salt = await bcrypt.genSalt(10);
          const passwordHash = await bcrypt.hash(acc.password, salt);
          await MongooseUser.create({
            name: acc.name,
            email: acc.email.toLowerCase(),
            passwordHash,
            role: acc.role
          });
        }
      }
    } else {
      if (memoryUsers.length >= defaultAccounts.length) return;
      for (const acc of defaultAccounts) {
        const exists = memoryUsers.find((u) => u.email === acc.email.toLowerCase());
        if (!exists) {
          const salt = await bcrypt.genSalt(10);
          const passwordHash = await bcrypt.hash(acc.password, salt);
          memoryUsers.push({
            id: `usr_seed_${acc.role}_01`,
            name: acc.name,
            email: acc.email.toLowerCase(),
            passwordHash,
            role: acc.role,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
    }
  }

  static async findByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();

    if (isMongoConnected()) {
      const doc = await MongooseUser.findOne({ email: cleanEmail });
      return sanitizeDoc(doc);
    }
    return memoryUsers.find((u) => u.email.toLowerCase() === cleanEmail) || null;
  }

  static async findById(id) {
    if (!id) return null;

    if (isMongoConnected()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        const docByCustomId = await MongooseUser.findOne({ email: id.toLowerCase() });
        return sanitizeDoc(docByCustomId);
      }
      const doc = await MongooseUser.findById(id);
      return sanitizeDoc(doc);
    }
    return memoryUsers.find((u) => u.id === id) || null;
  }

  static async create({ name, email, passwordHash, role = 'user' }) {
    if (isMongoConnected()) {
      const newUser = await MongooseUser.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role
      });
      return sanitizeDoc(newUser);
    }

    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role || 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    memoryUsers.push(newUser);
    return newUser;
  }

  static async update(id, { name, email, role }) {
    if (isMongoConnected()) {
      const updates = {};
      if (name) updates.name = name.trim();
      if (email) updates.email = email.toLowerCase().trim();
      if (role) updates.role = role;

      const doc = await MongooseUser.findByIdAndUpdate(id, { $set: updates }, { new: true });
      return sanitizeDoc(doc);
    }

    const index = memoryUsers.findIndex((u) => u.id === id);
    if (index === -1) return null;
    if (name) memoryUsers[index].name = name.trim();
    if (email) memoryUsers[index].email = email.toLowerCase().trim();
    if (role) memoryUsers[index].role = role;
    memoryUsers[index].updatedAt = new Date().toISOString();
    return memoryUsers[index];
  }

  static async updatePassword(id, newPasswordHash) {
    if (isMongoConnected()) {
      await MongooseUser.findByIdAndUpdate(id, { $set: { passwordHash: newPasswordHash } });
      return true;
    }

    const user = memoryUsers.find((u) => u.id === id);
    if (!user) return false;
    user.passwordHash = newPasswordHash;
    user.updatedAt = new Date().toISOString();
    return true;
  }

  static async getAll() {
    if (isMongoConnected()) {
      const docs = await MongooseUser.find({});
      return docs.map((doc) => {
        const obj = doc.toObject();
        delete obj.passwordHash;
        delete obj.refreshTokens;
        return obj;
      });
    }
    return memoryUsers.map(({ passwordHash, ...userWithoutPassword }) => userWithoutPassword);
  }

  static async delete(id) {
    if (isMongoConnected()) {
      const res = await MongooseUser.findByIdAndDelete(id);
      return !!res;
    }

    const index = memoryUsers.findIndex((u) => u.id === id);
    if (index === -1) return false;
    memoryUsers.splice(index, 1);
    memoryRefreshTokens.delete(id);
    return true;
  }

  // Refresh token management
  static async saveRefreshToken(userId, token) {
    if (isMongoConnected() && mongoose.Types.ObjectId.isValid(userId)) {
      await MongooseUser.findByIdAndUpdate(userId, { $addToSet: { refreshTokens: token } });
      return;
    }

    if (!memoryRefreshTokens.has(userId)) {
      memoryRefreshTokens.set(userId, new Set());
    }
    memoryRefreshTokens.get(userId).add(token);
  }

  static async hasRefreshToken(userId, token) {
    if (isMongoConnected() && mongoose.Types.ObjectId.isValid(userId)) {
      const user = await MongooseUser.findById(userId);
      if (!user) return false;
      return user.refreshTokens && user.refreshTokens.includes(token);
    }

    if (!memoryRefreshTokens.has(userId)) return false;
    return memoryRefreshTokens.get(userId).has(token);
  }

  static async removeRefreshToken(userId, token) {
    if (isMongoConnected() && mongoose.Types.ObjectId.isValid(userId)) {
      await MongooseUser.findByIdAndUpdate(userId, { $pull: { refreshTokens: token } });
      return true;
    }

    if (!memoryRefreshTokens.has(userId)) return false;
    return memoryRefreshTokens.get(userId).delete(token);
  }

  static async clearUserRefreshTokens(userId) {
    if (isMongoConnected() && mongoose.Types.ObjectId.isValid(userId)) {
      await MongooseUser.findByIdAndUpdate(userId, { $set: { refreshTokens: [] } });
      return;
    }
    memoryRefreshTokens.delete(userId);
  }
}

module.exports = UserModel;
