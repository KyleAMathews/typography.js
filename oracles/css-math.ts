// CSS Values 4 §10 math functions, as a generated grammar and a model. A
// tree types itself by the specification's rules; numeric-typography.oracle.ts
// judges production with it, and a Chrome probe calibrates it.
import fc from "fast-check"

export type MathNode =
  | { kind: "num"; n: number; unit: "" | "px" | "em" | "%" | "deg" | "s" }
  // "var" is the bare word, not a reference: a word CSS math rejects.
  | { kind: "const"; name: "pi" | "e" | "infinity" | "-infinity" | "var" }
  | { kind: "var" }
  | { kind: "group"; inner: MathNode; pad: boolean }
  // `space`: white space on both sides of the operator, none, or one side.
  // An operator "" puts two operands side by side.
  | { kind: "op"; left: MathNode; op: "+" | "-" | "*" | "/" | ""; right: MathNode; space: Space }
  | MathCall
// "comment" and "comment-tight": a comment beside the operator, with white
// space around it or without. A comment is not white space (CSS Syntax 3).
export type Space = "both" | "none" | "left" | "right" | "comment" | "comment-tight"
// `pad`: white space inside the parentheses and around each comma.
// `strategy`: round()'s rounding strategy, or that word without its comma.
export type MathCall = { kind: "fn"; name: string; args: Array<MathNode>; strategy: "up" | "up-no-comma" | undefined; pad: boolean | "comment" }
// A type (CSS Values 4 §10.9, Typed OM): each base type's power; {} is a
// number. "any" is a value the browser types: a var(), or a function this
// grammar does not know.
export type MathType = { [base: string]: number } | "any" | undefined

const MATH_NAMES = ["calc", "min", "max", "clamp", "round", "mod", "rem", "abs", "sign", "sin", "cos", "tan", "asin", "acos", "atan", "atan2", "pow", "sqrt", "hypot", "log", "exp"] as const
export const mathTree = fc.letrec<{ node: MathNode; call: MathCall }>((tie) => ({
  // Weighted toward typed values: a var() makes the value valid without
  // typing, so it is a rare leaf.
  node: fc.oneof(
    { depthSize: "small", withCrossShrink: true },
    { weight: 8, arbitrary: fc.record({
      kind: fc.constant("num" as const),
      n: fc.double({ min: -4, max: 4, noNaN: true, noDefaultInfinity: true }),
      unit: fc.constantFrom("" as const, "px" as const, "em" as const, "%" as const, "deg" as const, "s" as const),
    }) },
    { weight: 2, arbitrary: fc.record({ kind: fc.constant("const" as const), name: fc.constantFrom("pi" as const, "e" as const, "infinity" as const, "-infinity" as const, "var" as const) }) },
    { weight: 1, arbitrary: fc.record({ kind: fc.constant("var" as const) }) },
    { weight: 1, arbitrary: fc.record({ kind: fc.constant("group" as const), inner: tie("node"), pad: fc.boolean() }) },
    {
      weight: 3,
      arbitrary: fc.record({
        kind: fc.constant("op" as const),
        left: tie("node"),
        op: fc.constantFrom("+" as const, "-" as const, "*" as const, "/" as const, "" as const),
        right: tie("node"),
        space: fc.oneof({ weight: 4, arbitrary: fc.constant("both" as const) }, { weight: 1, arbitrary: fc.constantFrom("none" as const, "left" as const, "right" as const, "comment" as const, "comment-tight" as const) }),
      }),
    },
    { weight: 3, arbitrary: tie("call") }
  ),
  call: fc.record({
    kind: fc.constant("fn" as const),
    // "sibling-index" stands for a function this grammar does not know.
    name: fc.constantFrom<string>(...MATH_NAMES, "sibling-index"),
    // Mostly one to three arguments, where each signature's limits fall.
    args: fc.oneof({ weight: 6, arbitrary: fc.array(tie("node"), { minLength: 1, maxLength: 3 }) }, { weight: 1, arbitrary: fc.array(tie("node"), { minLength: 0, maxLength: 4 }) }),
    strategy: fc.oneof({ weight: 5, arbitrary: fc.constant(undefined) }, { weight: 1, arbitrary: fc.constantFrom("up" as const, "up-no-comma" as const) }),
    pad: fc.constantFrom<boolean | "comment">(false, true, "comment"),
  }),
}))

