import { LGraph, LGraphCanvas, LiteGraph } from "litegraph.js";
import "litegraph.js/css/litegraph.css";
import { exp } from "./export.js";
import QuestionNode from "./question.js";
import AnswerNode from "./answer.js";

// Create the graph and editor
const canvas = document.getElementById("graph-canvas");
const graph = new LGraph();
const editor = new LGraphCanvas(canvas, graph);

editor.ondblclick_node = function (node, event) {
  editor.showNodePanel(node);
};

LiteGraph.registerNodeType("survey/question", class extends QuestionNode {
  constructor() {
    super(editor);
  }
});
LiteGraph.registerNodeType("survey/answer", class extends AnswerNode {
  constructor() {
    super(editor);
  }
});

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

  if (!filename) return; // user cancelled

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
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const json = JSON.parse(event.target.result);
      graph.clear();
      graph.configure(json);
      graph.start();
      console.log("Graph loaded from file.");
    } catch (err) {
      console.log("Failed to load graph:", err);
    }
  };

  reader.readAsText(file);
});
