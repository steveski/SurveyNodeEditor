export function exp(graph) {
  const visited = new Set();
  const output = [];

  function walkQuestionNode(node) {
    if (!node || visited.has(node.id)) return;
    visited.add(node.id);

    const q = { ...node.properties };
    if (q.parentId === null) delete q.parentId;
    if (q.triggerAnswerId === null) delete q.triggerAnswerId;
    q.SurveyAnswers = [];

    output.push(q);

    // Find answers connected to this question's "Answers" slot
    const answersSlotIndex = node.outputs.findIndex(
      (o) => o.name === "Answers"
    );
    const answerLinks = Object.values(graph.links).filter(
      (link) =>
        link.origin_id === node.id && link.origin_slot === answersSlotIndex
    );

    for (const link of answerLinks) {
      const answerNode = graph.getNodeById(link.target_id);
      if (!answerNode || answerNode.type !== "survey/answer") continue;

      const answerData = { ...answerNode.properties };

      // Follow answer's output to next question
      const answerOut = answerNode.outputs?.[0];
      if (answerOut?.links?.length) {
        for (const nextLinkId of answerOut.links) {
          const nextLink = graph.links[nextLinkId];
          const nextQ = nextLink && graph.getNodeById(nextLink.target_id);
          if (nextQ?.type === "survey/question") {
            answerData.triggersQuestionId = nextQ.properties.surveyQuestionId;
            walkQuestionNode(nextQ);
          }
        }
      }

      q.SurveyAnswers.push(answerData);
    }

    // Follow "Out" → next question
    const outSlotIndex = node.outputs.findIndex((o) => o.name === "Out");
    const outLinks = Object.values(graph.links).filter(
      (link) => link.origin_id === node.id && link.origin_slot === outSlotIndex
    );

    for (const link of outLinks) {
      const nextQ = graph.getNodeById(link.target_id);
      if (nextQ && nextQ.type === "survey/question" && !visited.has(nextQ.id)) {
        walkQuestionNode(nextQ);
      }
    }
  }

  // Start from any root (no input "In" link)
  const roots = graph._nodes.filter(
    (n) =>
      n.type === "survey/question" &&
      (!n.inputs || !n.inputs.find((i) => i.name === "In")?.link)
  );

  for (const root of roots) walkQuestionNode(root);

  return output;
}
