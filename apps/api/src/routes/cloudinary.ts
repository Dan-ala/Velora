import type { FastifyInstance } from 'fastify';
import { cloudinary } from '../lib/cloudinary';
import { preHandler } from '../middleware/auth';
import z from 'zod';

export async function cloudinaryRoutes(app: FastifyInstance) {
  app.post('/upload', { preHandler: preHandler('admin') }, async (request, reply) => {
    const body = z.object({
      image: z.string(), // base64
      folder: z.string().optional().default('velora'),
    }).parse(request.body);

    try {
      const result = await cloudinary.uploader.upload(body.image, {
        folder: body.folder,
        quality: 'auto',
        fetch_format: 'auto',
      });

      return reply.send({
        success: true,
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        },
      });
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message });
    }
  });

  app.delete('/:publicId', { preHandler: preHandler('admin') }, async (request, reply) => {
    const { publicId } = z.object({ publicId: z.string() }).parse(request.params);

    try {
      await cloudinary.uploader.destroy(publicId);
      return reply.send({ success: true, message: 'Image deleted' });
    } catch (error: any) {
      return reply.status(400).send({ success: false, error: error.message });
    }
  });

  app.post('/signature', { preHandler: preHandler('admin') }, async (_request, reply) => {
    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder: 'velora' },
      cloudinary.config().api_secret!,
    );

    return reply.send({
      success: true,
      data: {
        timestamp,
        signature,
        cloudName: cloudinary.config().cloud_name,
        apiKey: cloudinary.config().api_key,
      },
    });
  });
}
