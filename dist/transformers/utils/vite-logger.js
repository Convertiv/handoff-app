"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createViteLogger = void 0;
const logger_1 = require("../../utils/logger");
const createViteLogger = () => {
    const warnedMessages = new Set();
    return {
        hasWarned: false,
        info(msg, options) {
            logger_1.Logger.info(msg);
        },
        warn(msg, options) {
            this.hasWarned = true;
            logger_1.Logger.warn(msg);
        },
        warnOnce(msg, options) {
            if (warnedMessages.has(msg))
                return;
            warnedMessages.add(msg);
            this.hasWarned = true;
            logger_1.Logger.warn(msg);
        },
        error(msg, options) {
            logger_1.Logger.error(msg);
        },
        clearScreen(type) {
            // No-op to preserve terminal history
        },
        hasErrorLogged(error) {
            return false;
        },
    };
};
exports.createViteLogger = createViteLogger;