// The text CSS reads. An operation inside another is in parentheses, so the
// text has the tree's structure.
export function mathText(node: MathNode): string {
  switch (node.kind) {
    case "num":
      return `${node.n}${node.unit}`
    case "const":
      return node.name
    case "var":
      return "var(--lh)"
    case "group":
      return node.pad ? `( ${mathText(node.inner)} )` : `(${mathText(node.inner)})`
    case "op": {
      const side = (n: MathNode) => (n.kind === "op" ? `(${mathText(n)})` : mathText(n))
      if (node.op === "") return `${side(node.left)} ${side(node.right)}`
      const before = { both: " ", left: " ", none: "", right: "", comment: " /**/ ", "comment-tight": "/**/" }[node.space]
      const after = { both: " ", right: " ", none: "", left: "", comment: " /**/ ", "comment-tight": "/**/" }[node.space]
      return `${side(node.left)}${before}${node.op}${after}${side(node.right)}`
    }
    case "fn": {
      const args = node.args.map(mathText)
      const comma = node.pad === "comment" ? "/**/,/**/" : node.pad ? " , " : ", "
      const list = node.strategy === "up-no-comma" ? `up ${args.join(comma)}` : [...(node.strategy ? [node.strategy] : []), ...args].join(comma)
      return node.pad === "comment" ? `${node.name}(/**/${list}/**/)` : node.pad ? `${node.name}( ${list} )` : `${node.name}(${list})`
    }
  }
}

// CSS Values 4 §10.9 type checking, on the tree (Editor's Draft 24 Aug 2026:
// "At a * sub-expression, multiply the types"; at "/", multiply by the
// inverted type of the right side).
type Typed = { [base: string]: number }
const typeOf = (base: string): Typed => ({ [base]: 1 })
const NUMBER: Typed = {}
const same = (a: Typed, b: Typed) =>
  Object.keys({ ...a, ...b }).every((k) => (a[k] ?? 0) === (b[k] ?? 0))
