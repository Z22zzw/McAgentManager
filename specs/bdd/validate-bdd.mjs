import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, 'features')
const goldenPath = resolve(import.meta.dirname, '../../docs/prd/MC-AI-Manager-P0-Golden-Samples-v0.1.md')
const allowedDomains = new Set(['ENV', 'DEPLOY', 'CLASS', 'SEC', 'JAVA', 'AUTH', 'EULA', 'CTRL', 'REC', 'DISK', 'DEL', 'AUDIT', 'ADV', 'DIAG'])

const files = (await readdir(root)).filter((name) => name.endsWith('.feature')).sort()
if (files.length === 0) throw new Error('No .feature files found')

const goldenText = await readFile(goldenPath, 'utf8')
const goldenTags = new Set([...goldenText.matchAll(/\bGS-[A-Z]+-\d{3}\b/g)].map((match) => match[0]))

const ids = new Map()
const errors = []
let scenarioCount = 0
let outlineCount = 0
let goldenReferenceCount = 0

for (const file of files) {
  const text = await readFile(resolve(root, file), 'utf8')
  const lines = text.split(/\r?\n/)
  if (!lines.some((line) => /^Feature:\s+\S/.test(line))) errors.push(`${file}: missing Feature header`)
  if (!lines.some((line) => /^@.*@L[012](?:\s|$)/.test(line))) errors.push(`${file}: missing execution layer tag @L0/@L1/@L2`)

  let pendingTags = []
  let featureScenarios = 0
  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim()
    if (trimmed.startsWith('@')) {
      pendingTags.push(...trimmed.split(/\s+/).filter((part) => part.startsWith('@')).map((part) => part.slice(1)))
      continue
    }
    const scenario = /^(Scenario|Scenario Outline):\s+(.+)$/.exec(trimmed)
    if (!scenario) {
      if (trimmed && !trimmed.startsWith('#')) pendingTags = []
      continue
    }

    scenarioCount += 1
    featureScenarios += 1
    if (scenario[1] === 'Scenario Outline') outlineCount += 1

    const idTag = pendingTags.find((tag) => /^BDD-([A-Z]+)-\d{3}$/.test(tag))
    if (!idTag) {
      errors.push(`${file}:${index + 1}: missing scenario ID tag`)
    } else {
      const domain = /^BDD-([A-Z]+)-/.exec(idTag)?.[1]
      if (!allowedDomains.has(domain)) errors.push(`${file}:${index + 1}: unsupported ID domain ${domain}`)
      if (ids.has(idTag)) errors.push(`${file}:${index + 1}: duplicate ${idTag}, first seen in ${ids.get(idTag)}`)
      else ids.set(idTag, `${file}:${index + 1}`)
    }
    if (!pendingTags.includes('p0')) errors.push(`${file}:${index + 1}: missing @p0`)
    if (idTag?.startsWith('BDD-DEL-') && !pendingTags.includes('destructive')) {
      errors.push(`${file}:${index + 1}: destructive delete scenario missing @destructive`)
    }

    const scenarioGoldenTags = pendingTags.filter((item) => item.startsWith('GS-'))
    let outlineBlock = ''
    let exampleGoldenIds = []
    if (scenario[1] === 'Scenario Outline') {
      const remaining = lines.slice(index + 1)
      const nextScenarioOffset = remaining.findIndex((line) => /^\s*(Scenario|Scenario Outline):/.test(line))
      outlineBlock = remaining.slice(0, nextScenarioOffset < 0 ? remaining.length : nextScenarioOffset).join('\n')
      exampleGoldenIds = [...outlineBlock.matchAll(/\bGS-[A-Z]+-\d{3}\b/g)].map((match) => match[0])
      if (!/\|\s*case_id\s*\|/.test(outlineBlock)) errors.push(`${file}:${index + 1}: outline Examples missing case_id`)
      if ((scenarioGoldenTags.length > 1 || exampleGoldenIds.length > 1) && !/\|\s*[^\n|]*sample_id[^\n|]*\|/.test(outlineBlock)) {
        errors.push(`${file}:${index + 1}: multi-sample outline Examples missing sample_id`)
      }
    }

    const goldenReferences = [...new Set([...scenarioGoldenTags, ...exampleGoldenIds])]
    if (goldenReferences.length === 0) errors.push(`${file}:${index + 1}: missing Golden Sample reference`)
    for (const reference of goldenReferences) {
      goldenReferenceCount += 1
      if (!goldenTags.has(reference)) errors.push(`${file}:${index + 1}: unknown Golden Sample @${reference}`)
    }
    pendingTags = []
  }
  if (featureScenarios === 0) errors.push(`${file}: contains no scenarios`)
}

const summary = {
  files: files.length,
  scenarios: scenarioCount,
  scenarioOutlines: outlineCount,
  uniqueScenarioIds: ids.size,
  goldenReferences: goldenReferenceCount,
  errors: errors.length,
}
console.log(JSON.stringify(summary, null, 2))
if (errors.length > 0) {
  for (const error of errors) console.error(`- ${error}`)
  process.exitCode = 1
}
