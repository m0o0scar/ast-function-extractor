# JavaScript Function Analyzer

This module provides a powerful tool for analyzing JavaScript code and extracting detailed information about functions, methods, and their relationships.

## Features

- Parses JavaScript code using the tree-sitter parser
- Extracts information about functions, including:
  - Function names
  - Parameters
  - Return types (inferred)
  - Class membership (for methods)
  - Called functions within each function
- Handles various function types:
  - Function declarations
  - Arrow functions
  - Method definitions
  - Function expressions
- Identifies async functions
- Detects nested functions (and excludes them from the output)
- Tracks class instances and their method calls

## Usage

```javascript
import { analyzeFunctions } from './path-to-module/index.mjs';

const code = `
// Your JavaScript code here
`;

const functionInfo = analyzeFunctions(code);
console.log(JSON.stringify(functionInfo, null, 2));
```

## Output

The `analyzeFunctions` function returns an array of objects, each representing a function or method in the analyzed code. Each object may contain the following properties:

- `name`: The name of the function
- `parameters`: The parameters of the function as a string
- `returnType`: The inferred return type of the function
- `class`: (Optional) The name of the class if the function is a method
- `call`: (Optional) An array of function names called within this function

## Dependencies

- `tree-sitter`: For parsing JavaScript code
- `tree-sitter-javascript`: Grammar for JavaScript parsing

## Limitations

- Return type inference is basic and may not accurately reflect complex types
- Nested functions are not included in the output
- Some complex JavaScript patterns may not be fully captured

## Example

```javascript
const code = `
async function hello() {
  console.log('Hello, world!');
}

const greet = (name) => {
  hello();
  console.log('Hello, ' + name + '!');
};

class MyClass {
  method(a, b) {
    console.log('Method called');
  }
}
`;

const result = analyzeFunctions(code);
console.log(JSON.stringify(result, null, 2));
```

This will output detailed information about the functions in the provided code.

## Contributing

Contributions to improve the function analysis or add new features are welcome. Please submit issues and pull requests on the project's repository.
