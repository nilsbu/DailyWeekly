function addTask() {
  taskList = document.getElementById("task-list");

  newTask = document.createElement("div");
  newTask.setAttribute("class", "task");
  input = document.createElement("input");

  newTask.appendChild(input);
  taskList.appendChild(newTask);
  input.focus();
  input.select();
}