const multiply = (a: MathType, b: MathType, sign: 1 | -1): MathType => {
  if (!a || !b) return undefined
  if (a === "any" || b === "any") return "any"
  const out: Typed = { ...a }
  for (const [k, v] of Object.entries(b)) out[k] = (out[k] ?? 0) + sign * v
  for (const k of Object.keys(out)) if (out[k] === 0) delete out[k]
  return out
}
// "+", "-", and the comparison functions need one type.
const combine = (a: MathType, b: MathType): MathType => {
  if (!a || !b) return undefined
  if (a === "any") return b
  if (b === "any") return a
  return same(a, b) ? a : undefined
}
// A CSS type: a number, or one base type to the power 1. Every math function,
// and every argument of one, resolves to a CSS type, or is invalid (§10.9:
// "If it can't match any of these, the math function is invalid"; §10.6
// "argument calculations can resolve to any <number>, <dimension>, or
// <percentage>"): length² is only an intermediate result.
const isCssType = (t: MathType) => t === "any" || (!!t && Object.values(t).every((v) => v === 1) && Object.keys(t).length <= 1)
const isNumberLike = (t: MathType) => t === "any" || (!!t && same(t, NUMBER))
const isAngleOrNumber = (t: MathType) => isNumberLike(t) || (!!t && t !== "any" && same(t, typeOf("angle")))
// [fewest arguments, most arguments, result type from the argument types]
export const MATH_SIGNATURES: Record<string, [number, number, (types: Array<MathType>) => MathType]> = {
  calc: [1, 1, ([a]) => a],
  min: [1, Infinity, (ts) => ts.reduce(combine)],
  max: [1, Infinity, (ts) => ts.reduce(combine)],
  hypot: [1, Infinity, (ts) => ts.reduce(combine)],
  clamp: [3, 3, (ts) => ts.reduce(combine)],
  // round(A) omits its step only when A is a number (§10.6).
  round: [1, 2, (ts) => (ts.length === 1 && !isNumberLike(ts[0]) ? undefined : ts.reduce(combine))],
  mod: [2, 2, (ts) => ts.reduce(combine)],
  rem: [2, 2, (ts) => ts.reduce(combine)],
  abs: [1, 1, ([a]) => a],
  sign: [1, 1, () => NUMBER],
  sin: [1, 1, ([a]) => (isAngleOrNumber(a) ? NUMBER : undefined)],
  cos: [1, 1, ([a]) => (isAngleOrNumber(a) ? NUMBER : undefined)],
  tan: [1, 1, ([a]) => (isAngleOrNumber(a) ? NUMBER : undefined)],
  asin: [1, 1, ([a]) => (isNumberLike(a) ? typeOf("angle") : undefined)],
  acos: [1, 1, ([a]) => (isNumberLike(a) ? typeOf("angle") : undefined)],
  atan: [1, 1, ([a]) => (isNumberLike(a) ? typeOf("angle") : undefined)],
  atan2: [2, 2, (ts) => (ts.reduce(combine) ? typeOf("angle") : undefined)],
  pow: [2, 2, (ts) => (ts.every(isNumberLike) ? NUMBER : undefined)],
  sqrt: [1, 1, ([a]) => (isNumberLike(a) ? NUMBER : undefined)],
  exp: [1, 1, ([a]) => (isNumberLike(a) ? NUMBER : undefined)],
  log: [1, 2, (ts) => (ts.every(isNumberLike) ? NUMBER : undefined)],
}
export function mathTypeOf(node: MathNode): MathType {
  switch (node.kind) {
    case "num":
      // A percentage in line-height is of the font size: its percent hint is
      // a length (§10.9.1).
      return node.unit === "" ? NUMBER : node.unit === "deg" ? typeOf("angle") : node.unit === "s" ? typeOf("time") : typeOf("length")
    case "const":
      return node.name === "var" ? undefined : NUMBER
    case "var":
      return "any"
    case "group":
      return mathTypeOf(node.inner)
    case "op": {
      // "+" and "-" need white space on both sides (§10.8); a comment is not
      // white space; two operands need an operator between them.
      const spaced = node.space === "both" || node.space === "comment"
      // "pi-var(" and "pi-sin(" are one function token each, named "pi-var"
      // and "pi-sin" (CSS Syntax 3 §4.3.4): a function the grammar does not know.
      if (node.op === "-" && node.space === "none" && node.left.kind === "const" && (node.right.kind === "var" || node.right.kind === "fn"))
        return "any"
      if (node.op === "" || ((node.op === "+" || node.op === "-") && !spaced)) return undefined
      const l = mathTypeOf(node.left)
      const r = mathTypeOf(node.right)
      if (node.op === "+" || node.op === "-") return combine(l, r)
      return multiply(l, r, node.op === "*" ? 1 : -1)
    }
    case "fn": {
      const signature = MATH_SIGNATURES[node.name]
      // A function the grammar does not know is the browser's to type, once it
      // is safe CSS, as every generated one is (engineer decision 2026-11-12,
      // review W6).
      if (!signature) return "any"
      if ((node.strategy && node.name !== "round") || node.strategy === "up-no-comma") return undefined
      const [fewest, most, result] = signature
      // A rounding strategy needs a value after it: round(up) has none.
      if (node.args.length < fewest || node.args.length > most || (node.strategy && node.args.length === 0)) return undefined
      const types = node.args.map(mathTypeOf)
      if (!types.every(isCssType)) return undefined
      const type = result(types)
      return isCssType(type) ? type : undefined
    }
  }
}
// line-height takes a number, a length, or a percentage (CSS Inline 3), or a
// value the browser types.
export const lineHeightAccepts = (t: MathType) =>
  t === "any" || (!!t && (same(t, NUMBER) || same(t, typeOf("length"))))
