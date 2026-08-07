"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinaryRoutes = cloudinaryRoutes;
const cloudinary_1 = require("../lib/cloudinary");
const auth_1 = require("../middleware/auth");
const zod_1 = __importDefault(require("zod"));
async function cloudinaryRoutes(app) {
    app.post('/upload', { preHandler: (0, auth_1.preHandler)('admin') }, async (request, reply) => {
        const body = zod_1.default.object({
            image: zod_1.default.string(), // base64
            folder: zod_1.default.string().optional().default('velora'),
        }).parse(request.body);
        try {
            const result = await cloudinary_1.cloudinary.uploader.upload(body.image, {
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
        }
        catch (error) {
            return reply.status(400).send({ success: false, error: error.message });
        }
    });
    app.delete('/:publicId', { preHandler: (0, auth_1.preHandler)('admin') }, async (request, reply) => {
        const { publicId } = zod_1.default.object({ publicId: zod_1.default.string() }).parse(request.params);
        try {
            await cloudinary_1.cloudinary.uploader.destroy(publicId);
            return reply.send({ success: true, message: 'Image deleted' });
        }
        catch (error) {
            return reply.status(400).send({ success: false, error: error.message });
        }
    });
    app.post('/signature', { preHandler: (0, auth_1.preHandler)('admin') }, async (_request, reply) => {
        const timestamp = Math.round(Date.now() / 1000);
        const signature = cloudinary_1.cloudinary.utils.api_sign_request({ timestamp, folder: 'velora' }, cloudinary_1.cloudinary.config().api_secret);
        return reply.send({
            success: true,
            data: {
                timestamp,
                signature,
                cloudName: cloudinary_1.cloudinary.config().cloud_name,
                apiKey: cloudinary_1.cloudinary.config().api_key,
            },
        });
    });
}
//# sourceMappingURL=cloudinary.js.map