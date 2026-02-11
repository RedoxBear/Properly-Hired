# Derived Writing Pattern Specs

Reusable patterns for generation and QA. Source-independent and IP-safe.

## Patterns
- arc (Action-Result-Context): slots=[action_verb, result_metric, context_scope] rules=[must_include_metric_or_scale, must_specify_scope]
- star (Situation-Task-Action-Result): slots=[situation, task, action, result] rules=[result_should_include_quant_or_business_effect]
- carl (Challenge-Action-Result-Learning): slots=[challenge, action, result, learning] rules=[learning_must_show_growth_or_transferability]
- value_proposition (Role-Fit Value Proposition): slots=[target_role, core_strength, business_value, proof_signal] rules=[proof_signal_required]

## Constraints
- allow_direct_legacy_phrases: False
- require_candidate_specific_evidence: True
- require_role_specific_keywords: True
