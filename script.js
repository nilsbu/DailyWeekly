// Callbacks

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
}

function createTask() {
  const taskList = document.getElementById('task-list');
  const task = taskList.lastChild;
  const input = task.getElementsByClassName('task-input')[0];

  lists.addTask(input.value);
  syncInterface();
  lists.save();
}

function taskClicked(id) {
  if (editMode) {
    let task = document.getElementById(id);
    const txt = task.textContent;
    task.innerHTML = "";
    addTaskInput(id, txt);
  } else {
    toggleFinishTask(id);
  }
}

function addTaskInput(id, txt) {
  let task = document.getElementById(id);
  let input = document.createElement('input');
  input.setAttribute('class', 'task-input');
  input.setAttribute('onfocusout', `finalizeTaskInput('${id}');`);
  input.value = txt;

  task.appendChild(input);
  input.focus();
}

function finalizeTaskInput(id) {
  let task = document.getElementById(id);
  lists.getCurrentTasks()[id.substring(5)].txt = task.firstChild.value;

  syncInterface();
  lists.save();
}

function toggleFinishTask(id) {
  const isDone = lists.getTask(id.substring(5)).done;
  lists.setTaskDone(id.substring(5), !isDone);

  syncInterface();
  lists.save();
}

function removeTask(id) {
  lists.removeTask(id.substring(5));

  editMode = lists.getCurrentTasks().length > 0;
  syncInterface();
  lists.save();
}

function previousList() {
  let dw = lists.current.substring(0, 1);
  let n = parseInt(lists.current.substring(1, 3));

  if (n > -1) {
    lists.current = dw + (n - 1);

    editMode = false;
    syncInterface();
  }
}

function nextList() {
  let dw = lists.current.substring(0, 1);
  let n = parseInt(lists.current.substring(1, 3));

  if (n < 1) {
    lists.current = dw + (n + 1);

    editMode = false;
    syncInterface();
  }
}

function switchDayWeek() {
  if (lists.current.substring(0, 1) === 'd') {
    lists.current = 'w0';
  } else {
    lists.current = 'd0';
  }

  editMode = false;
  syncInterface();
}

function toggleEdit() {
  editMode = !editMode;
  syncInterface();
}

// Next day management

function isDayOver() {
  let lastDayOverCheck = store.loadLastDayOverCheck();
  if (lastDayOverCheck == null) {
    store.storeLastDayOverCheck(Date.now());
  } else {
    const thisDayOverCheck = Date.now();

    const msPerDay = 24 * 60 * 60 * 1000;
    const lastDay = Math.floor(lastDayOverCheck / msPerDay);
    const thisDay = Math.floor(thisDayOverCheck / msPerDay);

    if (thisDay > lastDay) {
      for (let i = 0; i < Math.min(3, thisDay - lastDay); i++){
        lists.nextDay();
      }
      lists.save();
      syncInterface();
    }
    store.storeLastDayOverCheck(thisDayOverCheck);
  }

  window.setTimeout(isDayOver, 60 * 1000);
}

// Drawing

function syncInterface() {
  syncTitleBar();
  syncTaskList();
  syncBackground();
}

function getBackGroundColor() {
  if (lists.areAllTasksDone()) {
    return 'var(--bg-done)';
  } else {
    return 'var(--bg-not-done)';
  }
}

function syncTitleBar() {
  let leftArrowSpan = document.getElementById('arrow-left').firstChild
  if (lists.current.substring(1, 3) == '-1') {
    leftArrowSpan.style.color = getBackGroundColor();
  } else {
    leftArrowSpan.style.color = 'white';
  }

  let rightArrowSpan = document.getElementById('arrow-right').firstChild
  if (lists.current.substring(1, 3) == '1') {
    rightArrowSpan.style.color = getBackGroundColor();
  } else {
    rightArrowSpan.style.color = 'white';
  }

  let title = document.getElementById('title');
  switch (lists.current) {
    case 'd-1':
      title.innerHTML = 'Gestern';
      break;
    case 'd0':
      title.innerHTML = 'Heute';
      break;
    case 'd1':
      title.innerHTML = 'Morgen';
      break;
    case 'w-1':
      title.innerHTML = 'Letzte Woche';
      break;
    case 'w0':
      title.innerHTML = 'Diese Woche';
      break;
    case 'w1':
      title.innerHTML = 'N&auml;chste Woche';
      break;
    default:
  }
}

