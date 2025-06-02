"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
require("react-native-url-polyfill/auto");
var supabase_js_1 = require("@supabase/supabase-js");
var react_native_1 = require("react-native");
// Get environment variables
var supabaseUrl = (_a = process.env.EXPO_PUBLIC_SUPABASE_URL) === null || _a === void 0 ? void 0 : _a.trim();
var supabaseAnonKey = (_b = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) === null || _b === void 0 ? void 0 : _b.trim();
// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env file.');
}
// Create Supabase client with optimized settings
var supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: react_native_1.Platform.OS === 'web',
    },
    global: {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
        },
        // Configure fetch with retry behavior
        fetch: function (input, init) {
            var retry = function () {
                var args_1 = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args_1[_i] = arguments[_i];
                }
                return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (attempt) {
                    var response, error_1;
                    if (attempt === void 0) { attempt = 1; }
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 4, , 7]);
                                return [4 /*yield*/, fetch(input, init)];
                            case 1:
                                response = _a.sent();
                                if (!(!response.ok && attempt < 3)) return [3 /*break*/, 3];
                                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                            case 2:
                                _a.sent();
                                return [2 /*return*/, retry(attempt + 1)];
                            case 3: return [2 /*return*/, response];
                            case 4:
                                error_1 = _a.sent();
                                if (!(attempt < 3)) return [3 /*break*/, 6];
                                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                            case 5:
                                _a.sent();
                                return [2 /*return*/, retry(attempt + 1)];
                            case 6: throw error_1;
                            case 7: return [2 /*return*/];
                        }
                    });
                });
            };
            return retry();
        }
    },
    db: {
        schema: 'public'
    }
});
exports.supabase = supabase;
