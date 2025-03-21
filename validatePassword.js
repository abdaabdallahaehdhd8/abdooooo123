const { PASSWORD_MIN_LENGTH } = require("../config/config");

const validatePassword = (req, res, next) => {
    const { password } = req.body;

    if (!password || password.length < PASSWORD_MIN_LENGTH) {
        return res.status(400).json({ error: `يجب أن تكون كلمة المرور ${PASSWORD_MIN_LENGTH} أحرف على الأقل` });
    }

    next();
};

module.exports = validatePassword;
