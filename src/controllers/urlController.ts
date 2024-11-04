import { Request, Response } from 'express';
import { setCache, getCache } from '../services/redis';
import Url from '../models/url';
import { nanoid } from 'nanoid';

const CACHE_TTL = 3600; // 1 hora en segundos

// Genera una URL corta y la guarda en MongoDB y Redis
export const generateShortUrl = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { originalUrl } = req.body;
  const id = nanoid(10);
  const shortUrl = `http://localhost:3000/${id}`;

  // Guarda en MongoDB
  try {
    const url = new Url({ originalUrl, shortUrl, enabled: true, hits: 0 });
    await url.save();
  } catch (error) {
    res.json(error);
  }

  // Almacena en caché de Redis
  await setCache(
    id,
    { originalUrl, shortUrl, enabled: true, hits: 0 },
    CACHE_TTL
  );

  res.json({ shortUrl, id });
};

// Redirige a la URL original
export const redirectUrl = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  // Intenta obtener la URL desde el caché de Redis
  let data = await getCache(id);
  if (!data) {
    // Si no está en caché, busca en MongoDB
    const url = await Url.findOne({
      shortUrl: `http://localhost:3000/${id}`,
      enabled: true,
    });
    if (!url) {
      res.status(404).json({ error: 'URL no encontrada o deshabilitada' });
      return;
    }

    // Configura en el caché de Redis y actualiza el objeto `data`
    data = {
      originalUrl: url.originalUrl,
      shortUrl: url.shortUrl,
      enabled: url.enabled,
      hits: url.hits,
    };
    await setCache(id, data, CACHE_TTL);
  }

  // Incrementa el contador de hits en Redis
  data.hits += 1;
  await setCache(id, data, CACHE_TTL);

  // Incrementa los hits en MongoDB de manera asíncrona
  Url.updateOne(
    { shortUrl: data.shortUrl },
    { $inc: { hits: 1 }, $set: { lastAccessed: new Date() } }
  ).exec();

  res.redirect(data.originalUrl);
};

// Actualiza el estado (habilitar/deshabilitar) de la URL
export const updateUrlStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { enabled } = req.body;

  // Actualiza en MongoDB
  const url = await Url.findOneAndUpdate(
    { shortUrl: `http://localhost:3000/${id}` },
    { enabled },
    { new: true }
  );
  if (!url) {
    res.status(404).json({ error: 'URL no encontrada' });
    return;
  }

  // Actualiza en Redis si existe en el caché
  let data = await getCache(id);
  if (data) {
    data.enabled = enabled;
    await setCache(id, data, CACHE_TTL);
  }

  res.json({
    message: `URL ${enabled ? 'habilitada' : 'deshabilitada'} correctamente.`,
  });
};

// Modifica la URL de destino
export const updateOriginalUrl = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { originalUrl } = req.body;

  // Actualiza en MongoDB
  const url = await Url.findOneAndUpdate(
    { shortUrl: `http://localhost:3000/${id}` },
    { originalUrl },
    { new: true }
  );
  if (!url) {
    res.status(404).json({ error: 'URL no encontrada' });
    return;
  }

  // Actualiza en Redis si está en el caché
  let data = await getCache(id);
  if (data) {
    data.originalUrl = originalUrl;
    await setCache(id, data, CACHE_TTL);
  }

  res.json({ message: 'URL actualizada correctamente.' });
};

// Obtiene las estadísticas de la URL
export const getUrlStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  // Intenta obtener los datos del caché de Redis
  let data = await getCache(id);
  if (!data) {
    // Si no está en caché, busca en MongoDB
    const url = await Url.findOne({ shortUrl: `http://localhost:3000/${id}` });
    if (!url) {
      res.status(404).json({ error: 'URL no encontrada' });
      return;
    }

    // Guarda en el caché y actualiza `data`
    data = {
      originalUrl: url.originalUrl,
      shortUrl: url.shortUrl,
      enabled: url.enabled,
      hits: url.hits,
    };
    await setCache(id, data, CACHE_TTL);
  }

  res.json({
    id,
    originalUrl: data.originalUrl,
    shortUrl: data.shortUrl,
    enabled: data.enabled,
    hits: data.hits,
  });
};
