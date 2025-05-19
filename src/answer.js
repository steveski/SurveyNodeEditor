import { LiteGraph } from "litegraph.js";

export default class AnswerNode extends LiteGraph.LGraphNode {
  constructor(editor) {
    super();
    this.editor = editor;
    this.addInput("From Question", LiteGraph.EVENT);
    this.addOutput("To Question", LiteGraph.EVENT);
    this.properties = {
      answerText: "Answer Text",
      surveyAnswerId: 0,
      surveyQuestionId: 0,
      answerId: 0,
      answerOrderNumber: 0,
      IsDeletedFlag: 0,
    };
    this.updateTitle();
  }

  onAdded() {
    this.updateTitle();
  }

  onPropertyChanged(name, value) {
    if (name === "answerText" || name === "surveyAnswerId") {
      this.updateTitle();
      this.setDirtyCanvas(true, true);
    }
  }

  onInspect(inspector) {
    inspector.addString("Answer Text", this.properties.answerText, (v) => {
      this.properties.answerText = v;
      this.updateTitle();
      this.setDirtyCanvas(true, true);
    });

    inspector.addNumber("Answer ID", this.properties.surveyAnswerId, (v) => {
      this.properties.surveyAnswerId = v;
      this.updateTitle();
      this.setDirtyCanvas(true, true);
    });
  }

  updateTitle() {
    const text = `Ans: ${this.properties.surveyAnswerId} - ${this.properties.answerText}`;
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
      type === LiteGraph.INPUT &&
      connected &&
      this.inputs[slot]?.name === "From Question"
    ) {
      const link = link_info;
      if(!link) return;
      const parentNode = this.graph.getNodeById(link.origin_id);
      if (parentNode?.type === "survey/question") {
        this.properties.surveyQuestionId =
          parentNode.properties.surveyQuestionId;
        this.setDirtyCanvas(true, true);
      }
    }
  }

  onDrawBackground(ctx, canvas) {
    ctx.fillStyle = "#ae82fa";
    ctx.fillRect(0, 0, this.size[0], this.size[1]);
  }
}
