# json-parser

To install dependencies:

```bash
bun install
```

To run, import the `parse` function into a new file:

```js
// ./newFile.ts
import { parse } from "./index.ts"

console.log(parse(`{
  "foo": {
    "bar": [
      123,
      false,
      null,
      {
        "baz": "biz"
      }
    ]
  }
}`))
```

then run via

```bash
bun run newFile.ts
```

This project was created using `bun init` in bun v1.2.1. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
