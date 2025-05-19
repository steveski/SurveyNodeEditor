export function exp(graph) {
  const visited = new Set();
  const output = {
    questions: []
  };

  function walkQuestionNode(node) {
    if (!node || visited.has(node.id)) return;
    visited.add(node.id);

    const question = {
      surveyQuestionId: node.properties.surveyQuestionId,
      questionTypeCode: node.properties.questionTypeCode,
      questionText: node.properties.questionText,
      questionOrderNumber: node.properties.questionOrderNumber,
      IsConditionalQuestion: !!node.properties.conditionalQuestionFlag,
      surveyAnswers: []
    };

    // Pull answers in order of answerOrderNumber
    const answersSlotIndex = node.outputs.findIndex((o) => o.name === "Answers");
    const answerLinks = Object.values(graph.links).filter(
      (link) =>
        link.origin_id === node.id && link.origin_slot === answersSlotIndex
    );

    const answers = answerLinks
      .map((link) => graph.getNodeById(link.target_id))
      .filter((n) => n?.type === "survey/answer")
      .map((a) => ({ ...a.properties }))
      .sort((a, b) => (a.answerOrderNumber || 0) - (b.answerOrderNumber || 0));

    if (node.properties.questionTypeCode !== "FTEXT") {
      question.surveyAnswers = answers;
    }

    output.questions.push(question);

    // Follow "Out" → next question
    const outSlotIndex = node.outputs.findIndex((o) => o.name === "Out");
    const outLinks = Object.values(graph.links).filter(
      (link) => link.origin_id === node.id && link.origin_slot === outSlotIndex
    );

    for (const link of outLinks) {
      const nextQ = graph.getNodeById(link.target_id);
      if (
        nextQ &&
        nextQ.type === "survey/question" &&
        !visited.has(nextQ.id) &&
        !nextQ.properties.conditionalQuestionFlag // ❌ skip conditional questions
      ) {
        walkQuestionNode(nextQ);
      }
    }
  }

  // Start from the first question in the canvas (leftmost)
  const roots = graph._nodes
    .filter((n) => n.type === "survey/question" && !n.properties.conditionalQuestionFlag)
    .sort((a, b) => (a.pos?.[0] ?? 0) - (b.pos?.[0] ?? 0));

  if (roots.length) {
    walkQuestionNode(roots[0]);
  }

  return output;
}