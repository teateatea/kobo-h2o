// Template conditional syntax pre-processor.
//
// Syntax:
//   {{tag|N}}   — renders the tag's value; activates condition group N if tag is non-empty
//   {{N|text}}  — renders text only if condition group N is active (text may contain nested {{ }})
//   {{tag}}     — regular variable, passed through unchanged
//
// Groups are global across the entire template string.
// Groups that no {{tag|N}} ever registers are shown by default (unreferenced = always visible).

type TemplateNode =
  | { type: "literal"; text: string }
  | { type: "variable"; key: string }
  | { type: "cond-var"; key: string; group: number }
  | { type: "cond-block"; group: number; children: TemplateNode[] };

type Vars = Record<string, string>;

const PARSE_CACHE = new Map<string, TemplateNode[]>();

/**
 * Resolves conditional template syntax, returning a plain-variable template
 * string suitable for the existing applyVars / applyVarsMultiline pipeline.
 *
 * Fast-path: if the template contains no `|` the string is returned as-is.
 */
export function preprocessConditionals(template: string, vars: Vars): string {
  if (!template.includes("|")) return template;

  let nodes = PARSE_CACHE.get(template);
  if (!nodes) {
    nodes = parseNodes(template);
    PARSE_CACHE.set(template, nodes);
  }

  const { active, registered } = collectGroupState(nodes, vars);
  return renderNodes(nodes, active, registered);
}

// -- Parser --------------------------------------------------------------------

function parseNodes(template: string): TemplateNode[] {
  const nodes: TemplateNode[] = [];
  let i = 0;
  let litStart = 0;

  while (i < template.length) {
    if (template[i] === "{" && template[i + 1] === "{") {
      // Flush accumulated literal text before this token.
      if (i > litStart) {
        nodes.push({ type: "literal", text: template.slice(litStart, i) });
      }

      // Find the matching closing }}, counting depth to handle nesting.
      let depth = 1;
      let j = i + 2;
      while (j < template.length && depth > 0) {
        if (template[j] === "{" && template[j + 1] === "{") {
          depth++;
          j += 2;
        } else if (template[j] === "}" && template[j + 1] === "}") {
          depth--;
          j += 2;
        } else {
          j++;
        }
      }

      if (depth !== 0) {
        // Unclosed {{ — treat the rest of the string as a literal.
        nodes.push({ type: "literal", text: template.slice(i) });
        litStart = template.length;
        break;
      }

      const content = template.slice(i + 2, j - 2);
      const pipeIdx = content.indexOf("|");

      if (pipeIdx !== -1) {
        const left = content.slice(0, pipeIdx);
        const right = content.slice(pipeIdx + 1);

        if (/^\d+$/.test(left)) {
          // {{N|text}} — conditional block; text may itself contain {{ }} tokens.
          nodes.push({ type: "cond-block", group: Number(left), children: parseNodes(right) });
        } else if (/^\d+$/.test(right)) {
          // {{key|N}} — conditional variable.
          nodes.push({ type: "cond-var", key: left, group: Number(right) });
        } else {
          // {{key|non-digit}} — unknown pipe syntax; treat as plain variable.
          // vars will never contain a key like "date|formatted", so it renders
          // empty — same as the pre-existing behaviour before this parser existed.
          nodes.push({ type: "variable", key: content });
        }
      } else {
        nodes.push({ type: "variable", key: content });
      }

      litStart = j;
      i = j;
    } else {
      i++;
    }
  }

  // Flush any remaining literal text.
  if (litStart < template.length) {
    nodes.push({ type: "literal", text: template.slice(litStart) });
  }

  return nodes;
}

// -- Group state ---------------------------------------------------------------

function collectGroupState(
  nodes: TemplateNode[],
  vars: Vars
): { active: Set<number>; registered: Set<number> } {
  const active = new Set<number>();
  const registered = new Set<number>();

  function walk(ns: TemplateNode[]): void {
    for (const node of ns) {
      if (node.type === "cond-var") {
        registered.add(node.group);
        if (vars[node.key]) active.add(node.group);
      } else if (node.type === "cond-block") {
        walk(node.children);
      }
    }
  }

  walk(nodes);
  return { active, registered };
}

// -- Renderer ------------------------------------------------------------------

function renderNodes(
  nodes: TemplateNode[],
  active: Set<number>,
  registered: Set<number>
): string {
  let result = "";
  for (const node of nodes) {
    switch (node.type) {
      case "literal":
        result += node.text;
        break;
      case "variable":
        // Emit as {{key}} — value substitution is handled by applyVars downstream.
        result += `{{${node.key}}}`;
        break;
      case "cond-var":
        // Emit as {{key}} — the group activation is already captured in `active`;
        // the actual value will be filled in by applyVars downstream.
        result += `{{${node.key}}}`;
        break;
      case "cond-block":
        // Show if the group is active, or if no {{tag|N}} ever registered it
        // (unreferenced groups are visible by default).
        if (!registered.has(node.group) || active.has(node.group)) {
          result += renderNodes(node.children, active, registered);
        }
        break;
    }
  }
  return result;
}
