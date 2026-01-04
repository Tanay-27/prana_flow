import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { Types } from 'mongoose';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pranaflow';

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    // Clear existing data (optional, but good for a fresh start)
    // await mongoose.connection.db.dropDatabase();

    const UserSchema = new mongoose.Schema({
      username: { type: String, required: true },
      password: { type: String, required: true },
      role: { type: String, default: 'healer' },
      isActive: { type: Boolean, default: true },
    });
    
    // We'll use any as we don't want to redefine everything here
    const User = mongoose.model('User', UserSchema);
    const Client = mongoose.model('Client', new mongoose.Schema({}, { strict: false }));
    const Protocol = mongoose.model('Protocol', new mongoose.Schema({}, { strict: false }));
    const Session = mongoose.model('Session', new mongoose.Schema({}, { strict: false }));
    const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));
    const NurturingSession = mongoose.model('NurturingSession', new mongoose.Schema({}, { strict: false }));

    // 1. Create Admin user
    const existingAdmin = await User.findOne({ username: 'admin' });
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    let adminId: Types.ObjectId;
    if (!existingAdmin) {
      const admin = await User.create({
        username: 'admin',
        password: adminPassword,
        role: 'admin',
        isActive: true,
      });
      adminId = admin._id as Types.ObjectId;
      console.log('Admin created: admin / Admin@123');
    } else {
      adminId = existingAdmin._id as Types.ObjectId;
      await User.updateOne({ _id: adminId }, { $set: { password: adminPassword } });
      console.log('Admin password reset to Admin@123');
    }

    // 2. Create Healer
    const existingHealer = await User.findOne({ username: 'healer' });
    let healerId;
    const healerPassword = await bcrypt.hash('Healer@123', 10);
    if (!existingHealer) {
      const healer = await User.create({
        username: 'healer',
        password: healerPassword,
        role: 'healer',
        isActive: true,
      });
      healerId = healer._id;
      console.log('Healer created: healer / Healer@123');
    } else {
      healerId = existingHealer._id;
      await User.updateOne({ _id: healerId }, { $set: { password: healerPassword } });
      console.log('Healer password reset to Healer@123');
    }

    // 3. Create Clients
    const clientsData = [
      { name: 'John Smith', phone: '+91 9876543210', email: 'john@example.com', healer_id: healerId, is_active: true },
      { name: 'Alice Wong', phone: '+1 234567890', email: 'alice@example.com', healer_id: healerId, is_active: true },
    ];
    
    const clients = await Client.insertMany(clientsData);
    console.log(`Created ${clients.length} clients.`);

    // 4. Create Protocols
    const protocolsData = [
      { name: 'General Cleansing', keywords: ['cleansing', 'aura'], notes: 'Standard protocol for energy maintenance.', healer_id: healerId, is_active: true },
      { name: 'Stress Relief', keywords: ['stress', 'relaxation'], notes: 'Focus on solar plexus and heart.', healer_id: healerId, is_active: true },
    ];
    const protocols = await Protocol.insertMany(protocolsData);
    console.log(`Created ${protocols.length} protocols.`);

    // 5. Create Sessions (only if user has none)
    const healerSessions = [
      {
        type: 'healing',
        user_id: healerId,
        client_id: clients[0]._id,
        protocol_ids: [protocols[0]._id],
        scheduled_date: new Date(),
        start_time: '10:00',
        end_time: '11:00',
        status: 'scheduled',
        notes: 'Demo session with John Smith',
        is_active: true,
      },
    ];

    const adminSessions = [
      {
        type: 'healing',
        user_id: adminId,
        client_id: clients[1]?._id || clients[0]._id,
        protocol_ids: [protocols[1]?._id || protocols[0]._id],
        scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        start_time: '14:00',
        end_time: '15:00',
        status: 'scheduled',
        notes: 'Demo session for admin user',
        is_active: true,
      },
    ];

    const healerSessionCount = await Session.countDocuments({ user_id: healerId });
    if (healerSessionCount === 0) {
      await Session.insertMany(healerSessions);
      console.log('Default healer session created.');
    } else {
      console.log('Healer already has sessions; skipping default seed.');
    }

    const adminSessionCount = await Session.countDocuments({ user_id: adminId });
    if (adminSessionCount === 0) {
      await Session.insertMany(adminSessions);
      console.log('Default admin session created.');
    } else {
      console.log('Admin already has sessions; skipping default seed.');
    }

    const nurturingData = [
      { 
        name: 'Daily Meditation',
        healer_id: healerId,
        date: new Date(),
        status: 'Planned',
        is_active: true
      }
    ];
    await NurturingSession.insertMany(nurturingData);
    console.log('Created sample sessions and nurturing sessions.');

    // 6. Create Payments
    const paymentsData = [
      {
        client_id: clients[0]._id,
        amount_inr: 1500,
        mode: 'UPI',
        status: 'Paid',
        paid_at: new Date(),
        healer_id: healerId,
        is_active: true
      },
      {
        client_id: clients[1]._id,
        amount_inr: 2000,
        mode: 'Cash',
        status: 'Pending',
        healer_id: healerId,
        is_active: true
      }
    ];
    await Payment.insertMany(paymentsData);
    console.log('Created sample payments.');

    console.log('Seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
