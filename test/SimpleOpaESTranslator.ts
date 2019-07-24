/**
 * @author Jacky Jiang
 * @description A simple rego rule to Elasticsearch Query translator
 */

import * as _ from "lodash";
import { CompleteRuleResult } from "opa-compile-response-parser";

const rangeQuery = (ref: string, opereator: string, value: number | string) => {
    let esOpt: string;
    switch (opereator) {
        case ">":
            esOpt = "gt";
            break;
        case ">=":
            esOpt = "gte";
            break;
        case "<":
            esOpt = "lt";
            break;
        case "<=":
            esOpt = "lte";
            break;
        default:
            throw new Error("Unsupport operator for RangeQuery: " + opereator);
    }
    return {
        range: {
            [ref]: {
                [esOpt]: value
            }
        }
    };
};

class SimpleOpaESTranslator {
    private refPrefixs: string[] = [];

    constructor(unknowns: string[] = []) {
        this.refPrefixs = unknowns.map(s => s + ".");
    }

    parse(result: CompleteRuleResult, sqlParametersArray: any[] = []) {
        if (result === null) return { match_none: {} }; // --- no matched rules
        if (result.isCompleteEvaluated) {
            if (result.value === false) return { match_none: {} };
            else
                return {
                    match_all: {}
                };
        }
        if (!result.residualRules.length) {
            throw new Error("residualRules cannot be empty array!");
        }
        const ruleQueries = result.residualRules.map(r => {
            const queries = r.expressions.map(e => {
                if (e.terms.length === 1) {
                    const term = e.terms[0];
                    if (term.isRef()) {
                        if (!e.isNegated) {
                            return {
                                exists: {
                                    field: term.fullRefString(this.refPrefixs)
                                }
                            };
                        } else {
                            return {
                                must_not: {
                                    exists: {
                                        field: term.fullRefString(
                                            this.refPrefixs
                                        )
                                    }
                                }
                            };
                        }
                    } else {
                        const value = term.getValue();
                        // --- we convert any value to boolean before generate ES Query
                        return !!value
                            ? {
                                  match_all: {}
                              }
                            : {
                                  match_none: {}
                              };
                    }
                } else if (e.terms.length === 3) {
                    let [operator, operands] = e.toOperatorOperandsArray();

                    let ref: string, value: any;

                    if (operands[0].isRef() && operands[1].isRef()) {
                        throw new Error(
                            `operands cannot both be references: ${e.termsAsString()}`
                        );
                    }

                    if (!operands[0].isRef() && !operands[1].isRef()) {
                        throw new Error(
                            `operands cannot both be value: ${e.termsAsString()}`
                        );
                    }

                    operands.map(op => {
                        if (op.isRef()) {
                            ref = op.fullRefString(this.refPrefixs);
                        } else {
                            value = op.getValue();
                        }
                    });

                    if (!operands[0].isRef()) {
                        // --- the first operand is not ref
                        // --- e.g. `2 <= document.number`
                        // --- we need to make adjustments to operator
                        switch (operator) {
                            case ">":
                                operator = "<";
                                break;
                            case ">=":
                                operator = "<=";
                                break;
                            case "<":
                                operator = ">";
                                break;
                            case "<=":
                                operator = ">=";
                                break;
                        }
                    }

                    let esQuery: any;

                    if (operator === "=") {
                        esQuery = {
                            term: {
                                [ref]: {
                                    value
                                }
                            }
                        };
                    } else if (operator === "!=") {
                        esQuery = {
                            must_not: {
                                term: {
                                    [ref]: {
                                        value
                                    }
                                }
                            }
                        };
                    } else {
                        esQuery = rangeQuery(ref, operator, value);
                    }

                    if (e.isNegated)
                        return {
                            must_not: esQuery
                        };
                    else {
                        return esQuery;
                    }
                } else {
                    throw new Error(
                        `Invalid 3 terms expression: ${e.termsAsString()}`
                    );
                }
            });
            if (queries.length) {
                return {
                    bool: {
                        must: queries
                    }
                };
            } else {
                return { match_none: {} };
            }
        });

        if (ruleQueries.length) {
            return {
                bool: {
                    should: ruleQueries,
                    minimum_should_match: 1
                }
            };
        } else {
            return { match_none: {} };
        }
    }
}

export default SimpleOpaESTranslator;
