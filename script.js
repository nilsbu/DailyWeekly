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

function removeTask(id) {
  lists.removeTask(id.substring(5));

  syncInterface();
  lists.save();
}

function previousList() {
  let dw = lists.current.substring(0, 1);
  let n = parseInt(lists.current.substring(1, 3));

  if (n > -1) {
    lists.current = dw + (n - 1);
    syncInterface();
  }
}

function nextList() {
  let dw = lists.current.substring(0, 1);
  let n = parseInt(lists.current.substring(1, 3));

  if (n < 1) {
    lists.current = dw + (n + 1);
    syncInterface();
  }
}

function switchDayWeek() {
  if (lists.current.substring(0, 1) === 'd') {
    lists.current = 'w0';
  } else {
    lists.current = 'd0';
  }

  syncInterface();
}

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
    removeButton.setAttribute('onclick', `removeTask('${newTask.id}');`);
    removeButton.appendChild(document.createTextNode('X'));
    taskLine.appendChild(removeButton);

    taskList.appendChild(taskLine);
  }

  let bgColor;
  if (allTasksFinished) {
    bgColor = 'var(--bg-done)';
  } else {
    bgColor = 'var(--bg-not-done)';
  }

  document.body.style.background = bgColor;

  let leftArrowSpan = document.getElementById('arrow-left').firstChild
  if (lists.current.substring(1, 3) == '-1') {
    leftArrowSpan.style.color = bgColor;
  } else {
    leftArrowSpan.style.color = 'white';
  }

  let rightArrowSpan = document.getElementById('arrow-right').firstChild
  if (lists.current.substring(1, 3) == '1') {
    rightArrowSpan.style.color = bgColor;
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

var store = new StorageJson();
var lists = new Lists(store);

function init() {
  store.loadListsAsync();
  isDayOver();
}
window.addEventListener('load', init)
