import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const isLibBuild = mode === 'lib'

  return {
    plugins: [vue()],
    build: isLibBuild
      ? {
          lib: {
            entry: resolve(__dirname, 'src/ribbon/index.ts'),
            name: 'MlRibbon',
            formats: ['es', 'umd'],
            fileName: (format) => `ml-ribbon.${format}.js`,
          },
          rollupOptions: {
            external: [/^vue(\/.*)?$/, /^element-plus(\/.*)?$/, /^@element-plus\/icons-vue(\/.*)?$/],
            output: {
              globals: {
                vue: 'Vue',
                'element-plus': 'ElementPlus',
                '@element-plus/icons-vue': 'ElementPlusIconsVue',
              },
            },
          },
        }
      : undefined,
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/tests/setup.ts'],
      include: ['src/tests/**/*.spec.ts'],
      exclude: ['playwright/**', 'node_modules/**'],
    },
  }
})
