# JavaScript Function Declaration Extractor

This project provides a tool to parse JavaScript source code and extract function declarations. It uses the tree-sitter parser to analyze the abstract syntax tree (AST) of the JavaScript code and identify various types of function declarations.

## How It Works

### 1. Parsing the Code

We use the `tree-sitter` library along with the `tree-sitter-javascript` grammar to parse JavaScript code into an Abstract Syntax Tree (AST). This gives us a structured representation of the code that we can traverse and analyze.

```javascript
const parser = new Parser();
parser.setLanguage(JavaScript);
const tree = parser.parse(code);
```

### 2. Traversing the AST

We recursively traverse the AST using a depth-first search approach. This allows us to examine each node in the tree and identify function declarations.

### 3. Identifying Function Declarations

We look for three types of function declarations:

1. Function Declarations: `function foo() {}`
2. Method Definitions: `class MyClass { myMethod() {} }`
3. Arrow Functions: `const foo = () => {}`

We identify these by checking the `type` property of each node:

```javascript
if (node.type === 'function_declaration' ||
    node.type === 'method_definition' ||
    node.type === 'arrow_function') {
  // Process the function declaration
}
```

### 4. Extracting Function Information

For each function declaration, we extract:
- The function name
- The function signature (including parameters)
- The start and end positions in the source code

### 5. Handling Special Cases

- **Class Methods**: We keep track of the current class name to properly name class methods.
- **Anonymous Functions**: We ignore functions without names.
- **Nested Functions**: We only extract top-level function declarations, ignoring functions defined within other functions.

### 6. Returning Results

We return an array of objects, each representing a function declaration with its type, name, and position in the source code.

## Usage

```javascript
import { getFunctionDeclarations } from './functionExtractor.js';

const code = `
function hello() {
  console.log('Hello, world!');
}

const greet = (name) => {
  console.log('Hello, ' + name + '!');
};

class MyClass {
  method() {
    console.log('Method called');
  }
}
`;

const result = getFunctionDeclarations(code);
console.log(result);
```

This will output an array of function declarations found in the code, including their names, types, and positions.

## Limitations

- The extractor does not handle every possible edge case in JavaScript syntax.
- It does not extract functions from more complex patterns, such as functions returned from other functions.
- It does not analyze the content or behavior of the functions, only their declarations.

## Dependencies

- `tree-sitter`: For parsing JavaScript code into an AST.
- `tree-sitter-javascript`: Provides the JavaScript grammar for tree-sitter.

## Future Improvements

- Handle more complex JavaScript patterns.
- Provide options to customize the extraction process (e.g., include anonymous functions, nested functions).
- Add support for TypeScript and other JavaScript variants.
```

This README provides an overview of how the function declaration extraction works, explains the main steps in the process, gives a usage example, and mentions some limitations and potential future improvements. You can adjust or expand this README as needed to fit your specific implementation or add more details about setup, installation, or advanced usage.