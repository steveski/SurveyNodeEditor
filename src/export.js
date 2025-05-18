export function exp(graph) {
  const visited = new Set();
  const output = [];

  // Convert graph.links to array from internal map
  const linkList = Object.values(graph.links);

  function walkQuestionNode(node) {
    if (!node || visited.has(node.id)) return;
    visited.add(node.id);

    const q = { ...node.properties };
    if (q.parentId === null) delete q.parentId;
    if (q.triggerAnswerId === null) delete q.triggerAnswerId;
    q.SurveyAnswers = [];

    output.push(q);

    const outPin = node.outputs?.find((o) => o.name === "Out");
    if (outPin?.links?.length) {
      for (const lid of outPin.links) {
        const link = graph.links[lid];
        if (!link) continue;

        const nextNode = graph.getNodeById(link.target_id);
        if (
          nextNode &&
          nextNode.type === "survey/question" &&
          !visited.has(nextNode.id)
        ) {
          walkQuestionNode(nextNode);
        }
      }
    }
  }

  // Find root questions (no 'In' input link)
  const rootQuestions = graph._nodes.filter(
    (n) =>
      n.type === "survey/question" &&
      (!n.inputs || !n.inputs.find((i) => i.name === "In")?.link)
  );

  for (const root of rootQuestions) {
    walkQuestionNode(root);
  }

  return output;
}
