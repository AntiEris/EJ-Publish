import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

const templatesDir = path.resolve(__dirname, 'src/template-library/templates')
const seedDir = path.resolve(__dirname, 'src/template-library/seed')

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf8')
  return JSON.parse(raw) as T
}

async function readTemplatesFromDirectory(dirPath: string) {
  const entries = await fs.readdir(dirPath)
  const jsonEntries = entries.filter((entry) => entry.endsWith('.json')).sort()
  const templates = await Promise.all(
    jsonEntries.map((entry) => readJson(path.join(dirPath, entry)))
  )
  return templates
}

async function readRequestBody(request: IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown) {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(payload))
}

function templateApiPlugin() {
  return {
    name: 'template-api',
    configureServer(server: { middlewares: { use: (handler: (request: IncomingMessage, response: ServerResponse, next: () => void) => void) => void } }) {
      server.middlewares.use(async (request, response, next) => {
        const url = request.url || ''

        if (!url.startsWith('/__template_api')) {
          next()
          return
        }

        try {
          if (request.method === 'GET' && url === '/__template_api/templates') {
            const templates = await readTemplatesFromDirectory(templatesDir)
            sendJson(response, 200, { templates })
            return
          }

          if (request.method === 'PUT' && url === '/__template_api/templates') {
            const body = await readRequestBody(request)
            const template = body.template
            if (!template?.id) {
              sendJson(response, 400, { message: 'Template id is required.' })
              return
            }

            await fs.mkdir(templatesDir, { recursive: true })
            const targetPath = path.join(templatesDir, `${template.id}.json`)
            await fs.writeFile(targetPath, JSON.stringify(template, null, 2) + '\n', 'utf8')
            sendJson(response, 200, { template })
            return
          }

          if (request.method === 'DELETE' && url.startsWith('/__template_api/templates/')) {
            const templateId = decodeURIComponent(url.replace('/__template_api/templates/', ''))
            const targetPath = path.join(templatesDir, `${templateId}.json`)
            await fs.rm(targetPath, { force: true })
            sendJson(response, 200, { ok: true })
            return
          }

          if (request.method === 'POST' && url === '/__template_api/restore') {
            await fs.mkdir(templatesDir, { recursive: true })
            const seedEntries = await fs.readdir(seedDir)
            for (const entry of seedEntries.filter((item) => item.endsWith('.json'))) {
              const seedPath = path.join(seedDir, entry)
              const targetPath = path.join(templatesDir, entry)
              try {
                await fs.access(targetPath)
              } catch {
                await fs.copyFile(seedPath, targetPath)
              }
            }
            sendJson(response, 200, { ok: true })
            return
          }

          sendJson(response, 404, { message: 'Unknown template API route.' })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown template API error.'
          sendJson(response, 500, { message })
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), templateApiPlugin()],
  base: '/',
})