// Whether the text holds a real var() reference. A var() right after a "-"
// with no space is not one: "pi-var(" is a function named pi-var (CSS Syntax
// 3 §4.3.4), so CSS checks that value at parse time.
export const hasRealVar = (node: MathNode): boolean => {
  if (node.kind === "var") return true
  if (node.kind === "group") return hasRealVar(node.inner)
  if (node.kind === "op")
    return (
      hasRealVar(node.left) ||
      (!(node.op === "-" && (node.space === "none" || node.space === "left") && node.right.kind === "var") && hasRealVar(node.right))
    )
  if (node.kind === "fn") return node.args.some(hasRealVar)
  return false
}
// A value with a var() reference is valid when CSS parses it, and is checked
// only after substitution (CSS Variables 1 §3); any other is typed here.
export const mathAccepted = (call: MathCall) => hasRealVar(call) || lineHeightAccepts(mathTypeOf(call))
// Whether some operation or call has typed operands that do not combine.
export const hasMismatch = (node: MathNode): boolean => {
  if (node.kind === "group") return hasMismatch(node.inner)
  if (node.kind === "op") {
    const l = mathTypeOf(node.left)
    const r = mathTypeOf(node.right)
    const spaced = node.op === "*" || node.op === "/" || ((node.op === "+" || node.op === "-") && (node.space === "both" || node.space === "comment"))
    return hasMismatch(node.left) || hasMismatch(node.right) || (!!l && !!r && spaced && mathTypeOf(node) === undefined)
  }
  if (node.kind === "fn") {
    const signature = MATH_SIGNATURES[node.name]
    // The browser types an unknown function and its arguments.
    if (!signature) return false
    const typed = node.args.every((a) => mathTypeOf(a) !== undefined)
    const fits = !!signature && !node.strategy && node.args.length >= signature[0] && node.args.length <= signature[1]
    return node.args.some(hasMismatch) || (fits && typed && mathTypeOf(node) === undefined)
  }
  return false
}

export const mathFeatures = (node: MathNode, out: Set<string> = new Set()): Set<string> => {
  if (node.kind === "op") {
    if ((node.op === "+" || node.op === "-") && node.space !== "both" && node.space !== "comment") out.add("+ or - without white space")
    if (node.space === "comment" || node.space === "comment-tight") out.add("a comment")
    if (node.op === "") out.add("two operands side by side")
    mathFeatures(node.left, out)
    mathFeatures(node.right, out)
  } else if (node.kind === "group") {
    out.add("a group")
    mathFeatures(node.inner, out)
  } else if (node.kind === "fn") {
    out.add(MATH_SIGNATURES[node.name] ? "a math function" : "an unknown function")
    if (node.pad === "comment") out.add("a comment")
    if (node.strategy) out.add("a rounding strategy")
    if (node.pad) out.add("padded parentheses")
    for (const arg of node.args) mathFeatures(arg, out)
  } else if (node.kind === "var") out.add("a var() inside")
  return out
}

// One valid call of each function with its fewest numeric arguments, wrapped
// so that line-height accepts the result (an angle goes through sin()); and
// one call with an argument too many or too few.
const num = (n: number, unit: "" | "px" | "deg" = ""): MathNode => ({ kind: "num", n, unit })
const fn = (name: string, args: Array<MathNode>, strategy?: "up"): MathCall => ({ kind: "fn", name, args, strategy, pad: false })
const angleResult = /^(?:asin|acos|atan|atan2)$/
export const mathWitnesses = (): Array<{ name: string; call: MathCall }> =>
  Object.entries(MATH_SIGNATURES).flatMap(([name, [fewest, most]]) => {
    const args = Array.from({ length: fewest }, (_, k) => num(k === 0 ? 0.5 : 1))
    const call = fn(name, args)
    const valid = angleResult.test(name) ? fn("sin", [call]) : call
    const wrongCount = fn(name, Array.from({ length: Number.isFinite(most) ? most + 1 : 0 }, () => num(1)))
    return [
      { name: `${name}() with its arguments`, call: valid },
      { name: `${name}() with ${Number.isFinite(most) ? most + 1 : 0} arguments`, call: wrongCount },
    ]
  })
