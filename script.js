function addTask() {
  taskList = document.getElementById("task-list");

  newTask = document.createElement("div");
  newTask.setAttribute("class", "task");
  newTask.setAttribute("id", `task-${lists.getCurrentTasks().length}`);

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

  lists.getCurrentTasks().push({'txt': input.value, 'done': false});

  syncInterface();
  lists.save();
}

function finishTask(id) {
  taskList = document.getElementById("task-list");
  task = document.getElementById(id);
  task.setAttribute("class", "task-done");

  lists.getCurrentTasks()[id.substring(5)].done = true;

  syncInterface();
  lists.save();
}

function syncInterface() {
  list = lists.getCurrentTasks();
  taskList = document.getElementById('task-list');
  while (taskList.firstChild) {
    taskList.removeChild(taskList.lastChild);
  }

  let allTasksFinished = list.length > 0;
  let id = 0;
  for (const task of list) {
    newTask = document.createElement('div');
    newTask.setAttribute('class', 'task');
    newTask.setAttribute('id', `task-${id++}`);
    txt = document.createTextNode(task['txt']);

    if (task['done']) {
      newTask.setAttribute('class', 'task-done');
    } else {
      allTasksFinished = false;
    }

    newTask.appendChild(txt);
    taskList.appendChild(newTask);
    newTask.setAttribute('onclick', `finishTask('${newTask.id}');`);
  }

  if (allTasksFinished) {
    document.body.style.background = "var(--bg-done)";
  } else {
    document.body.style.background = "var(--bg-not-done)";
  }
}

class Lists {
  constructor(store) {
    // TODO: store should be passed
    this.store = store;
    this.store.onload = ls => {this.load(ls); syncInterface()};

    let names = ['today'];
    let lists = [];
    for (const name of names) {
      lists.push({'name': name, 'tasks': []});
    }
    this.lists = {'lists': lists};
    this.current = 'today';
  }

  save() {
    this.store.store(this.lists);
  }

  load(lists) {
    if (!(lists == null)) {
      this.lists = lists;
    }
  }

  getCurrentTasks() {
    for (const list of this.lists['lists']) {
      if (list['name'] === this.current) {
        return list['tasks'];
      }
    }
    return null;
  }
}

// Storage

class StorageJson {
  store(lists) {
    localStorage.setItem('lists', JSON.stringify(lists));
  }

  loadAsync() {
    let lists = null;
    if (localStorage.hasOwnProperty('lists')) {
      lists = JSON.parse(localStorage.getItem('lists'));
    }
    this.onload(lists);
  }
}

var store = new StorageJson();
var lists = new Lists(store);

// Init
function init() {
  store.loadAsync();
}
window.addEventListener('load', init)
