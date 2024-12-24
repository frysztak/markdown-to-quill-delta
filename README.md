[![NPM](https://nodei.co/npm/markdown-to-quill-delta.png)](https://nodei.co/npm/markdown-to-quill-delta/)  
[![Build Status](https://travis-ci.org/frysztak/markdown-to-quill-delta.svg?branch=master)](https://travis-ci.org/frysztak/markdown-to-quill-delta)

## Markdown to Quill Delta converter

Converts Markdown to [Quill Delta](https://quilljs.com/docs/delta/) using [remark](https://github.com/remarkjs/remark).

## Status

| Feature          | Status |
| ---------------- | ------ |
| Paragraphs       | ✅     |
| Headers          | ✅     |
| Text             | ✅     |
| Strong           | ✅     |
| Emphasis         | ✅     |
| Delete           | ✅     |
| Code blocks      | ✅     |
| Quote blocks     | ✅     |
| Lists            | ✅     |
| Checkboxes       | ✅     |
| Links            | ✅¹    |
| Images           | ✅     |
| Custom Extension | ✅     |

¹: reference-style links are not yet supported

## Usage

```ts
import markdownToDelta from 'markdown-to-quill-delta'
const ops = markdownToDelta(markdown)
```

Custom Extension:

```ts
import markdownToDelta from 'markdown-to-quill-delta'
const input = '---'
const ops = markdownToDelta(input, {
  handle: ({ node, ops }) => {
    if (node.type === 'thematicBreak') {
      ops.push(
        {
          attributes: {
            class: 'cut-off',
          },
          insert: {
            'cut-off': {
              type: '0',
              url: 'https://i0.hdslb.com/bfs/article/0117cbba35e51b0bce5f8c2f6a838e8a087e8ee7.png',
            },
          },
        },
        {
          insert: '\n',
        },
      )
      return true
    }
  },
})
```

## What about Delta to Markdown?

See [here](https://github.com/frysztak/quill-delta-to-markdown).

## License

Developed by Sebastian Frysztak.  
Licensed under ISC License.
