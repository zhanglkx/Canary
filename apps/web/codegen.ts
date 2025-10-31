import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql',
  documents: ['src/**/*.tsx', 'src/**/*.ts'],
  generates: {
    'src/lib/gql/': {
      preset: 'client',
      plugins: [],
    },
    './graphql.schema.json': {
      plugins: ['introspection'],
    },
  },
};

export default config;
