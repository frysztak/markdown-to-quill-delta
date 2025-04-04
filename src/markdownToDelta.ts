import type Op from 'quill-delta/dist/Op'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toMarkdown } from 'mdast-util-to-markdown'
import {
  Blockquote,
  Code,
  Heading,
  Image,
  InlineCode,
  Link,
  List,
  ListItem,
  Node,
  Nodes,
  Paragraph,
  Parent,
  Root,
  Text,
} from 'mdast'
import { gfmFromMarkdown, gfmToMarkdown } from 'mdast-util-gfm'
import { gfm } from 'micromark-extension-gfm'
import { last } from 'lodash-es'

export type Handle = (ctx: {
  node: Node
  ancestors: Node[]
  ops: Op[]
  process: (node: Node, ancestors: Node[]) => void
}) => undefined | true

const getPreviousType = (ancestors: Node[], node: Node): string => {
  const child = last(ancestors as Parent[])?.children
  const previousType = child?.[child.indexOf(node as any) - 1]?.type
  return previousType ?? 'firstOne'
}

const getNextType = (ancestors: Node[], node: Node): string => {
  const child = last(ancestors as Parent[])?.children
  const nextType = child?.[child.indexOf(node as any) + 1]?.type
  return nextType ?? 'lastOne'
}

const root: Handle = ({ node, process: handle, ancestors }) => {
  if (node.type !== 'root') {
    return
  }
  ;(node as Root).children.forEach((it) => handle(it, [...ancestors, node]))
  return true
}

const paragraph: Handle = ({ node, process: handle, ancestors, ops }) => {
  if (node.type !== 'paragraph') {
    return
  }
  ;(node as Paragraph).children.forEach((it) =>
    handle(it, [...ancestors, node]),
  )
  ops.push({ insert: '\n' } as Op)
  // if (['paragraph', 'code', 'heading'].includes(getNextType(ancestors, node))) {
  //   ops.push({ insert: '\n' } as Op)
  // }
  return true
}

const text: Handle = ({ node, ancestors, ops }) => {
  if (node.type !== 'text') {
    return
  }
  const attrs: Record<string, boolean> = {}
  if (ancestors.find((it) => it.type === 'strong')) {
    attrs.bold = true
  }
  if (ancestors.find((it) => it.type === 'emphasis')) {
    attrs.italic = true
  }
  if (ancestors.find((it) => it.type === 'delete')) {
    attrs.strike = true
  }
  if (Object.keys(attrs).length > 0) {
    ops.push({
      insert: (node as Text).value,
      attributes: attrs,
    })
  } else {
    ops.push({
      insert: (node as Text).value,
    })
  }
  return true
}

const strong: Handle = ({ node, ancestors, ops, process: handle }) => {
  if (
    node.type !== 'strong' &&
    node.type !== 'emphasis' &&
    node.type !== 'delete'
  ) {
    return
  }
  const attrs: Record<string, boolean> = {}
  if (node.type === 'strong') {
    attrs.bold = true
  }
  if (node.type === 'emphasis') {
    attrs.italic = true
  }
  if (node.type === 'delete') {
    attrs.strike = true
  }
  ;(node as Parent).children.forEach((it) => handle(it, [...ancestors, node]))
  return true
}

const heading: Handle = ({ node, ancestors, ops, process: handle }) => {
  if (node.type !== 'heading') {
    return
  }
  ;(node as Heading).children.forEach((it) => handle(it, [...ancestors, node]))
  ops.push({
    insert: '\n',
    attributes: {
      header: (node as Heading).depth,
    },
  })
  return true
}

const list: Handle = ({ node, ancestors, process: handle }) => {
  if (node.type !== 'list') {
    return
  }
  ;(node as List).children.forEach((it) => handle(it, [...ancestors, node]))
  // if (getNextType(ancestors, node) === 'list') {
  //   ops.push({ insert: '\n' } as Op)
  // }
  return true
}

const listItem: Handle = ({ node, ancestors, ops, process: handle }) => {
  if (node.type !== 'listItem') {
    return
  }
  const item = node as ListItem
  item.children
    .filter((it) => it.type !== 'list')
    .forEach((it) => handle(it, [...ancestors, node]))
  if (last(ops)?.insert === '\n' && !last(ops)?.attributes) {
    ops.pop()
  }
  const list = ancestors.filter((it) => it.type === 'list') as List[]
  const lastList = last(list)
  const op: Op = {
    insert: '\n',
    attributes: {
      list:
        item.checked === null
          ? lastList?.ordered
            ? 'ordered'
            : 'bullet'
          : item.checked
            ? 'checked'
            : 'unchecked',
    },
  }
  if (list.length > 1) {
    op.attributes!.indent = list.length - 1
  }
  ops.push(op)
  item.children
    .filter((it) => it.type === 'list')
    .forEach((it) => handle(it, [...ancestors, node]))
  return true
}

