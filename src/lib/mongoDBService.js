import mongoose from "mongoose";

const mongoDBService = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export default mongoDBService;
