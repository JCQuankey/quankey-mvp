"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// GET /dashboard
router.get('/', (_req, res) => {
    res.json({ status: 'Dashboard endpoint alive 🚀' });
});
exports.default = router;
