import Parser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';

/**
 * @typedef {Object} FunctionDeclaration
 * @property {string} type
 * @property {string} name
 * @property {Parser.Point} startPosition
 * @property {Parser.Point} endPosition
 */

/**
 * Extracts named function declarations from the given JavaScript code
 * @param {string} code - The JavaScript code to analyze
 * @returns {FunctionDeclaration[]} - An array of function declarations
 */
function getFunctionDeclarations(code) {
  const parser = new Parser();
  parser.setLanguage(JavaScript);
  const tree = parser.parse(code);
  const functionDeclarations = [];

  /**
   * Recursive function to traverse the syntax tree
   * @param {Parser.SyntaxNode} node - The current node in the AST
   * @param {string|null} currentClass - The name of the current class (if any)
   * @param {boolean} insideFunction - Flag to indicate if we're inside a function
   */
  function traverseTree(node, currentClass = null, insideFunction = false) {
    if (node.type === 'class_declaration' || node.type === 'class') {
      const nameNode = node.childForFieldName('name');
      if (nameNode) {
        currentClass = nameNode.text;
      }
    }

    if ((node.type === 'function_declaration' ||
      node.type === 'method_definition' ||
      node.type === 'arrow_function') && !insideFunction) {

      let functionName = null;
      let signature = '';

      if (node.type === 'function_declaration') {
        const nameNode = node.childForFieldName('name');
        const parametersList = node.childForFieldName('parameters');
        if (nameNode) {
          functionName = nameNode.text;
          signature = `${functionName}${parametersList.text}`;
        }
      } else if (node.type === 'method_definition') {
        const nameNode = node.childForFieldName('name');
        const parametersList = node.childForFieldName('parameters');
        if (nameNode) {
          functionName = nameNode.text;
          signature = currentClass ? `${currentClass}.${functionName}${parametersList.text}` : `${functionName}${parametersList.text}`;
        }
      } else if (node.type === 'arrow_function') {
        // Check if the arrow function is assigned to a variable
        if (node.parent && node.parent.type === 'variable_declarator') {
          const nameNode = node.parent.childForFieldName('name');
          if (nameNode) {
            functionName = nameNode.text;
            const parametersList = node.childForFieldName('parameters');
            signature = `${functionName}${parametersList.text}`;
          }
        }
      }

      // Only add the function declaration if it has a name
      if (functionName) {
        functionDeclarations.push({
          type: node.type,
          name: signature || functionName,
          startPosition: node.startPosition,
          endPosition: node.endPosition
        });
      }

      // Set insideFunction to true for all children of this function
      for (let child of node.children) {
        traverseTree(child, currentClass, true);
      }
    } else {
      for (let child of node.children) {
        traverseTree(child, currentClass, insideFunction);
      }
    }
  }

  traverseTree(tree.rootNode);
  return functionDeclarations;
}

// Example usage
const code = `
async function hello() {
  const foo = () => 123;
  console.log('Hello, world!');
}

const greet = (name) => {
  console.log('Hello, ' + name + '!');
};

class MyClass {
  method(a, b, c=1) {
    console.log('Method called');
  }
}

(async () => {
  await hello();
})

function namedFunction() {}

const anotherNamedFunction = function() {};

const arrowFunction = () => {};

(function() {})();
`;

const result = getFunctionDeclarations(code);
console.log(result);
