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
    questionText: "Untitled Question",
    questionOrderNumber: 1,
    questionTypeCode: "SSELCT",
    isConditionalFlag: false,
    expectedSurveyAnswerId: null,
  };
}

QuestionNode.title = "Question";

QuestionNode.prototype.onAdded = function () {
  this.updateTitle();
};

QuestionNode.prototype.onPropertyChanged = function (name, value) {
  if (name === "questionText" || name === "surveyQuestionId") {
    this.updateTitle();
    this.setDirtyCanvas(true, true);
  }
};

QuestionNode.prototype.onInspect = function (inspector) {
  inspector.addString("Question Text", this.properties.questionText, (v) => {
    this.properties.questionText = v;
    this.updateTitle();
    this.setDirtyCanvas(true, true);
  });

  inspector.addNumber("Survey Question ID", this.properties.surveyQuestionId, (v) => {
    this.properties.surveyQuestionId = v;
    this.updateTitle();
    this.setDirtyCanvas(true, true);
  });
};

QuestionNode.prototype.updateTitle = function () {
  const text = `SQ: ${this.properties.surveyQuestionId}: ${this.properties.questionText}`;
  this.title = text;

  const ctx = this.getCanvasContext?.() || editor.canvas?.getContext("2d");
  if(ctx) {
    ctx.font = "14px Arial";
    const textWidth = ctx.measureText(text).width;
    const padding = 20 * 2;
    this.size[0] = Math.max(140, textWidth + padding);
  }

  this.setDirtyCanvas(true, true);
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

QuestionNode.prototype.onDrawBackground = function(ctx, canvas) {
  ctx.fillStyle = "#77cc77";
  ctx.fillRect(0, 0, this.size[0], this.size[1])
};

// Register QuestionNode
LiteGraph.registerNodeType("survey/question", QuestionNode);

// Define AnswerNode
function AnswerNode() {
  this.addInput("From Question", LiteGraph.EVENT);
  this.addOutput("To Question", LiteGraph.EVENT);
  this.properties = {
    answerText: "Answer Text",
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
  if (name === "answerText" || name === "surveyAnswerId") {
    this.updateTitle();
    this.setDirtyCanvas(true, true);
  }
};

AnswerNode.prototype.onInspect = function (inspector) {
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
};

// AnswerNode.prototype.updateTitle = function () {
//   this.title = `Ans: ${this.properties.surveyAnswerId} - ${this.properties.answerText}`;
// };
AnswerNode.prototype.updateTitle = function () {
  const text = `Ans: ${this.properties.surveyAnswerId} - ${this.properties.answerText}`;
  this.title = text;

  const ctx = this.getCanvasContext?.() || editor.canvas?.getContext("2d");
  if(ctx) {
    ctx.font = "14px Arial";
    const textWidth = ctx.measureText(text).width;
    const padding = 20 * 2;
    this.size[0] = Math.max(140, textWidth + padding);
  }

  this.setDirtyCanvas(true, true);
};

AnswerNode.prototype.onDrawBackground = function(ctx, canvas) {
  ctx.fillStyle = "#7777cc";
  ctx.fillRect(0, 0, this.size[0], this.size[1])
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

editor.onNodeSelected = function (node) {
  showPropertyPanel(node);
};

function showPropertyPanel(node) {
  const panel = document.getElementById("property-content");
  panel.innerHTML = ""; // Clear previous

  for (const key in node.properties) {
    const value = node.properties[key];
    const label = document.createElement("label");
    label.innerText = key;
    label.style.display = "block";
    label.style.marginTop = "8px";

    const input = document.createElement("input");
    input.type = typeof value === "number" ? "number" : "text";
    input.value = value;
    input.style.width = "100%";
    input.dataset.key = key;

    input.onchange = function () {
      const prop = this.dataset.key;
      const newVal = input.type === "number" ? Number(this.value) : this.value;
      node.setProperty(prop, newVal); // triggers onPropertyChanged
    };

    panel.appendChild(label);
    panel.appendChild(input);
  }
}

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

document.getElementById("save-graph").addEventListener("click", () => {
  const defaultName = "survey-graph.json";
  const filename = prompt("Enter a filename to save:", defaultName);

  if(!filename) return; // user cancelled
   
  const data = JSON.stringify(graph.serialize(), null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  a.click();

  URL.revokeObjectURL(url);
});

document.getElementById("load-graph").addEventListener("click", () => {
  document.getElementById("load-file").click();
});

document.getElementById("load-file").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if(!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const json = JSON.parse(event.target.result);
      graph.clear();
      graph.configure(json);
      graph.start();
      console.log("Graph loaded from file.");
    } catch(err) {
      console.log("Failed to load graph:", err);
    }
  };

  reader.readAsText(file);
});
