export function exportSurveyFlow(graph) {
  const output = {
    Questions: [],
    Answers: []
  };
  const questions = graph._nodes.filter(n => n.type === "survey/question");
  const answers = graph._nodes.filter(n => n.type === "survey/answer");

  const nonConditional = questions.filter(q => !q.properties.conditionalQuestionFlag);
  const conditional = questions.filter(q => q.properties.conditionalQuestionFlag);

  function extractAnswers(questionNode) {
    const answers = [];
    const answerOutput = questionNode.outputs?.find(o => o.name === "Answers");
    const slotIndex = questionNode.outputs.indexOf(answerOutput);
    if (!answerOutput || !Array.isArray(answerOutput.links)) return answers;

    for (const linkId of answerOutput.links) {
      const link = graph.links[linkId];
      if (!link || link.origin_slot !== slotIndex) continue;

      const answerNode = graph.getNodeById(link.target_id);
      if (!answerNode || answerNode.type !== "survey/answer") continue;

      const {
        answerText,
        surveyAnswerId,
        surveyQuestionId,
        answerId,
        answerOrderNumber
      } = answerNode.properties;

      answers.push({
        SurveyAnswerId: surveyAnswerId,
        SurveyQuestionId: surveyQuestionId,
        AnswerId: answerId,
        AnswerOrderNumber: answerOrderNumber
      });
    }

    return answers;
  }

  for (const q of nonConditional) {
    const {
      surveyQuestionId,
      questionTypeCode,
      questionText,
      questionOrderNumber,
      conditionalQuestionFlag
    } = q.properties;

    const entry = {
      SurveyQuestionID: surveyQuestionId,
      QuestionId: 999999,
      QuestionTypeCode: questionTypeCode,
      QuestionText: questionText,
      QuestionOrderNumber: questionOrderNumber,
      IsConditionalQuestion: !!conditionalQuestionFlag
    };

    if (questionTypeCode !== "FTEXT") {
      entry.surveyAnswers = extractAnswers(q);
    }

    output.Questions.push(entry);
  }

  for (const q of conditional) {
    const {
      surveyQuestionId,
      questionTypeCode,
      questionText,
      questionOrderNumber,
      conditionalQuestionFlag
    } = q.properties;

    const conditionalEntry = {
      SurveyQuestionId: surveyQuestionId,
      QuestionId: 999999,
      QuestionTypeCode: questionTypeCode,
      QuestionText: questionText,
      QuestionOrderNumber: questionOrderNumber,
      IsConditionalQuestion: !!conditionalQuestionFlag,
      ConditionalQuestions: []
    };

    // 🧠 Fix: Properly trace back to the parent answer node
    const parentLinkId = q.inputs?.find(i => i.name === "In")?.link;
    const parentLink = parentLinkId != null ? graph.links[parentLinkId] : null;

    if (parentLink && parentLink.origin_id != null) {
      const parentAnswerNode = graph.getNodeById(parentLink.origin_id);
      if (parentAnswerNode?.type === "survey/answer") {
        conditionalEntry.ConditionalQuestions.push({
          ParentSurveyQuestionId: parentAnswerNode.properties.surveyQuestionId,
          ExpectedSurveyAnswerId: parentAnswerNode.properties.surveyAnswerId,
          SurveyQuestionId: surveyQuestionId
        });
      }
    }

    if (questionTypeCode !== "FTEXT") {
      conditionalEntry.surveyAnswers = extractAnswers(q);
    }

    output.Questions.push(conditionalEntry);
  }

  // Build Answers array
  output.Answers = answers
  .map(n => ({
    SurveyQuestionId: n.properties.surveyQuestionId,
    SurveyAnswerId: n.properties.surveyAnswerId,
    AnswerOrderNumber: n.properties.answerOrderNumber,
    AnswerText: n.properties.answerText,
    AnswerId: n.properties.answerId
  }))
  .sort((a, b) =>
    a.SurveyQuestionId - b.SurveyQuestionId || a.AnswerOrderNumber - b.AnswerOrderNumber
  );

  return output;
}
