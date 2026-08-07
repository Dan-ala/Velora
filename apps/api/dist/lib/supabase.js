"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabase = getSupabase;
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("../env");
const ws_1 = __importDefault(require("ws"));
let supabaseClient = null;
function getSupabase() {
    const env = (0, env_1.getEnv)();
    if (!supabaseClient) {
        supabaseClient = (0, supabase_js_1.createClient)(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
            realtime: { transport: ws_1.default },
        });
    }
    return supabaseClient;
}
//# sourceMappingURL=supabase.js.map