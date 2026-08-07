"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripe = void 0;
const stripe_1 = __importDefault(require("stripe"));
const env_1 = require("../env");
const env = (0, env_1.getEnv)();
exports.stripe = env.STRIPE_SECRET_KEY
    ? new stripe_1.default(env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' })
    : null;
//# sourceMappingURL=stripe.js.map