// 1. Замініть посилання нижче на адресу своєї Firebase Realtime Database.
// Приклад: https://your-project-default-rtdb.europe-west1.firebasedatabase.app/todos.json
const FIREBASE_URL = "https://jscourse-4b9bb-default-rtdb.europe-west1.firebasedatabase.app//todos.json";

const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const list = document.querySelector("#todo-list");
const itemCount = document.querySelector("#item-count");
const uncheckedCount = document.querySelector("#unchecked-count");
const loadingMessage = document.querySelector("#loading");
const errorMessage = document.querySelector("#error");

let todos = [];

function setLoading(isLoading) {
  loadingMessage.classList.toggle("hidden", !isLoading);
}

function setError(message = "") {
  errorMessage.textContent = message;
  errorMessage.classList.toggle("hidden", !message);
}

function updateCounters() {
  itemCount.textContent = todos.length;
  uncheckedCount.textContent = todos.filter(todo => !todo.checked).length;
}

function renderTodos() {
  list.innerHTML = "";

  if (todos.length === 0) {
    list.innerHTML = '<li class="empty">Список справ порожній</li>';
    updateCounters();
    return;
  }

  todos.forEach(todo => {
    const li = document.createElement("li");
    li.className = "todo-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.checked;
    checkbox.addEventListener("change", () => updateTodo(todo.id, { checked: checkbox.checked }));

    const title = document.createElement("span");
    title.className = todo.checked ? "todo-title done" : "todo-title";
    title.textContent = todo.text;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Видалити";
    deleteButton.addEventListener("click", () => deleteTodo(todo.id));

    li.append(checkbox, title, deleteButton);
    list.appendChild(li);
  });

  updateCounters();
}

async function request(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Помилка запиту: ${response.status}`);
  }

  return response.json();
}

// GET - читання даних з Firebase
async function getTodos() {
  try {
    setLoading(true);
    setError();

    const data = await request(FIREBASE_URL);

    todos = data
      ? Object.entries(data).map(([id, todo]) => ({ id, ...todo }))
      : [];

    renderTodos();
  } catch (error) {
    setError("Не вдалося завантажити справи з бази даних.");
    console.error(error);
  } finally {
    setLoading(false);
  }
}

// POST - додавання нової справи до Firebase
async function addTodo(text) {
  const newTodo = {
    text,
    checked: false,
    createdAt: new Date().toISOString(),
  };

  const options = {
    method: "POST",
    body: JSON.stringify(newTodo),
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
  };

  const response = await request(FIREBASE_URL, options);

  // Firebase повертає об'єкт { name: "згенерований_id" }
  todos.push({ id: response.name, ...newTodo });
  renderTodos();
}

// PATCH - оновлення окремого запису
async function updateTodo(id, changes) {
  try {
    setError();

    const options = {
      method: "PATCH",
      body: JSON.stringify(changes),
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
    };

    await request(FIREBASE_URL.replace("todos.json", `todos/${id}.json`), options);

    todos = todos.map(todo => (todo.id === id ? { ...todo, ...changes } : todo));
    renderTodos();
  } catch (error) {
    setError("Не вдалося оновити справу.");
    console.error(error);
    getTodos();
  }
}

// DELETE - видалення справи з Firebase
async function deleteTodo(id) {
  try {
    setError();

    const options = {
      method: "DELETE",
    };

    await fetch(FIREBASE_URL.replace("todos.json", `todos/${id}.json`), options);

    todos = todos.filter(todo => todo.id !== id);
    renderTodos();
  } catch (error) {
    setError("Не вдалося видалити справу.");
    console.error(error);
  }
}

function newTodo(event) {
  event.preventDefault();

  const text = input.value.trim();

  if (!text) {
    setError("Введіть текст справи.");
    return;
  }

  addTodo(text)
    .then(() => {
      input.value = "";
      setError();
    })
    .catch(error => {
      setError("Не вдалося додати справу до бази даних.");
      console.error(error);
    });
}

form.addEventListener("submit", newTodo);
getTodos();