function syncTaskList() {
  const list = lists.getCurrentTasks();
  let taskList = document.getElementById('task-list');
  while (taskList.firstChild) {
    taskList.removeChild(taskList.lastChild);
  }

  let id = 0;
  for (const task of list) {
    let taskLine = document.createElement('tr');
    let newTask = document.createElement('td');
    newTask.setAttribute('id', `task-${id++}`);
    newTask.setAttribute('width', '100%');
    newTask.setAttribute('onclick', `taskClicked('${newTask.id}');`);
    if (task.done) {
      newTask.setAttribute('class', 'task-done');
    } else {
      newTask.setAttribute('class', 'task');
    }
    newTask.appendChild(document.createTextNode(task.txt));
    taskLine.appendChild(newTask);


    let removeButton = document.createElement('td');
    if (editMode) {
      removeButton.setAttribute('class', 'remove-button');
      removeButton.setAttribute('onclick', `removeTask('${newTask.id}');`);
      removeButton.appendChild(document.createTextNode('X'));
    } else {
      removeButton.setAttribute('class', 'remove-button-inactive');
    }
    taskLine.appendChild(removeButton);

    taskList.appendChild(taskLine);
  }
}

function syncBackground() {
  document.body.style.background = getBackGroundColor();
}

// Lists

class Lists {
  constructor(store) {
    this.store = store;
    this.store.onload = ls => {this.load(ls); syncInterface()};

    const names = ['d-1', 'd0', 'd1', 'w-1', 'w0', 'w1'];
    this.lists = {};
    for (const name of names) {
      this.lists[name] = [];
    }
    this.current = 'd0';
  }

  save() {
    let jsonConform = [];

    for (const name in this.lists) {
      jsonConform.push({'name': name, 'tasks': this.lists[name]});
    }

    this.store.storeLists({'lists': jsonConform});
  }

  load(lists) {
    if (lists == null) {
      return
    }

    for (const list of lists.lists) {
      if (this.lists[list.name] != null) {
        this.lists[list.name] = list.tasks;
      }
    }
  }

  getCurrentTasks() {
    return this.lists[this.current];
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

  areAllTasksDone() {
    const tasks = this.getCurrentTasks();
    if (tasks.length == 0) {
      return false;
    } else {
      for (const task of tasks) {
        if (task.done === false) {
          return false;
        }
      }
      return true;
    }
  }

  nextDay() {
    this.lists['d-1'] = this.lists['d0'];
    this.lists['d0'] = this.lists['d1'];
    this.lists['d1'] = [];

    this.lists['w-1'] = this.lists['w0'];
    this.lists['w0'] = this.lists['w1'];
    this.lists['w1'] = [];

    this.current = 'd0';
  }
}

// Storage

class StorageJson {
  storeLists(lists) {
    localStorage.setItem('lists', JSON.stringify(lists));
  }

  loadListsAsync() {
    let lists = null;
    if (localStorage.hasOwnProperty('lists')) {
      lists = JSON.parse(localStorage.getItem('lists'));
    }
    this.onload(lists);
  }

  storeLastDayOverCheck(lastDayOverCheck) {
    localStorage.setItem('last-day-check', lastDayOverCheck);
  }

  loadLastDayOverCheck() {
    if (localStorage.hasOwnProperty('last-day-check')) {
      return parseInt(localStorage.getItem('last-day-check'));
    }

    return null;
  }
}

// Initialization

var store = new StorageJson();
var lists = new Lists(store);
var editMode = false;

function init() {
  store.loadListsAsync();
  isDayOver();
}
window.addEventListener('load', init)
