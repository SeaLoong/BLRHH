module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "jquery": true
    },
    "extends": "eslint-config-standard",
    "parserOptions": {
        "ecmaVersion": 2015,
        "sourceType": "module"
    },
    "rules": {
        "indent": [
            "error",
            4,
            {
                "SwitchCase": 1
            }
        ],
        "linebreak-style": [
            "error",
            "windows"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "camelcase": "off",
        "no-console": "off",
        "no-unused-vars": [
            "warn",
            {
                "vars": "all",
                "args": "after-used"
            }
        ],
        "no-mixed-operators": "off",
        "no-fallthrough": "off",
        "eqeqeq": [
            "error",
            "smart"
        ],
        "space-before-function-paren": [
            "error",
            {
                "anonymous": "always",
                "named": "never",
                "asyncArrow": "always"
            }
        ],
        "eol-last": "off"
    },
    "globals": {
        "BilibiliAPI": true,
        "OCRAD": true
    }
};