import { InlineMath, BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'

const SafeInline = ({ math }) => {
  try { return <InlineMath math={math} /> }
  catch { return <code className="text-primary/80 text-sm font-mono bg-primary/10 px-1 rounded">{math}</code> }
}

const SafeBlock = ({ math }) => {
  try { return <BlockMath math={math} /> }
  catch { return <pre className="text-primary/80 text-sm font-mono bg-primary/10 p-2 rounded-lg overflow-x-auto">{math}</pre> }
}

// ---------------------------------------------------------------------------
// LaTeX sanitising
// ---------------------------------------------------------------------------
// KaTeX maps the Unicode middle dot "·" to \cdotp, which is only defined in
// math mode. LLMs love writing units as \text{Н·с}, and inside \text{} that
// becomes a red "\cdotp". Split the text group around the operator instead:
//   \text{Н·с}  →  \text{Н}\cdot\text{с}
const TEXT_GROUP = /\\(text|textrm|textit|textbf|mathrm|mathit|mathbf|operatorname)\{([^{}]*)\}/g
const TEXT_OPS = { '·': '\\cdot', '⋅': '\\cdot', '×': '\\times', '÷': '\\div' }

// Imported lectures glue Greek macros to the next symbol ("\\Deltax", "\\omegat"),
// which KaTeX reads as one undefined command. Re-insert the space.
const GREEK = /\\(Delta|Gamma|Theta|Lambda|Omega|Phi|Pi|Psi|Sigma|alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|lambda|mu|nu|xi|pi|rho|sigma|tau|phi|varphi|chi|psi|omega)(?=[A-Za-z])/g

export function sanitizeLatex(src) {
  if (!src) return src
  src = src.replace(GREEK, '\\$1 ')
  return src.replace(TEXT_GROUP, (whole, cmd, body) => {
    if (!/[·⋅×÷]/.test(body)) return whole
    return body
      .split(/([·⋅×÷])/)
      .map(part => TEXT_OPS[part] ?? (part ? `\\${cmd}{${part}}` : ''))
      .join('')
  })
}

// ---------------------------------------------------------------------------
// Markdown-lite for the prose between formulas
// ---------------------------------------------------------------------------
// Supports: **bold**, __bold__, `code`, "### heading" lines, "- " bullets.
// Deliberately tiny — the AI is asked for short answers, not documents.
const INLINE_MD = /(\*\*[^*\n]+?\*\*|__[^_\n]+?__|`[^`\n]+?`)/g

function renderInline(text, keyBase) {
  const nodes = []
  const re = new RegExp(INLINE_MD.source, 'g')
  let last = 0
  let m
  let k = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const raw = m[0]
    if (raw.startsWith('`')) {
      nodes.push(<code key={`${keyBase}-c${k++}`} className="font-mono text-[0.9em] text-primary bg-primary/10 px-1 rounded">{raw.slice(1, -1)}</code>)
    } else {
      nodes.push(<strong key={`${keyBase}-b${k++}`} className="font-semibold text-text-1">{raw.slice(2, -2)}</strong>)
    }
    last = m.index + raw.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function renderProse(text, keyBase, atLineStart) {
  const lines = text.split('\n')
  const out = []
  lines.forEach((line, i) => {
    const isLineStart = i > 0 || atLineStart
    let node = null

    const heading = isLineStart && /^\s{0,3}#{1,6}\s+(.*)$/.exec(line)
    const bullet = isLineStart && /^(\s*)[-*•]\s+(.*)$/.exec(line)

    if (heading) {
      node = <span key={`${keyBase}-h${i}`} className="block font-bold text-text-1 mt-1">{renderInline(heading[1], `${keyBase}-h${i}`)}</span>
    } else if (bullet) {
      node = <span key={`${keyBase}-l${i}`}>{bullet[1]}•&nbsp;{renderInline(bullet[2], `${keyBase}-l${i}`)}</span>
    } else {
      node = <span key={`${keyBase}-p${i}`}>{renderInline(line, `${keyBase}-p${i}`)}</span>
    }

    out.push(node)
    if (i < lines.length - 1) out.push('\n')
  })
  return out
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------
// Formula delimiters: $$...$$ (block), $...$ (inline), \[...\] (block), \(...\) (inline)
const FORMULA = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g

function stripDelimiters(raw) {
  if (raw.startsWith('$$')) return raw.slice(2, -2)
  if (raw.startsWith('$')) return raw.slice(1, -1)
  return raw.slice(2, -2) // \[ \] or \( \)
}

/**
 * Renders mixed prose + LaTeX. Prose gets Markdown-lite (bold, code,
 * headings, bullets); formulas go through KaTeX after sanitising.
 */
export default function FormulaRenderer({ formula, text, inline = false, glow = false }) {
  const content = formula || text
  if (!content) return null

  // Pure inline mode: the whole thing is one formula
  if (inline) {
    const clean = content.replace(/^\$+/, '').replace(/\$+$/, '')
    return <SafeInline math={sanitizeLatex(clean)} />
  }

  // 1. Tokenise into prose / inline formula / block formula
  const tokens = []
  const re = new RegExp(FORMULA.source, 'g')
  let lastIdx = 0
  let match
  while ((match = re.exec(content)) !== null) {
    if (match.index > lastIdx) tokens.push({ type: 'text', value: content.slice(lastIdx, match.index), start: lastIdx })
    const raw = match[0]
    const block = raw.startsWith('$$') || raw.startsWith('\\[')
    tokens.push({ type: block ? 'block' : 'inline', value: sanitizeLatex(stripDelimiters(raw).trim()) })
    lastIdx = match.index + raw.length
  }
  if (lastIdx < content.length) tokens.push({ type: 'text', value: content.slice(lastIdx), start: lastIdx })

  // No delimiters at all — treat as a bare formula (legacy `formula` prop usage)
  if (tokens.length === 1 && tokens[0].type === 'text' && formula) {
    return glow
      ? <div className="formula-block"><SafeBlock math={sanitizeLatex(content)} /></div>
      : <SafeBlock math={sanitizeLatex(content)} />
  }

  // 2. Trim blank lines that hug block formulas — BlockMath brings its own margin
  tokens.forEach((t, i) => {
    if (t.type !== 'text') return
    if (tokens[i - 1]?.type === 'block') t.value = t.value.replace(/^\n+/, '')
    if (tokens[i + 1]?.type === 'block') t.value = t.value.replace(/\n+$/, '')
  })

  // 3. Render
  const nodes = []
  tokens.forEach((t, i) => {
    if (t.type === 'text') {
      if (!t.value) return
      const atLineStart = t.start === 0 || content[t.start - 1] === '\n'
      nodes.push(
        <span key={i} className="text-text-1 whitespace-pre-wrap text-sm leading-relaxed">
          {renderProse(t.value, `t${i}`, atLineStart)}
        </span>
      )
    } else if (t.type === 'block') {
      nodes.push(
        <div key={i} className={glow ? 'formula-block my-3' : 'my-2'}>
          <SafeBlock math={t.value} />
        </div>
      )
    } else {
      nodes.push(<SafeInline key={i} math={t.value} />)
    }
  })

  return <div className="formula-wrap">{nodes}</div>
}
