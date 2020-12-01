function addTask() {
  taskList = document.getElementById("task-list");

  newTask = document.createElement("div");
  newTask.setAttribute("class", "task");
  newTask.setAttribute("id", `task-${taskList.getElementsByClassName("task").length + 1}`);

  input = document.createElement("input");
  input.setAttribute("class", "task-input");
  input.setAttribute("onfocusout", "createTask();");

  newTask.appendChild(input);
  taskList.appendChild(newTask);
  input.focus();
  input.select();
  newTask.setAttribute("onclick", `finishTask("${newTask.id}");`);
}

function createTask() {
  taskList = document.getElementById("task-list");
  task = taskList.lastChild;
  input = task.getElementsByClassName("task-input")[0];
  task.removeChild(input);
  txt = document.createTextNode(input.value);
  task.appendChild(txt);
}

function finishTask(id) {
  taskList = document.getElementById("task-list");
  task = document.getElementById(id);
  task.setAttribute("class", "task-done");
}
