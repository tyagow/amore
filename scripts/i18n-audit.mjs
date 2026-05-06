#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import ts from 'typescript'

const ROOT = process.cwd()
const TARGETS = [
  path.join(ROOT, 'apps/web/src'),
  path.join(ROOT, 'packages/ai/src'),
]
const EXCLUDED_SEGMENTS = new Set([
  'node_modules',
  'dist',
  '.turbo',
  'routeTree.gen.ts',
])
const EXCLUDED_SUFFIXES = [
  '.test.ts',
  '.test.tsx',
  '.spec.ts',
  '.spec.tsx',
  '.d.ts',
]
const ATTRS = new Set(['placeholder', 'title', 'aria-label', 'alt'])

const options = parseArgs(process.argv.slice(2))
const findings = []
const translatedCopy = loadTranslatedCopy()

for (const target of TARGETS) {
  walk(target, (filePath) => auditFile(filePath))
}

findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)

if (options.format === 'json') {
  process.stdout.write(`${JSON.stringify({ count: findings.length, findings }, null, 2)}\n`)
} else {
  process.stdout.write(`i18n audit findings: ${findings.length}\n`)
  for (const finding of findings.slice(0, options.limit)) {
    process.stdout.write(
      `${finding.file}:${finding.line}:${finding.column} ${finding.kind} "${finding.text}"\n`,
    )
  }
  if (findings.length > options.limit) {
    process.stdout.write(`... ${findings.length - options.limit} more. Use --limit ${findings.length} or --format json.\n`)
  }
}

if (options.max != null && findings.length > options.max) {
  process.stderr.write(`i18n audit failed: ${findings.length} findings exceeds max ${options.max}\n`)
  process.exit(1)
}

function parseArgs(args) {
  const parsed = { format: 'text', limit: 200, max: null }
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--format') parsed.format = args[++index] ?? parsed.format
    if (arg === '--limit') parsed.limit = Number(args[++index] ?? parsed.limit)
    if (arg === '--max') parsed.max = Number(args[++index] ?? parsed.max)
  }
  return parsed
}

function walk(dir, onFile) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDED_SEGMENTS.has(entry.name)) continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, onFile)
      continue
    }
    if (!entry.isFile()) continue
    if (!/\.(ts|tsx)$/.test(entry.name)) continue
    if (EXCLUDED_SUFFIXES.some((suffix) => entry.name.endsWith(suffix))) continue
    onFile(fullPath)
  }
}

function auditFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf8')
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )

  const visit = (node) => {
    if (ts.isJsxText(node)) {
      record(node, 'jsx-text', node.getText(sourceFile).replace(/\s+/g, ' ').trim())
    } else if (ts.isJsxAttribute(node) && ATTRS.has(node.name.text)) {
      const initializer = node.initializer
      if (initializer && ts.isStringLiteral(initializer)) {
        record(initializer, `attr:${node.name.text}`, initializer.text)
      }
    } else if (isLikelyUserFacingObjectProperty(node)) {
      record(node.initializer, `property:${node.name.getText(sourceFile)}`, node.initializer.text)
    } else if (isThrowOrErrorMessage(node)) {
      const expression = node.expression
      if (ts.isNewExpression(expression) && expression.arguments?.[0] && ts.isStringLiteral(expression.arguments[0])) {
        record(expression.arguments[0], 'error', expression.arguments[0].text)
      } else if (ts.isStringLiteral(expression)) {
        record(expression, 'throw', expression.text)
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  function record(node, kind, rawText) {
    const text = clean(rawText)
    if (!shouldFlag(text)) return
    const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
    findings.push({
      file: path.relative(ROOT, filePath),
      line: pos.line + 1,
      column: pos.character + 1,
      kind,
      text,
    })
  }
}

function isLikelyUserFacingObjectProperty(node) {
  if (!ts.isPropertyAssignment(node)) return false
  if (!ts.isStringLiteral(node.initializer) && !ts.isNoSubstitutionTemplateLiteral(node.initializer)) return false
  const name = node.name.getText()
  return [
    'label',
    'title',
    'description',
    'body',
    'message',
    'error',
    'emptyText',
    'question',
    'answer',
    'tip',
    'context',
    'summary',
  ].includes(name)
}

function isThrowOrErrorMessage(node) {
  return ts.isThrowStatement(node) && !!node.expression
}

function clean(text) {
  return text
    .replace(/&apos;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/\s+/g, ' ')
    .trim()
}

function shouldFlag(text) {
  if (!text) return false
  if (translatedCopy.has(text)) return false
  if (isLikelyPortuguese(text)) return false
  if (text === 'Amore Couples' || text === 'Amore') return false
  if (text.length < 8) return false
  if (!/[A-Za-z]{3}/.test(text)) return false
  if (text === 'useI18n must be used inside I18nProvider') return false
  if (/^&[a-z]+;$/i.test(text)) return false
  if (/^[A-Z0-9_./:-]+$/.test(text)) return false
  if (/^(http|https|mailto):/.test(text)) return false
  if (/^[\w.-]+@[\w.-]+$/.test(text)) return false
  if (/^[{}[\]().,;:'"`!?+\-*/%<>=|&\s]+$/.test(text)) return false
  return true
}

function isLikelyPortuguese(text) {
  if (/[ãõáàâêéíóôúç]/i.test(text)) return true
  if (/microencontro/i.test(text)) return true
  if (/^(So escutar|Acolhimento|Um pouco de espaco|Eu preciso|Uma mensagem de apreciacao)/i.test(text)) return true
  const matches = text.match(
    /\b(acao|acolhedor|acolhedora|acolhimento|afastar|ajuda|ajudar|antes|apoio|baixar|bom|celular|checar|com|como|compartilhe|concluida|conexao|conversa|cuidado|defender|depois|desculpas|dia|dificil|diga|disso|dois|escolha|escolher|escuta|escutar|espaco|esta|faca|facilite|fresco|funcionando|guardar|hoje|mais|menos|meta|minutos|momentos|mudanca|neutro|noite|nomeie|parceria|pergunta|perguntar|pesado|plano|ponto|positivos|pratica|primeiro|promessa|rapido|reconectar|relacionamento|reparar|reparo|responder|seguranca|sem|sentir|sobre|tensao|uma|voce)\b/gi,
  )
  return (matches?.length ?? 0) >= 2
}

function loadTranslatedCopy() {
  const i18nPath = path.join(ROOT, 'apps/web/src/lib/i18n.tsx')
  const copy = new Set()
  if (!fs.existsSync(i18nPath)) return copy

  const source = fs.readFileSync(i18nPath, 'utf8')
  const sourceFile = ts.createSourceFile(i18nPath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(sourceFile) === 'PT_BR_COPY' &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      for (const property of node.initializer.properties) {
        if (!ts.isPropertyAssignment(property)) continue
        if (ts.isStringLiteral(property.name) || ts.isNoSubstitutionTemplateLiteral(property.name)) {
          copy.add(clean(property.name.text))
        }
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return copy
}
