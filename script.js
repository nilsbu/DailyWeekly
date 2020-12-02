function addTask() {
  let taskList = document.getElementById('task-list');

  let taskLine = document.createElement('tr');
  let taskInput = document.createElement('td');
  taskInput.setAttribute('class', 'task');
  taskInput.setAttribute('id', `task-${lists.getCurrentTasks().length}`);

  let input = document.createElement('input');
  input.setAttribute('class', 'task-input');
  input.setAttribute('onfocusout', 'createTask();');

  taskInput.appendChild(input);
  taskLine.appendChild(taskInput);
  taskList.appendChild(taskLine);
  input.focus();
  input.select();
}

function createTask() {
  const taskList = document.getElementById('task-list');
  const task = taskList.lastChild;
  const input = task.getElementsByClassName('task-input')[0];

  lists.addTask(input.value);
  syncInterface();
  lists.save();
}

function toggleFinishTask(id) {
  const isDone = lists.getTask(id.substring(5)).done;
  lists.setTaskDone(id.substring(5), !isDone);

  syncInterface();
  lists.save();
}

function syncInterface() {
  const list = lists.getCurrentTasks();
  let taskList = document.getElementById('task-list');
  while (taskList.firstChild) {
    taskList.removeChild(taskList.lastChild);
  }

  let allTasksFinished = list.length > 0;
  let id = 0;
  for (const task of list) {
    let taskLine = document.createElement('tr');
    let newTask = document.createElement('td');
    newTask.setAttribute('id', `task-${id++}`);
    newTask.setAttribute('width', '99%');
    newTask.setAttribute('onclick', `toggleFinishTask('${newTask.id}');`);
    if (task.done) {
      newTask.setAttribute('class', 'task-done');
    } else {
      newTask.setAttribute('class', 'task');
      allTasksFinished = false;
    }
    newTask.appendChild(document.createTextNode(task.txt));
    taskLine.appendChild(newTask);

    let removeButton = document.createElement('td');
    removeButton.setAttribute('class', 'remove-button');
    removeButton.appendChild(document.createTextNode('X'));
    taskLine.appendChild(removeButton);

    taskList.appendChild(taskLine);
  }

  if (allTasksFinished) {
    document.body.style.background = 'var(--bg-done)';
  } else {
    document.body.style.background = 'var(--bg-not-done)';
  }
}

class Lists {
  constructor(store) {
    this.store = store;
    this.store.onload = ls => {this.load(ls); syncInterface()};

    const names = ['today'];
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
    if (lists == null) {
      return
    }

    for (const list of lists.lists) {
      for (let tList of this.lists.lists) {
        if (tList.name === list.name) {
          tList.tasks = list.tasks;
        }
      }
    }
  }

  getCurrentTasks() {
    for (const list of this.lists.lists) {
      if (list.name === this.current) {
        return list.tasks;
      }
    }
    return null;
  }

  addTask(txt) {
    if (txt == '') {
      return false;
    }

    this.getCurrentTasks().push({'txt': txt, 'done': false});
    return true;
  }

  removeTask(id) {
    this.getCurrentTasks().splice(id, 1);
  }

  setTaskDone(id, isDone) {
    this.getCurrentTasks()[id].done = isDone;
  }

  getTask(id) {
    return this.getCurrentTasks()[id];
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

function init() {
  store.loadAsync();
}
window.addEventListener('load', init)
