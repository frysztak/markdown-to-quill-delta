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

not yet

## License

Developed by Sebastian Frysztak.  
Licensed under ISC License.
