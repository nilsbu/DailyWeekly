// Callbacks

function addTask(subof=null) {
  let taskList = document.getElementById('task-list');

  let taskLine = document.createElement('tr');
  let taskInput = document.createElement('td');
  taskInput.setAttribute('class', 'task');
  taskInput.setAttribute('id', `task-${lists.getCurrentTasks().length}`);

  let input = document.createElement('input');
  input.setAttribute('class', 'task-input');
  const subofs = subof == null ? 'null' : `"${subof}"`;
  input.setAttribute('onfocusout', `createTask('task-${lists.getCurrentTasks().length}', ${subofs})`);
  input.addEventListener('keyup', ({key}) => {
    if (key === 'Enter') {
      document.activeElement.blur();
      addTask();
    }
  });

  taskInput.appendChild(input);
  taskLine.appendChild(taskInput);
  if (subof != null) {
    const before = document.getElementById(subof).parentNode.nextSibling;
    taskList.insertBefore(taskLine, before);
  } else {
    taskList.appendChild(taskLine);
  }

  input.focus();
}

function createTask(id, subof=null) {
  let task = document.getElementById(id);
  const input = task.getElementsByClassName('task-input')[0];

  lists.addTask(input.value);
  if (subof != null) {
    lists.getCurrentTasks()[lists.getCurrentTasks().length - 1].subof = lists.getCurrentTasks()[subof.substring(5)].id;
  }
  lists.sortLists();
  syncInterface();
  lists.save();
}

