[![NPM](https://nodei.co/npm/markdown-to-quill-delta.png)](https://nodei.co/npm/markdown-to-quill-delta/)  
[![Build Status](https://travis-ci.org/frysztak/markdown-to-quill-delta.svg?branch=master)](https://travis-ci.org/frysztak/markdown-to-quill-delta)

## Markdown to Quill Delta converter

Converts Markdown to [Quill Delta](https://quilljs.com/docs/delta/) using [remark](https://github.com/remarkjs/remark).

## Status

| Feature      | Status |
| ------------ | ------ |
| Paragraphs   | ✅     |
| Headers      | ✅     |
| Text styling | ✅     |
| Code blocks  | ✅     |
| Quote blocks | ❌     |
| Lists        | ✅     |
| Checkboxes   | ✅     |
| Links        | ✅¹    |
| Images       | ✅     |

¹: reference-style links are not yet supported

## Usage

```typescript
import markdownToDelta from "markdown-to-quill-delta";
const ops = markdownToDelta(markdown);
```

## What about Delta to Markdown?

See [here](https://github.com/frysztak/quill-delta-to-markdown).

## License

Developed by Sebastian Frysztak.  
Licensed under ISC License.
