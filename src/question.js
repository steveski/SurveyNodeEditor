import { LiteGraph } from "litegraph.js";

export default class QuestionNode extends LiteGraph.LGraphNode {
  constructor(editor) {
    super();
    this.editor = editor;
    this.addInput("In", LiteGraph.EVENT);
    this.addOutput("Out", LiteGraph.EVENT);
    this.addOutput("Answers", LiteGraph.EVENT);
    this.properties = {
      surveyQuestionId: Math.floor(Math.random() * 1000),
      questionText: "Untitled Question",
      questionOrderNumber: 1,
      questionTypeCode: "SSELCT",
      conditionalQuestionFlag: false,
      expectedSurveyAnswerId: null,
    };
    this.updateTitle();
  }

  onAdded() {
    this.updateTitle();
  }

  onPropertyChanged(name, value) {
    if (name === "questionText" || name === "surveyQuestionId") {
      this.updateTitle();
      this.setDirtyCanvas(true, true);
    }
  }

  onInspect(inspector) {
    inspector.addString("Question Text", this.properties.questionText, (v) => {
      this.properties.questionText = v;
      this.updateTitle();
      this.setDirtyCanvas(true, true);
    });
    inspector.addNumber(
      "Survey Question ID",
      this.properties.surveyQuestionId,
      (v) => {
        this.properties.surveyQuestionId = v;
        this.updateTitle();
        this.setDirtyCanvas(true, true);
      }
    );
  }

  updateTitle() {
    const text = `SQ: ${this.properties.surveyQuestionId}: ${this.properties.questionText}`;
    this.title = text;

    const ctx = this.getCanvasContext?.() || this.editor.canvas?.getContext("2d");
    if (ctx) {
      ctx.font = "14px Arial";
      const textWidth = ctx.measureText(text).width;
      const padding = 40;
      this.size[0] = Math.max(140, textWidth + padding);
    }

    this.setDirtyCanvas(true, true);
  }

  onConnectionsChange(type, slot, connected, link_info, io_slot) {
    if (
      type === LiteGraph.OUTPUT &&
      connected &&
      this.outputs[slot]?.name === "Out"
    ) {
      if (!this.graph) return;
      const link = link_info;
      const targetNode = this.graph.getNodeById(link.target_id);
      if (targetNode?.type === "survey/question") {
        targetNode.properties.questionOrderNumber =
          (this.properties.questionOrderNumber || 0) + 1;
        targetNode.setDirtyCanvas(true, true);
      }
    }

    if (
      type === LiteGraph.INPUT &&
      connected &&
      this.inputs[slot]?.name === "In"
    ) {
      const link = link_info;
      if(!link) return;
      const parentNode = this.graph.getNodeById(link.origin_id);
      if (parentNode?.type === "survey/answer") {
        this.properties.conditionalQuestionFlag = true;
        this.properties.expectedSurveyAnswerId =
          parentNode.properties.surveyAnswerId;
        this.setDirtyCanvas(true, true);
      }
    }
    
    if (
      type === LiteGraph.INPUT &&
      !connected &&
      this.inputs[slot]?.name === "In"
    ) {
      console.log('Snoogans');
      this.properties.conditionalQuestionFlag = false;
      this.setDirtyCanvas(true, true);
      if(this.graph?.onAfterChange) {
        this.graph.onAfterChange();
      } else {
        this.graph.version++;
      }
    }


  }

  onDrawBackground(ctx, canvas) {
    if(this.properties.conditionalQuestionFlag === true) {
      ctx.fillStyle = "#291bf2";
    } else {
      ctx.fillStyle = "#71a3f5";
    }
    ctx.fillRect(0, 0, this.size[0], this.size[1]);
  }
}

LiteGraph.registerNodeType("survey/question", QuestionNode);
