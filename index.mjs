import Parser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';

/**
 * Analyzes JavaScript code and extracts function information.
 * @param {string} code - The JavaScript code to analyze.
 * @returns {Array<Object>} An array of function information objects.
 */
function analyzeFunctions(code) {
  // Initialize the parser with JavaScript grammar
  const parser = new Parser();
  parser.setLanguage(JavaScript);
  const tree = parser.parse(code);

  const functions = [];
  let currentClass = null;

  /**
   * Traverses the AST and extracts function information.
   * @param {Object} node - The current AST node.
   */
  function traverse(node) {
    switch (node.type) {
      case 'class_declaration':
        // Track the current class name
        currentClass = node.children.find(
          (child) => child.type === 'identifier'
        ).text;
        break;
      case 'method_definition':
      case 'function_declaration':
      case 'lexical_declaration':
      case 'variable_declaration':
        // Extract function information for relevant node types
        const func = extractFunctionInfo(node, currentClass);
        if (func) functions.push(func);
        break;
    }

    // Recursively traverse child nodes
    for (let child of node.children) {
      traverse(child);
    }

    // Reset currentClass when exiting a class declaration
    if (node.type === 'class_declaration') {
      currentClass = null;
    }
  }

  /**
   * Extracts function information from a node.
   * @param {Object} node - The AST node representing a function.
   * @param {string|null} className - The name of the class if the function is a method.
   * @returns {Object|null} Function information object or null if not a function.
   */
  function extractFunctionInfo(node, className) {
    try {
      let functionNode,
        name,
        isArrow = false;

      // Determine the function type and extract relevant information
      if (node.type === 'method_definition') {
        functionNode = node;
        name = node.children.find(
          (child) => child.type === 'property_identifier'
        ).text;
      } else if (node.type === 'function_declaration') {
        functionNode = node;
        name = node.children.find((child) => child.type === 'identifier').text;
      } else if (
        node.type === 'lexical_declaration' ||
        node.type === 'variable_declaration'
      ) {
        // Handle arrow functions and function expressions
        const declarator = node.children.find(
          (child) => child.type === 'variable_declarator'
        );
        if (!declarator) return null;

        const value = declarator.children.find(
          (child) =>
            child.type === 'arrow_function' || child.type === 'function'
        );
        if (!value) return null;

        functionNode = value;
        name = declarator.children.find(
          (child) => child.type === 'identifier'
        ).text;
        isArrow = value.type === 'arrow_function';
      }

      if (!functionNode) return null;

      // Ignore nested functions
      if (isNestedFunction(node)) return null;

      // Extract function details
      const parameters = functionNode.children.find(
        (child) => child.type === 'formal_parameters'
      ).text;
      const isAsync = functionNode.children.some(
        (child) => child.type === 'async'
      );
      const returnType = determineReturnType(functionNode, isAsync, isArrow);
      const calledFunctions = extractCalledFunctions(functionNode, className);

      // Construct the function information object
      const functionInfo = { name, parameters, returnType };
      if (className) functionInfo.class = className;
      if (calledFunctions.length > 0) functionInfo.call = calledFunctions;

      return functionInfo;
    } catch (error) {
      console.error('Error in extractFunctionInfo:', error);
      console.error('Node:', JSON.stringify(node, null, 2));
      return null;
    }
  }

  /**
   * Checks if a function is nested inside another function.
   * @param {Object} node - The AST node to check.
   * @returns {boolean} True if the function is nested, false otherwise.
   */
  function isNestedFunction(node) {
    let parent = node.parent;
    while (parent) {
      if (
        parent.type === 'function' ||
        parent.type === 'method_definition' ||
        parent.type === 'arrow_function' ||
        parent.type === 'function_declaration'
      ) {
        return true;
      }
      parent = parent.parent;
    }
    return false;
  }

  /**
   * Determines the return type of a function.
   * @param {Object} node - The function node.
   * @param {boolean} isAsync - Whether the function is async.
   * @param {boolean} isArrow - Whether the function is an arrow function.
   * @returns {string} The determined return type.
   */
  function determineReturnType(node, isAsync, isArrow) {
    if (isAsync) return 'Promise<void>';
    if (isArrow) {
      const body = node.children.find(
        (child) =>
          child.type === 'statement_block' || child.type === 'expression'
      );
      if (body && body.type === 'expression') return 'any';
      if (!body) return 'any';
    }
    const returnStatement = findReturnStatement(node);
    if (returnStatement) {
      const returnExpression = returnStatement.children.find(
        (child) => child.type !== 'return'
      );
      if (returnExpression) {
        if (returnExpression.type === 'number') return 'number';
        if (returnExpression.type === 'string') return 'string';
        // Add more types as needed
      }
    }
    return 'void';
  }

  /**
   * Finds a return statement in a function node.
   * @param {Object} node - The function node to search.
   * @returns {Object|null} The return statement node or null if not found.
   */
  function findReturnStatement(node) {
    if (node.type === 'return_statement') return node;
    for (let child of node.children) {
      const result = findReturnStatement(child);
      if (result) return result;
    }
    return null;
  }

  /**
   * Extracts called functions from a function node.
   * @param {Object} node - The function node to analyze.
   * @param {string|null} className - The name of the class if the function is a method.
   * @returns {Array<string>} An array of called function names.
   */
  function extractCalledFunctions(node, className) {
    const calledFunctions = new Set();
    const classInstances = new Map();

    function traverseForCalls(n) {
      if (n.type === 'variable_declarator') {
        // Track class instances
        const id = n.children.find((child) => child.type === 'identifier');
        const init = n.children.find(
          (child) => child.type === 'new_expression'
        );
        if (id && init) {
          const className = init.children.find(
            (child) => child.type === 'identifier'
          )?.text;
          if (className) {
            classInstances.set(id.text, className);
          }
        }
      } else if (n.type === 'call_expression') {
        // Extract called function names
        let functionName = n.children[0].text;
        if (n.children[0].type === 'member_expression') {
          const object = n.children[0].children[0].text;
          const property = n.children[0].children[2].text;
          if (object !== 'console') {
            if (classInstances.has(object)) {
              functionName = `${classInstances.get(object)}.${property}`;
            } else {
              functionName = `${object}.${property}`;
            }
          }
        }
        if (functionName !== 'console.log') {
          calledFunctions.add(functionName);
        }
      }
      // Recursively traverse child nodes
      for (let child of n.children) {
        traverseForCalls(child);
      }
    }

    traverseForCalls(node);
    return Array.from(calledFunctions);
  }

  // Start the traversal from the root node
  traverse(tree.rootNode);
  return functions;
}

// Example usage:
const code = `
async function hello() {
  const foo = () => 123;
  console.log('Hello, world!');
}

const greet = (name) => {
  hello();
  console.log('Hello, ' + name + '!');
  return 123;
};

class MyClass {
  async method(a, b, c=1) {
    console.log('Method called');
    return 'abc';
  }
}

(async () => {
  await hello();
})

function namedFunction() {
  greet('John');
  hello();
  const instance = new MyClass();
  instance.method(1, 2, 3);
}

const anotherNamedFunction = function() {};

const aaa = async () => {};

(function() {})();
`;

console.log(JSON.stringify(analyzeFunctions(code), null, 2));
