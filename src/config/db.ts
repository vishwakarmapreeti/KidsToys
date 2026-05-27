import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

export default connectDB;


// it cConnects your Node.js app to MongoDB Atlas. It calls mongoose.connect() with your MONGO_URI and logs success or failure. If it fails, the whole server stops (process.exit) so you never run an app with no database.