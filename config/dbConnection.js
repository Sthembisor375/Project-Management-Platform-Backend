const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    console.log("🔌 Attempting to connect to MongoDB...");

    // Use Railway's environment variable or fallback to local development
    const connectionString =
      process.env.CONNECTION_STRING ||
      process.env.MONGODB_URI ||
      process.env.MONGODB_URL;

    if (!connectionString) {
      console.warn(
        "⚠️ No MongoDB connection string found. Please check your environment variables."
      );
      console.log(
        "📡 Expected variables: CONNECTION_STRING, MONGODB_URI, or MONGODB_URL"
      );
      return; // Don't exit process, let the app continue
    }

    const connect = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ Database connected successfully!");
    console.log("🏠 Host:", connect.connection.host);
    console.log("📊 Database:", connect.connection.name);
    console.log("🔗 Ready state:", connect.connection.readyState);

    // Monitor connection events
    mongoose.connection.on("error", (err) => {
      console.error("💥 MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔄 MongoDB reconnected");
    });
  } catch (err) {
    console.error("💥 Failed to connect to MongoDB:", {
      message: err.message,
      name: err.name,
      code: err.code,
    });

    if (err.name === "MongoNetworkError") {
      console.error(
        "🌐 Network error - Check your internet connection and MongoDB server status"
      );
    } else if (err.name === "MongoServerSelectionError") {
      console.error(
        "🎯 Server selection error - MongoDB server might be down or unreachable"
      );
    } else if (err.message.includes("ECONNREFUSED")) {
      console.error(
        "🚫 Connection refused - MongoDB server is not running or port is blocked"
      );
    }

    // Don't exit process in production, let the app continue
    if (process.env.NODE_ENV === "production") {
      console.warn("⚠️ Continuing without database connection in production");
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDb;
