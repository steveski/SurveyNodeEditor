import { LGraph, LGraphCanvas, LiteGraph } from "litegraph.js";
import "litegraph.js/css/litegraph.css";
import { exp } from "./export.js";

// Create the graph and editor
const canvas = document.getElementById("graph-canvas");
const graph = new LGraph();
const editor = new LGraphCanvas(canvas, graph);

editor.ondblclick_node = function (node, event) {
  editor.showNodePanel(node);
};

// Define QuestionNode
function QuestionNode() {
  this.addInput("In", LiteGraph.EVENT);
  this.addOutput("Out", LiteGraph.EVENT);
  this.addOutput("Answers", LiteGraph.EVENT);
  this.properties = {
    surveyQuestionId: Math.floor(Math.random() * 1000),
    text: "Untitled Question",
    questionOrderNumber: 1,
    questionTypeCode: "SSELCT",
    isConditionalFlag: false,
    expectedSurveyAnswerId: null,
  };
}

QuestionNode.title = "Question";

QuestionNode.prototype.onAdded = function () {
  this.title = this.properties.id;
};

QuestionNode.prototype.onInspect = function (inspector) {
  inspector.addString("Question Text", this.properties.text, (v) => {
    this.properties.text = v;
    this.setDirtyCanvas(true, true);
  });
  inspector.addString("ID", this.properties.id, (v) => {
    this.properties.id = v;
    this.title = v;
    this.setDirtyCanvas(true, true);
  });
};

QuestionNode.prototype.onConnectionsChange = function (
  type,
  slot,
  connected,
  link_info,
  io_slot
) {
  if (
    type === LiteGraph.OUTPUT &&
    connected &&
    this.outputs[slot]?.name === "Out"
  ) {
    if (!this.graph) return;
    const link = link_info;
    const targetNode = this.graph.getNodeById(link.target_id);

    if (targetNode?.type === "survey/question") {
      targetNode.properties.questionOrderNumber = (this.properties.questionOrderNumber || 0) + 1;
      targetNode.setDirtyCanvas(true, true);
    }
  }

  if (
    type === LiteGraph.INPUT &&
    connected &&
    this.inputs[slot]?.name === "In"
  ) {
    const link = link_info;
    const parentNode = this.graph.getNodeById(link.origin_id);

    if (parentNode?.type === "survey/answer") {
      this.properties.conditionalQuestionFlag = true;
      this.properties.expectedSurveyAnswerId = parentNode.properties.surveyAnswerId;
      this.setDirtyCanvas(true, true);
    }
  }

};


// Register QuestionNode
LiteGraph.registerNodeType("survey/question", QuestionNode);

// Define AnswerNode
function AnswerNode() {
  this.addInput("From Question", LiteGraph.EVENT);
  this.addOutput("To Question", LiteGraph.EVENT);
  this.properties = {
    text: "Answer Text",
    surveyAnswerId: 0,
    surveyQuestionId: 0,
    answerId: 0,
    answerOrderNumber: 0,
    IsDeletedFlag: 0
  };
}

AnswerNode.title = "Answer";

AnswerNode.prototype.onAdded = function () {
  this.updateTitle();
};

AnswerNode.prototype.onPropertyChanged = function (name, value) {
  if (name === "text" || name === "surveyAnswerId") {
    this.updateTitle();
    this.setDirtyCanvas(true, true);
  }
};

AnswerNode.prototype.onInspect = function (inspector) {
  inspector.addString("Answer Text", this.properties.text, (v) => {
    this.properties.text = v;
    this.updateTitle();
    this.setDirtyCanvas(true, true);
  });

  inspector.addNumber("Answer ID", this.properties.surveyAnswerId, (v) => {
    this.properties.surveyAnswerId = v;
    this.updateTitle();
    this.setDirtyCanvas(true, true);
  });
};

AnswerNode.prototype.updateTitle = function () {
  this.title = `Ans: ${this.properties.surveyAnswerId} - ${this.properties.text}`;
};

AnswerNode.prototype.onConnectionsChange = function (
  type,
  slot,
  connected,
  link_info,
  io_slot
) {
  // Only react when something is connected to the input
  if (type === LiteGraph.INPUT && connected && this.inputs[slot]?.name === "From Question") {
    const link = link_info;
    const parentNode = this.graph.getNodeById(link.origin_id);

    if (parentNode?.type === "survey/question") {
      this.properties.surveyQuestionId = parentNode.properties.surveyQuestionId;
      this.setDirtyCanvas(true, true);
    }
  }
};

// Register AnswerNode
LiteGraph.registerNodeType("survey/answer", AnswerNode);

// Right-click to add node
canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  const pos = editor.convertEventToCanvasOffset(e);

  const menu = new LiteGraph.ContextMenu(["Add Question", "Add Answer"], {
    event: e,
    callback: (value) => {
      const node =
        value === "Add Question"
          ? LiteGraph.createNode("survey/question")
          : LiteGraph.createNode("survey/answer");
      node.pos = pos;
      graph.add(node);
    },
  });
});

// Start graph
graph.start();

//
//
//
//
//
//
//
window.exportSurveyJSON = exp;
window.graph = graph;

graph.onAfterChange = function () {
  try {
    const snapshot = JSON.stringify(graph.serialize());
    localStorage.setItem("surveyGraph", snapshot);
    console.log("Graph saved to localStorage");
  } catch (err) {
    console.error("Failed to save graph:", err);
  }
};

const saved = localStorage.getItem("surveyGraph");
if (saved) {
  try {
    graph.configure(JSON.parse(saved));
    console.log("Graph loaded from localStorage");
  } catch (err) {
    console.error("Failed to load saved graph:", err);
  }
}

document.getElementById("reset-graph").addEventListener("click", () => {
  localStorage.removeItem("surveyGraph");
  graph.clear();
  graph.start();
});

