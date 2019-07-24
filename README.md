# opa-compile-response-parser

An Open Policy Agent Compile Response Parser

[Open Policy Agent](https://www.openpolicyagent.org/) provides a [compile API](https://www.openpolicyagent.org/docs/latest/rest-api/#compile-api) that allows you partially evaluate your policy. 

This library can parse the compile JSON response and allow you to access the [Rego](https://www.openpolicyagent.org/docs/latest/how-do-i-write-policies/#what-is-rego) AST (Abstract Syntax Tree) in the response body by Rego language structure.

Moreover, it further processes the AST to:
- eliminate tautological rules 
  - e.g. r { x; false }
- replace rule reference with inline value
  - e.g. r1 { r2 } r2 { true } => r1 { true }

Example:
```typescript
import OpaCompileResponseParser from "OpaCompileResponseParser";

const parser = new OpaCompileResponseParser();
parser.parse(jsonResponse);

const result = parser.evaluate();
/**
 returned evaluate result:
    interface CompleteRuleResult {
        fullName: string;
        name: string;
        value: RegoValue;
        isCompleteEvaluated: boolean;
        residualRules?: RegoRule[];
    }
*/

// --- Print residual rules as human readable string
console.log(parser.evaluateAsHumanReadableString());
```

### Todo

- replace rule reference with inline rules

### Compatibility

Work with Open Policy Agent version 0.11.0 or higher.

### API document

https://t83714.github.io/opa-compile-response-parser/