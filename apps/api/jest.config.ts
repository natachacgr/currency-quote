import type { Config } from 'jest';

const config: Config = {
  rootDir: '.',

  testEnvironment: 'node',

  extensionsToTreatAsEsm: ['.ts'],

  transform: {
    '^.+\\.ts$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: true,
          },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
          },
          target: 'es2022',
        },
        module: {
          type: 'es6',
        },
      },
    ],
  },

  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  testMatch: ['<rootDir>/src/**/*.spec.ts'],

  moduleFileExtensions: ['ts', 'js', 'json'],

  clearMocks: true,
};

export default config;