function taskClicked(id) {
  if (editMode) {
    let task = document.getElementById(id);
    const txt = lists.getCurrentTasks()[id.substring(5)].txt;
    task.innerHTML = '';
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
  input.addEventListener('keyup', ({key}) => {
    if (key === 'Enter') {
      document.activeElement.blur();
    }
  });
  input.value = txt;

  task.appendChild(input);
  input.focus();
}

function finalizeTaskInput(id) {
  let task = document.getElementById(id);
  lists.getCurrentTasks()[id.substring(5)].txt = task.firstChild.value.trim();

  lists.sortLists();
  syncInterface();
  lists.save();
}

function toggleFinishTask(id) {
  const nid = id.substring(5);
  const task = lists.getTask(nid);
  if (task.done == task.total) {
    lists.setTaskDone(nid, task.done - 1);
  } else {
    lists.setTaskDone(nid, parseInt(task.done) + 1);
  }

  lists.sortLists();
  syncInterface();
  lists.save();
}

function moveTask(id, list) {
  const nid = id.substring(5);
  const task = lists.getCurrentTasks()[nid];

  if (lists.current.substring(0, 1) == 'w' && list.substring(0, 1) == 'd') {
    // copy
    let txt = task.txt;
    if (task.subof != null) {
      const parent = lists.getTaskById(task.subof);
      txt = parent.txt + ': ' + task.txt;
    }
    lists.addTask(txt, 0, 1, task.id, list);
  } else {
    // move
    lists.lists[list].push(task);
    lists.removeTask(nid);
  }

  let dialog = document.getElementById('move-dialog');
  if (dialog != null) {
    dialog.parentNode.removeChild(dialog);
  }

  editMode = false;

  lists.sortLists();
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

  if (n > -1 && (n == 1 || !lists.areAllTasksDone(`${dw}-1`))) {
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

function showMoveDialog(id) {
  let dialog = document.createElement('div');
  dialog.setAttribute('id', 'move-dialog');

  let row = null;
  row = document.createElement('div');
  row.setAttribute('class', 'dialog-row');

  let cell = null;
  cell = document.createElement('div');
  cell.setAttribute('class', 'dialog-option');
  cell.setAttribute('onclick', `moveTask('${id}', 'd0')`);
  cell.innerHTML = 'heute';
  row.appendChild(cell);

  cell = document.createElement('div');
  cell.setAttribute('class', 'dialog-option');
  cell.setAttribute('onclick', `moveTask('${id}', 'd1')`);
  cell.innerHTML = 'morgen';
  row.appendChild(cell);
  dialog.appendChild(row);

  row = document.createElement('div');
  row.setAttribute('class', 'dialog-row');

  cell = document.createElement('div');
  cell.setAttribute('class', 'dialog-option');
  cell.setAttribute('onclick', `moveTask('${id}', 'w0')`);
  cell.innerHTML = 'diese W.';
  row.appendChild(cell);

  cell = document.createElement('div');
  cell.setAttribute('class', 'dialog-option');
  cell.setAttribute('onclick', `moveTask('${id}', 'w1')`);
  cell.innerHTML = 'n&auml;chste W.';
  row.appendChild(cell);
  dialog.appendChild(row);

  document.body.appendChild(dialog);
}

function toggleImportExportDialog() {
  let dialog = document.getElementById('ie-dialog');
  if (dialog == undefined) {
    dialog = document.createElement('div');
    dialog.setAttribute('id', 'ie-dialog');

    let textArea = document.createElement('textarea');
    textArea.setAttribute('rows', '10');
    textArea.setAttribute('cols', '40');

    textArea.value = JSON.stringify(lists.getJsonConform());

    dialog.appendChild(textArea);
    document.body.appendChild(dialog);
  } else {
    lists.load(JSON.parse(dialog.firstChild.value));
    dialog.parentNode.removeChild(dialog);
    syncInterface();
    lists.save();
  }
}

function showCountDialog(id) {
  const task = lists.getCurrentTasks()[id.substring(5)];

  let dialog = document.createElement('div');
  dialog.setAttribute('id', 'count-dialog');

  let done = document.createElement('input');
  done.setAttribute('class', 'num-field');
  done.value = +task.done;
  dialog.appendChild(done);

  dialog.appendChild(document.createTextNode('/'));

  let total = document.createElement('input');
  total.setAttribute('class', 'num-field');
  if (task.total == undefined) {
    total.value = 1;
  } else {
    total.value = +task.total;
  }
  dialog.appendChild(total);

  let ok = document.createElement('span');
  ok.setAttribute('onclick', `setCount('${id}');`);
  ok.appendChild(document.createTextNode('ok'));
  dialog.appendChild(ok);

  document.body.appendChild(dialog);
}

function setCount(id) {
  let task = lists.getCurrentTasks()[id.substring(5)];
  const dialog = document.getElementById('count-dialog');
  task.done = dialog.childNodes[0].value;
  task.total = dialog.childNodes[2].value;

  dialog.parentNode.removeChild(dialog);
  syncInterface();
  lists.save();
}

// Swipe
class Swipe {
  constructor(element) {
    this.xDown = null;
    this.yDown = null;
    this.element = typeof(element) === 'string' ? document.querySelector(element) : element;

    this.element.addEventListener('touchstart', function(evt) {
      this.xDown = evt.touches[0].clientX;
      this.yDown = evt.touches[0].clientY;
    }.bind(this), false);
  }

  onLeft(callback) {
    this.onLeft = callback;
    return this;
  }

  onRight(callback) {
    this.onRight = callback;
    return this;
  }

  onUp(callback) {
    this.onUp = callback;
    return this;
  }

  onDown(callback) {
    this.onDown = callback;
    return this;
  }

  handleTouchMove(evt) {
    if (!this.xDown || !this.yDown) {
      return;
    }

    var xUp = evt.touches[0].clientX;
    var yUp = evt.touches[0].clientY;

    this.xDiff = this.xDown - xUp;
    this.yDiff = this.yDown - yUp;
  }

  handleTouchEnd(evt) {
    if (!this.xDiff || !this.yDiff || !this.xDown || !this.yDown) {
      return;
    }

    if (Math.abs(this.xDiff) > Math.abs(this.yDiff)) { // Most significant.
      if (this.xDiff > 0) {
        this.onLeft();
      } else {
        this.onRight();
      }
    } else {
      if (this.yDiff > 0) {
        this.onUp();
      } else {
        this.onDown();
      }
    }

    // Reset values.
    this.xDown = null;
    this.yDown = null;
    this.xDiff = null;
    this.yDiff = null;
  }

  handleTouchCancel(evt) {
    this.xDown = null;
    this.yDown = null;
    this.xDiff = null;
    this.yDiff = null;
  }

  run() {
    this.element.addEventListener('touchmove', function(evt) {
      this.handleTouchMove(evt).bind(this);
    }.bind(this), false);
    this.element.addEventListener('touchend', function(evt) {
      this.handleTouchEnd(evt).bind(this);
    }.bind(this), false);
    this.element.addEventListener('touchcancel', function(evt) {
      this.handleTouchCancel(evt).bind(this);
    }.bind(this), false);
  }
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

      const lastDoW = (new Date(lastDayOverCheck).getDay() + 6) % 7; // Week starts on Monday
      const thisDoW = lastDoW + (thisDay - lastDay);
      const weeks = Math.floor(thisDoW / 7);
      for (let i = 0; i < Math.min(3, weeks); i++){
        lists.nextWeek();
      }

      syncInterface();
      lists.save();
    }
    store.storeLastDayOverCheck(thisDayOverCheck);
  }

  window.setTimeout(isDayOver, 60 * 1000);
}

// Drawing

function syncInterface() {
  syncTitleBar();
  syncTaskList();
  syncAddButton();
  syncBackground();
  syncImportExport();
}

function syncTitleBar() {
  let leftArrowSpan = document.getElementById('arrow-left').firstChild
  if (lists.current.substring(1, 3) == '-1' ||
      (lists.current.substring(1, 3) == '0' &&
      lists.areAllTasksDone(`${lists.current.substring(0, 1)}-1`))) {
    leftArrowSpan.style.visibility = 'hidden';
  } else {
    leftArrowSpan.style.visibility = 'visible';
  }

  let rightArrowSpan = document.getElementById('arrow-right').firstChild
  if (lists.current.substring(1, 3) == '1') {
    rightArrowSpan.style.visibility = 'hidden';
  } else {
    rightArrowSpan.style.visibility = 'visible';
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

  const isListLocked = (lists.current.substring(1, 2) == '-');

  let id = 0;
  for (const task of list) {
    let taskLine = document.createElement('tr');
    let newTask = document.createElement('td');
    newTask.setAttribute('id', `task-${id++}`);
    newTask.setAttribute('width', '100%');
    if (!isListLocked) {
      newTask.setAttribute('onclick', `taskClicked('${newTask.id}');`);
    }
    if (task.done == task.total) {
      newTask.setAttribute('class', 'task-done');
    } else {
      newTask.setAttribute('class', 'task');
    }
    let txt = task.txt;
    if (task.subof != null) {
        txt = ' - ' + txt;
    }
    if (task.total > 1) {
      txt += ` (${task.done}/${task.total})`;
    }
    newTask.appendChild(document.createTextNode(txt));
    taskLine.appendChild(newTask);

    let countButton = document.createElement('td');
    if (editMode) {
      countButton.setAttribute('class', 'task-button');
      countButton.setAttribute('onclick', `showCountDialog('${newTask.id}');`);
      countButton.appendChild(document.createTextNode('#'));
      if (isListLocked) {
        countButton.style.visibility = 'hidden';
      }
    } else {
      countButton.setAttribute('class', 'task-button-inactive');
    }
    taskLine.appendChild(countButton);

    let moveButton = document.createElement('td');
    if (editMode) {
      moveButton.setAttribute('class', 'task-button');
      moveButton.setAttribute('onclick', `showMoveDialog('${newTask.id}');`);
      moveButton.appendChild(document.createTextNode('M'));
    } else {
      moveButton.setAttribute('class', 'task-button-inactive');
    }
    if (isListLocked && task.done == task.total) {
      moveButton.style.visibility = 'hidden';
    }
    taskLine.appendChild(moveButton);

    let addButton = document.createElement('td');
    if (editMode) {
      addButton.setAttribute('class', 'task-button');
      addButton.setAttribute('onclick', `addTask('${newTask.id}');`);
      addButton.innerHTML = '&#65291;';
      if (task.subof != null || isListLocked) {
        addButton.style.visibility = 'hidden';
      }
    } else {
      addButton.setAttribute('class', 'task-button-inactive');
    }
    taskLine.appendChild(addButton);

    let removeButton = document.createElement('td');
    if (editMode) {
      removeButton.setAttribute('class', 'task-button');
      removeButton.setAttribute('onclick', `removeTask('${newTask.id}');`);
      removeButton.appendChild(document.createTextNode('X'));
      if (isListLocked) {
        removeButton.style.visibility = 'hidden';
      }
    } else {
      removeButton.setAttribute('class', 'task-button-inactive');
    }
    taskLine.appendChild(removeButton);

    taskList.appendChild(taskLine);
  }
}

function syncAddButton() {
  let visiblity = 'visible';

  if (lists.current.substring(1, 3) == '-1' || editMode === true) {
    visiblity = 'hidden';
  }

  let plus = document.getElementById('plus');
  plus.style.visibility = visiblity;
}

function syncBackground() {
  if (lists.areAllTasksDone()) {
    document.body.style.background = 'var(--bg-done)';
  } else {
    document.body.style.background = 'var(--bg-not-done)';
  }
}

function syncImportExport() {
  let ie = document.getElementById('import-export');
  if (editMode) {
    ie.style.visibility = 'visible';
  } else {
    ie.style.visibility = 'hidden';
  }
}

// Lists

class Lists {
  constructor(store) {
    this.nextId = 0;

    const names = ['d-1', 'd0', 'd1', 'w-1', 'w0', 'w1'];
    this.lists = {};
    for (const name of names) {
      this.lists[name] = [];
    }
    this.current = 'd0';

    this.store = store;
    this.store.onload = ls => {this.load(ls); syncInterface()};
  }

  getJsonConform() {
    let jsonConform = [];

    for (const name in this.lists) {
      jsonConform.push({'name': name, 'tasks': this.lists[name]});
    }

    return {'lists': jsonConform};
  }

  save() {
    this.store.storeLists(this.getJsonConform());
  }

  load(lists) {
    if (lists == null) {
      return
    }

    for (const list of lists.lists) {
      if (this.lists[list.name] != null) {
        this.lists[list.name] = [];
        for (const task of list.tasks) {
          this.lists[list.name].push(this.copyTask(task));

          if (task.id != undefined && this.nextId < task.id + 1) {
            this.nextId = task.id + 1;
          }
        }
      }
    }

    this.sortLists();
  }

  copyTask(task) {
    let newTask = {
      'id': task.id,
      'txt': task.txt,
      'parent': task.parent,
      'subof': task.subof,
      'done': +task.done,
      'total': task.total == undefined ? 1 : task.total
    };

    return newTask;
  }

  getCurrentTasks() {
    return this.lists[this.current];
  }

  addTask(txt, done=0, total = 1, parent=null, list=null) {
    if (txt == '') {
      return false;
    }
    let task = {'id': this.nextId++, 'txt': txt.trim(), 'done': done, 'total': total};
    if (parent != null) {
      task.parent = parent;
    }

    if (list == null) {
      this.getCurrentTasks().push(task);
    } else {
      this.lists[list].push(task);
    }

    return true;
  }

  removeTask(id) {
    this.getCurrentTasks().splice(id, 1);
  }

  setTaskDone(id, done) {
    let task = this.getCurrentTasks()[id];
    const dd = done - task.done;
    task.done = done;

    if (task.parent != undefined) {
      for (const name in this.lists) {
        let list = this.lists[name];
        for (let t of list) {
          if (t.id == task.parent) {
            t.done = Math.min(t.total, parseInt(t.done) + dd);
            break;
          }
        }
      }
    }
  }

  getTask(id) {
    return this.getCurrentTasks()[id];
  }

  areAllTasksDone(list=null) {
    let tasks;
    if (list == null) {
      tasks = this.getCurrentTasks();
    } else {
        tasks = this.lists[list];
    }

    for (const task of tasks) {
      if (!(task.done === true || task.done == task.total)) {
        return false;
      }
    }
    return true;
  }

  nextDay() {
    this.lists['d-1'] = this.lists['d0'];
    this.lists['d0'] = this.lists['d1'];
    this.lists['d1'] = [];

    this.current = 'd0';
  }

  nextWeek() {
    this.lists['w-1'] = this.lists['w0'];
    this.lists['w0'] = this.lists['w1'];
    this.lists['w1'] = [];

    this.current = 'd0';
  }

  getIndexInCurrentList(id) {
    const tasks = this.getCurrentTasks();
    for (let idx = 0; idx < tasks.length; idx++) {
      if (tasks[idx].id == id) {
        return idx;
      }
    }

    return -1;
  }

  getTaskById(id) {
    for (const key in this.lists) {
      for (const task of this.lists[key]) {
        if (task.id == id) {
          return task;
        }
      }
    }

    return null;
  }

  sortLists() {
    let f = (a, b) => {
      if (a.subof == b.subof) {
        if (a.done == a.total && b.done != b.total) {
          return 1;
        } else if (a.done != a.total && b.done == b.total) {
          return -1;
        }

        return a.txt.localeCompare(b.txt);
      }

      let xa = a;
      let xb = b;
      if (a.subof != null) {
        if (a.subof == b.id) {
          return 1;
        }
        xa = this.getTaskById(a.subof);
      }
      if (b.subof != null) {
        if (b.subof == a.id) {
          return -1;
        }
        xb = this.getTaskById(b.subof);
      }

      if (xa.done == xa.total && xb.done != xb.total) {
        return 1;
      } else if (xa.done != xa.total && xb.done == xb.total) {
        return -1;
      }

      return xa.txt.localeCompare(xb.txt);
    };

    for (const key in this.lists) {
      this.lists[key].sort(f);
    }
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
var moveId = null;

function init() {
  store.loadListsAsync();
  isDayOver();

  var swipeBody = new Swipe(document.body); // TODO: should only accept when not over task
  swipeBody.onLeft(function() { nextList(); });
  swipeBody.onRight(function() { previousList(); });
  // swipeBody.onUp(function() { if(lists.current.substring(0, 1) === 'd') {lists.current = 'w0'; editMode = false; syncInterface();} });
  // swipeBody.onDown(function() { if(lists.current.substring(0, 1) === 'w') {lists.current = 'd0'; editMode = false; syncInterface();} });
  swipeBody.run();
  window.addEventListener('focus', () => {swipeBody.xDown = null;});
}
window.addEventListener('load', init)
