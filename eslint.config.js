import js from '@eslint/js'
import ts from 'typescript-eslint'
import vue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier'

const frontend = ['resources/js/src/**/*.{ts,vue}', 'tests/frontend/**/*.ts', '*.config.ts']
const restrictedLayers = (files, patterns) => ({
    files,
    rules: { 'no-restricted-imports': ['error', { patterns }] },
})

export default ts.config(
    {
        ignores: [
            'node_modules/**',
            'vendor/**',
            'public/**',
            'test-results/**',
            'playwright-report/**',
        ],
    },
    { ...js.configs.recommended, files: frontend },
    ...ts.configs.recommended.map((config) => ({ ...config, files: frontend })),
    ...vue.configs['flat/recommended'],
    {
        files: frontend,
        languageOptions: { parserOptions: { parser: ts.parser, extraFileExtensions: ['.vue'] } },
        rules: {
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/explicit-module-boundary-types': 'error',
            '@typescript-eslint/no-explicit-any': 'error',
            'max-lines': ['warn', { max: 300 }],
            'max-lines-per-function': ['warn', { max: 40, skipBlankLines: true }],
            'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
        },
    },
    restrictedLayers(
        ['resources/js/src/components/ui/**/*.{ts,vue}'],
        ['@/api/**', '@/services/**', '@/stores/**', '@/router/**', '@/views/**'],
    ),
    restrictedLayers(
        ['resources/js/src/services/**/*.ts'],
        ['@/router/**', '@/stores/**', '@/components/**', '@/views/**', 'vue-router', 'pinia'],
    ),
    restrictedLayers(
        ['resources/js/src/core/types/**/*.ts'],
        ['@/api/**', '@/services/**', '@/stores/**', '@/router/**', '@/views/**'],
    ),
    prettier,
)
