import { Request, Response } from 'express';
import { setCache, getCache } from '../services/redis';
import Url from '../models/url';
import ShortUniqueId from 'short-unique-id';
import dotenv from 'dotenv';

dotenv.config();

const CACHE_TTL = 3600; // 1 hora en segundos
const BASE_URL = process.env.BASE_URL;
// Genera una URL corta y la guarda en MongoDB y Redis
export const generateShortUrl = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { originalUrl } = req.body;

  const uid = new ShortUniqueId({ length: 8 }); // Define la longitud del ID
  const id = uid.randomUUID();
  const shortUrl = `${BASE_URL}/${id}`;

  // Guarda en MongoDB
  try {
    const url = new Url({ originalUrl, shortUrl, enabled: true, hits: 0 });
    await url.save();

    // Almacena en caché de Redis
    await setCache(
      id,
      { originalUrl, shortUrl, enabled: true, hits: 0 },
      CACHE_TTL
    );

    res.json({ shortUrl, id });
  } catch (error) {
    res.status(500).json({
      error: 'Hubo un problema generando la URL corta. Inténtalo de nuevo.',
    });
  }
};

// Redirige a la URL original
export const redirectUrl = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    // Intenta obtener la URL desde el caché de Redis
    let data = await getCache(id);

    if (data) {
      // Incrementa los hits en MongoDB de manera asíncrona
      Url.updateOne(
        { shortUrl: id },
        { $inc: { hits: 1 }, $set: { lastAccessed: new Date() } }
      ).exec();
      console.log("OK")

      return res.redirect(data.originalUrl);
    }

    // Si no está en caché, busca en MongoDB
    const url = await Url.findOne({
      shortUrl: `${BASE_URL}/${id}`,
      enabled: true,
    });

    if (!url) {
      console.log({ error: 'URL no encontrada o deshabilitada' })
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

    // Incrementa el contador de hits en Redis
    data.hits += 1;
    await setCache(id, data, CACHE_TTL);
console.log("OK")
    res.redirect(data.originalUrl);
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Hubo un problema redirigiendo la URL.' });
  }
};

// Actualiza el estado (habilitar/deshabilitar) de la URL
export const updateUrlStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { enabled } = req.body;
  try {
    // Actualiza en MongoDB
    const url = await Url.findOneAndUpdate(
      { shortUrl: `${BASE_URL}/${id}` },
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
  } catch (error) {
    res.status(500).json({
      error: 'Ocurrió un problema inesperado. Por favor, inténtalo más tarde.',
    });
  }
};

// Modifica la URL de destino
export const updateOriginalUrl = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { originalUrl } = req.body;
  try {
    // Actualiza en MongoDB
    const url = await Url.findOneAndUpdate(
      { shortUrl: `${BASE_URL}/${id}` },
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
  } catch (error) {
    res.status(500).json({
      error: 'Ocurrió un problema inesperado. Por favor, inténtalo más tarde.',
    });
  }
};

// Obtiene las estadísticas de la URL
export const getUrlStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    // Intenta obtener los datos del caché de Redis
    let data = await getCache(id);
    if (!data) {
      // Si no está en caché, busca en MongoDB
      const url = await Url.findOne({ shortUrl: `${BASE_URL}/${id}` });
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
  } catch (error) {
    res.status(500).json({
      error: 'Ocurrió un problema inesperado. Por favor, inténtalo más tarde.',
    });
  }
};
