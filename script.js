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

  syncInterface();
  saveList();
}

function finishTask(id) {
  taskList = document.getElementById("task-list");
  task = document.getElementById(id);
  task.setAttribute("class", "task-done");

  syncInterface();
  saveList();
}

function syncInterface() {
  let allTasksFinished = taskList.children.length > 0;
  taskList = document.getElementById('task-list');
  for (const child of taskList.children) {
    if (!(child.getAttribute('class') === 'task-done')) {
      allTasksFinished = false;
    }
  }

  if (allTasksFinished) {
    document.body.style.background = "var(--bg-done)";
  } else {
    document.body.style.background = "var(--bg-not-done)";
  }
}


function loadLists(lists) {
  // TODO: use multiple lists
  list = lists['lists'][0]['tasks'];
  taskList = document.getElementById('task-list');
  while (taskList.firstChild) {
    taskList.removeChild(taskList.lastChild);
  }

  for (const task of list) {
    newTask = document.createElement('div');
    newTask.setAttribute('class', 'task');
    newTask.setAttribute('id', `task-${taskList.getElementsByClassName('task').length + 1}`);
    txt = document.createTextNode(task['txt']);

    if (task['done']) {
      newTask.setAttribute('class', 'task-done');
    }

    newTask.appendChild(txt);
    taskList.appendChild(newTask);
    newTask.setAttribute('onclick', `finishTask('${newTask.id}');`);
  }

  syncInterface();
}

function saveList() {
  let tasks = [];
  taskList = document.getElementById('task-list');
  for (const child of taskList.children) {
    task = {'txt': child.textContent, 'done': child.getAttribute('class') === 'task-done'};
    tasks.push(task);
  }
  store.store({'lists': [{'name': 'today', 'tasks': tasks}]});
}

// Storage

class StorageJson {
  constructor(onload) {
    this.onload = onload;
  }

  store(lists) {
    localStorage.setItem('lists', JSON.stringify(lists));
  }

  loadAsync() {
    let lists = {'lists': [{'name': 'today', 'tasks': []}]};
    if (localStorage.hasOwnProperty('lists')) {
      lists = JSON.parse(localStorage.getItem('lists'));
    }
    this.onload(lists);
  }
}

var store = new StorageJson(loadLists);

// Init
function init() {
  store.loadAsync();
}
window.addEventListener('load', init)
