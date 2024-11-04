import app from './app';
import { connectDB } from './services/mongo';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  // Conecta a MongoDB antes de iniciar el servidor
  await connectDB();

  // Inicia el servidor después de la conexión
  app.listen(PORT, () => {
    console.log(`Servidor en ejecución en http://localhost:${PORT}`);
  });
};

startServer();
