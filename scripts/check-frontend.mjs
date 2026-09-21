import { readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname, relative } from 'node:path'
import ts from 'typescript'
import { parse } from '@vue/compiler-sfc'
import { baseParse, NodeTypes } from '@vue/compiler-dom'
import postcss from 'postcss'

const root = resolve('resources/js/src')
const violations = []

function inspectComments(source, filename) {
    const syntax = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true)
    const positions = new Set()
    function visit(node) {
        for (const position of [node.pos, node.end]) {
            for (const comment of ts.getLeadingCommentRanges(source, position) ?? []) {
                positions.add(comment.pos)
            }
            for (const comment of ts.getTrailingCommentRanges(source, position) ?? []) {
                positions.add(comment.pos)
            }
        }
        ts.forEachChild(node, visit)
    }
    visit(syntax)
    for (const position of positions) {
        if (!/^(?:\/\*!|\/\*\*?\s*@license)/.test(source.slice(position))) {
            violations.push(`${filename}: explanatory code comment`)
        }
    }
    return syntax
}

function inspectImports(source, filename) {
    const imports = ts.preProcessFile(source).importedFiles
    const owner = relative(root, filename).replaceAll('\\', '/')
    for (const dependency of imports) {
        const name = dependency.fileName
        const target = name.startsWith('@/')
            ? name.slice(2)
            : name.startsWith('.')
              ? relative(root, resolve(dirname(filename), name)).replaceAll('\\', '/')
              : name
        const forbidden = owner.startsWith('services/')
            ? /^(router|stores|components|views|vue-router|pinia)(\/|$)/
            : owner.startsWith('components/ui/')
              ? /^(api|services|stores|router|views)(\/|$)/
              : owner.startsWith('core/types/')
                ? /^(api|services|stores|router|views)(\/|$)/
                : undefined
        if (forbidden?.test(target)) violations.push(`${owner}: forbidden dependency ${name}`)
    }
}

function inspectTemplate(node, filename) {
    if (node.type === NodeTypes.COMMENT) violations.push(`${filename}: HTML comment`)
    if ('children' in node) {
        for (const child of node.children) inspectTemplate(child, filename)
    }
}

function inspectStyle(source, filename) {
    postcss.parse(source).walkComments((comment) => {
        if (!comment.text.startsWith('!') && !comment.text.startsWith('@license')) {
            violations.push(`${filename}: CSS comment`)
        }
    })
}

function inspectFile(filename) {
    const source = readFileSync(filename, 'utf8')
    if (filename.endsWith('.vue')) {
        const { descriptor } = parse(source, { filename })
        for (const script of [descriptor.script, descriptor.scriptSetup]) {
            if (script) {
                inspectComments(script.content, filename)
                inspectImports(script.content, filename)
            }
        }
        if (descriptor.template) inspectTemplate(baseParse(descriptor.template.content), filename)
        for (const style of descriptor.styles) inspectStyle(style.content, filename)
    } else if (filename.endsWith('.ts')) {
        inspectComments(source, filename)
        inspectImports(source, filename)
    } else if (filename.endsWith('.css')) {
        inspectStyle(source, filename)
    }
}

function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const filename = resolve(directory, entry.name)
        if (entry.isDirectory()) walk(filename)
        else inspectFile(filename)
    }
}

walk(root)
if (violations.length) {
    console.error(violations.join('\n'))
    process.exitCode = 1
} else {
    console.log('Frontend comments and layer boundaries passed.')
}
