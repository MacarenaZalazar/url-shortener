import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;

export const connectDB = async (): Promise<void> => {
  try {
    if (!uri) {
      console.error(
        'Error al conectar a MongoDB: no se ha proporcionado una URI válida'
      );
      process.exit(1);
    }
    await mongoose.connect(uri);
    console.log('Conexión exitosa a MongoDB');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB desconectado');
  });

  mongoose.connection.on('error', (error) => {
    console.error('Error en la conexión a MongoDB:', error);
  });
};