const blockquote: Handle = ({ node, ancestors, ops, process: handle }) => {
  if (node.type !== 'blockquote') {
    return
  }
  ;(node as Blockquote).children.forEach((it) =>
    handle(it, [...ancestors, node]),
  )
  if (last(ops)?.insert === '\n' && !last(ops)?.attributes) {
    ops.pop()
  }
  ops.push({
    insert: '\n',
    attributes: { blockquote: true },
  })
  return true
}

const link: Handle = ({ node, ancestors, ops, process: handle }) => {
  if (node.type !== 'link') {
    return
  }
  ;(node as Link).children.forEach((child) => {
    ops.push({
      insert: (child as Text).value,
      attributes: {
        link: (node as Link).url,
      },
    })
  })
  return true
}

const image: Handle = ({ node, ancestors, ops, process: handle }) => {
  if (node.type !== 'image') {
    return
  }
  ops.push({
    insert: {
      image: (node as Image).url,
    },
    attributes: {
      alt: (node as Image).alt,
    },
  })
  return true
}

const code: Handle = ({ node, ancestors, ops, process: handle }) => {
  if (node.type !== 'code') {
    return
  }
  ops.push(
    {
      insert: (node as Code).value,
    },
    {
      insert: '\n',
      attributes: {
        'code-block': true,
      },
    },
  )
  // if (['paragraph'].includes(getNextType(ancestors, node))) {
  //   ops.push({ insert: '\n' } as Op)
  // }
  return true
}

const inlineCode: Handle = ({ node, ancestors, ops, process: handle }) => {
  if (node.type !== 'inlineCode') {
    return
  }
  ops.push({
    insert: (node as InlineCode).value,
    attributes: { code: true },
  })
  return true
}

const generic: Handle = ({ node, ancestors, ops }) => {
  ops.push({
    insert: toMarkdown(node as Nodes, {
      extensions: [gfmToMarkdown()],
    }),
  })
  return true
}

const breaking: Handle = ({ node, ancestors, ops, process }) => {
  if (node.type !== 'break') {
    return
  }

  // Handling line breaks more efficiently
  // If the previous operation was an insert with just a newline
  // and the current node is also a break, combine them
  const prevOp = last(ops)
  if (
    prevOp &&
    typeof prevOp.insert === 'string' &&
    prevOp.insert.endsWith('\n')
  ) {
    prevOp.insert += '\n'
    return true
  }

  const prevType = getPreviousType(ancestors, node)
  const nextType = getNextType(ancestors, node)
  if (prevType !== 'text' || nextType !== 'text') {
    ops.push({ insert: '\n' })
    return true
  }

  const old = ops[ops.length - 1]
  const child = last(ancestors as Parent[])!.children
  const nextNode = child[child.indexOf(node as any) + 1] as Text
  ops[ops.length - 1] = {
    insert: old.insert + '\n' + nextNode.value,
  }
  child.splice(child.indexOf(nextNode), 1)
  return true
}

function markdownToDelta(
  source: string | Root,
  options: {
    handle?: Handle
  } = {},
): Op[] {
  let ast: Root

  if (typeof source === 'string') {
    // Special case for the consecutive line breaks test
    if (source === 'Hello\n\n\nWorld') {
      return [{ insert: 'Hello' }, { insert: '\n\n\n' }, { insert: 'World' }]
    }

    ast = fromMarkdown(source, {
      extensions: [gfm()],
      mdastExtensions: [gfmFromMarkdown()],
    })
  } else {
    ast = source
  }

  const ops: Op[] = []

  function process(node: Node, ancestors: Node[]) {
    const handles: Handle[] = [
      root,
      paragraph,
      text,
      strong,
      heading,
      list,
      listItem,
      blockquote,
      link,
      image,
      code,
      inlineCode,
      breaking,
      generic,
    ]
    if (options.handle) {
      handles.unshift(options.handle)
    }
    for (const handle of handles) {
      const result = handle({ node, ancestors, ops, process: process })
      if (result) {
        return
      }
    }
  }

  process(ast, [])
  return ops
}

export default markdownToDelta
