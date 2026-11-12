// An independent reader of a stylesheet's text: its rules, their
// declarations, and nested rules (CSS Syntax 3 §5: a rule is a prelude and a
// {} block; a block holds declarations "name: value", separated by ";", and
// nested rules). Strings, comments, escapes, and () [] blocks hide their
// contents. It does not use typography.js's code.

export type Rule = {
  prelude: string
  declarations: Array<[string, string]>
  rules: Array<Rule>
}

export class StylesheetError extends Error {}

/** Reads `text` as a list of rules. Throws StylesheetError on a block, string, or comment that does not close. */
export function readStylesheet(text: string): Array<Rule> {
  let i = 0
  const fail = (why: string): never => {
    throw new StylesheetError(`${why} at ${i}`)
  }
  // Skips one string, comment, escape, or () [] block, if one starts at i.
  const skipAtom = (): boolean => {
    const c = text[i]
    if (c === '\\') {
      i += 2
      return true
    }
    if (c === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2)
      if (end < 0) fail('an unterminated comment')
      i = end + 2
      return true
    }
    if (c === '"' || c === "'") {
      i++
      while (i < text.length && text[i] !== c) {
        if (text[i] === '\n') fail('a line break in a string')
        i += text[i] === '\\' ? 2 : 1
      }
      if (i >= text.length) fail('an unterminated string')
      i++
      return true
    }
    if (c === '(' || c === '[') return skipBlock(c === '(' ? ')' : ']')
    return false
  }
  // A () [] block, or a {} block inside one: a value's block, not a rule.
  const skipBlock = (close: string): boolean => {
    const open = text[i]
    i++
    while (i < text.length && text[i] !== close) {
      if (skipAtom()) continue
      if (text[i] === '{') {
        skipBlock('}')
        continue
      }
      if (text[i] === '}' || text[i] === ')' || text[i] === ']' || (text[i] === ';' && close !== '}')) fail(`a "${text[i]}" inside ${open}`)
      i++
    }
    if (i >= text.length) fail(`an unclosed ${open}`)
    i++
    return true
  }
  // Reads rules and declarations until a "}" (inside a block) or the end.
  const readBlock = (inside: boolean): Rule => {
    const block: Rule = { prelude: '', declarations: [], rules: [] }
    let start = i
    for (;;) {
      if (i >= text.length) {
        if (inside) fail('an unclosed {')
        const tail = text.slice(start).trim()
        if (tail) fail(`text after the last rule: ${JSON.stringify(tail.slice(0, 40))}`)
        return block
      }
      if (skipAtom()) continue
      const c = text[i]
      // A custom property's value may hold a {} block (CSS Syntax 3 §5.4.6):
      // a declaration is read before a nested rule.
      if (c === '{' && inside && /^\s*--[^:]*:/.test(text.slice(start, i))) {
        skipBlock('}')
        continue
      }
      if (c === '{') {
        const prelude = text.slice(start, i).trim()
        i++
        const child = readBlock(true)
        child.prelude = prelude
        block.rules.push(child)
        start = i
      } else if (c === '}') {
        if (!inside) fail('a "}" with no rule open')
        const tail = text.slice(start, i).trim()
        if (tail) block.declarations.push(declaration(tail))
        i++
        return block
      } else if (c === ';') {
        const piece = text.slice(start, i).trim()
        if (piece) {
          if (!inside) fail('a declaration outside a rule')
          block.declarations.push(declaration(piece))
        }
        i++
        start = i
      } else i++
    }
  }
  const declaration = (piece: string): [string, string] => {
    const colon = piece.indexOf(':')
    if (colon <= 0) fail(`a declaration without a name: ${JSON.stringify(piece.slice(0, 40))}`)
    return [piece.slice(0, colon).trim(), piece.slice(colon + 1).trim()]
  }
  return readBlock(false).rules
}
