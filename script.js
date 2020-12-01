function addTask() {
  taskList = document.getElementById("task-list");

  newTask = document.createElement("div");
  newTask.setAttribute("class", "task");
  input = document.createElement("input");
  input.setAttribute("class", "task-input");
  input.setAttribute("onfocusout", "createTask();");

  newTask.appendChild(input);
  taskList.appendChild(newTask);
  input.focus();
  input.select();
}

function createTask() {
  taskList = document.getElementById("task-list");
  task = taskList.lastChild
  input = task.getElementsByClassName("task-input")[0]
  task.removeChild(input)
  txt = document.createTextNode(input.value)
  task.appendChild(txt)
}
