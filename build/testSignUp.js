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
Object.defineProperty(exports, "__esModule", { value: true });
var supabase_1 = require("./lib/supabase");
var fs = require("fs");
var logStream = fs.createWriteStream('signup-test.log', { flags: 'w' });
var log = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var message = args.map(function (arg) { return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg; }).join(' ');
    logStream.write(message + '\n');
    console.log.apply(console, args);
};
function testSignUp() {
    return __awaiter(this, void 0, void 0, function () {
        var testEmail, testPassword, testName, _a, data, error, _b, profile, profileError, err_1;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    testEmail = "testuser_".concat(Date.now(), "@example.com");
                    testPassword = 'testpassword123';
                    testName = 'Test User';
                    log('Starting sign up test at', new Date().toISOString());
                    log('Attempting sign up with:', { testEmail: testEmail, testName: testName });
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, supabase_1.supabase.auth.signUp({
                            email: testEmail,
                            password: testPassword,
                            options: {
                                data: {
                                    full_name: testName,
                                },
                            },
                        })];
                case 2:
                    _a = _d.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        log('Sign up error:', {
                            message: error.message,
                            code: error.code,
                            stack: error.stack
                        });
                        return [2 /*return*/];
                    }
                    log('Sign up successful! Verification required:', !data.session);
                    log('User:', (_c = data.user) === null || _c === void 0 ? void 0 : _c.email);
                    if (!data.user) return [3 /*break*/, 4];
                    return [4 /*yield*/, supabase_1.supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', data.user.id)
                            .single()];
                case 3:
                    _b = _d.sent(), profile = _b.data, profileError = _b.error;
                    if (profileError) {
                        log('Profile fetch error:', {
                            message: profileError.message,
                            code: profileError.code,
                            hint: profileError.hint
                        });
                    }
                    else {
                        log('Profile created successfully:', {
                            id: profile.id,
                            full_name: profile.full_name,
                            updated_at: profile.updated_at
                        });
                    }
                    _d.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    err_1 = _d.sent();
                    log('Unexpected error:', {
                        message: err_1 instanceof Error ? err_1.message : String(err_1),
                        stack: err_1 instanceof Error ? err_1.stack : undefined
                    });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
testSignUp().finally(function () {
    log('Test completed at', new Date().toISOString());
});
