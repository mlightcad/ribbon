import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import ElementPlus from 'unplugin-element-plus/vite'

export default defineConfig(({ mode }) => {
  const isLibBuild = mode === 'lib'
  // Vitest imports transformed modules without resolving injected `.css` the same
  // way as the Vite app pipeline; keep on-demand styles for dev / demo build only.
  const useElementPlusOnDemand = !isLibBuild && !process.env.VITEST

  return {
    plugins: [
      vue(),
      ...(useElementPlusOnDemand ? [ElementPlus({})] : []),
    ],
    build: isLibBuild
      ? {
          lib: {
            entry: resolve(__dirname, 'src/ribbon/index.ts'),
            name: 'MlRibbon',
            formats: ['es', 'umd'],
            fileName: (format) => `ml-ribbon.${format}.js`,
            cssFileName: 'ml-ribbon',
          },
          rollupOptions: {
            external: [
              /^vue(\/.*)?$/,
              /^element-plus(\/.*)?$/,
              /^@element-plus\/icons-vue(\/.*)?$/,
            ],
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
      include: ['src/tests/**/*.spec.ts'],
      exclude: ['playwright/**', 'node_modules/**'],
    },
  }
})
