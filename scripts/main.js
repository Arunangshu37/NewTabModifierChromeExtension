const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

document.body.style.backgroundColor = 'darkgrey';
document.body.style.backgroundRepeat = 'no-repeat';
document.body.style.backgroundSize = 'cover';

const messageChannel = new MessageChannel();
navigator.serviceWorker.controller.postMessage({
	type: 'INIT_PORT',
}, [messageChannel.port2]);

messageChannel.port1.onmessage = (event) => {

	if (event.data && event.data.type == 'MSG_BACKGROUND_IMAGE') {
		document.body.style.backgroundImage = `url(${event.data.backGroundImageData})`;
		localStorage.setItem("myImage", event.data.backGroundImageData);
	}
	if (event.data && event.data.type == 'MSG_QUOTE') {
		localStorage.setItem('quote', event.data.quote)
		document.getElementById('quote').textContent = event.data.quote;
	}
};

if (localStorage.getItem("myImage")) {
	document.body.style.backgroundImage = `url(${localStorage.getItem("myImage")})`;

}
if (localStorage.getItem('quote') != '' || localStorage.getItem('quote') != undefined) {
	document.getElementById('quote').textContent = localStorage.getItem('quote');
}


window.createQuickLinks = () => {

	let quickLinks = document.querySelector('#quickLinks');
	quickLinks.innerHTML = '';
	chrome.bookmarks.getTree((tree) => {
		tree[0].children[1].children.forEach((quickLink) => {
			const url = new URL(quickLink.url)
			const li = document.createElement('li');
			let linkElement = document.createElement('a');
			linkElement.setAttribute('href', `${quickLink.url}`);


			linkElement.setAttribute('title', `${quickLink.title}`);
			linkElement.innerHTML = `
				<img src='https://${url.host}/favicon.ico' id='img${quickLink.id}'/>
				<span class='restricted-width' >${quickLink.title}</span>`;
			li.innerHTML = `<button id='editMenuBtn' data-bs-toggle='dropdown' class='btn btn-link p-0'><i class="bi bi-three-dots-vertical"  ></i></button>
			<ul class="dropdown-menu">
				<li><a class="dropdown-item" id='edit-${quickLink.id}' href="#">Edit</a></li>
				<li><a class="dropdown-item" id='delete-${quickLink.id}' href="#">Delete</a></li>
			</ul>`;
			li.setAttribute('class', 'tinted');
			li.appendChild(linkElement);

			quickLinks.appendChild(li);
			document.getElementById(`img${quickLink.id}`).addEventListener("error", function (event) {
				try {
					fetch(event.target.src.replace('favicon.ico', 'favicon.png')).then((response) => {
						if (response.ok) {
							event.target.src = event.target.src.replace('favicon.ico', 'favicon.png')
						}
					}).catch((error) => {
						event.target.src = "./../question_mark.ico"
					})
				} catch (e) {
					event.target.src = "./../question_mark.ico"
				}
			})
			document.getElementById(`edit-${quickLink.id}`).addEventListener('click', manageQuickLinks);
			document.getElementById(`delete-${quickLink.id}`).addEventListener('click', manageQuickLinks);
		});
	});
}




database.onsuccess = function () {
	let db = database.result;
};

database.onupgradeneeded = (event) => {
	let db = event.target.result;
	if (!db.objectStoreNames.contains("todo")) {
		let store = db.createObjectStore('todo', {
			autoIncrement: true,
			keyPath: 'id'
		});
		store.createIndex('description', 'description');
		store.createIndex('title', 'title');
		store.createIndex('priority', 'priority');
		store.createIndex('status', 'status');
		store.createIndex('hidden', 'hidden');
	}

	if (!db.objectStoreNames.contains("appSettings")) {
		let store = db.createObjectStore('appSettings', {
			autoIncrement: true,
			keyPath: 'id'
		});
		store.createIndex('description', 'description');
		store.createIndex('property', 'property');
		store.createIndex('value', 'value');

		store.add({
			property: 'viewMode',
			value: 'cardsView'
		});
		store.add({
			property: 'displayTodos',
			value: 'false'
		});
		store.add({
			property: 'dynamicBackground',
			value: 'true'
		});
	}
};


database.onerror = function () {
	console.warn(database.error);
};


window.updateTable = (min, max, sorter, searchText) => {
	let request = indexedDB.open('todo', 2);
	request.onsuccess = (event) => {
		if (!event.target.result.objectStoreNames.contains("todo")) {
			return;
		}
		const database = event.target.result;
		const [store] = getObjectStore(database, 'todo')
		let getAllQuery = store.getAll();
		getAllQuery.onsuccess = (event) => {
			renderTodo(event.target.result, min, max, sorter, searchText);
			setHandlers();
		}
		database.close();
	}

}
window.renderTodo = (data, min, max, sorter, searchText = '') => {
	dataLength = data.length;
	let sortedData = data;
	if (sorter != '-') {
		let sortQuery = sorter.split('-');
		sortedData = sortQuery[1] == '1' ?
			data.sort((prev, next) => prev[sortQuery[0]] > next[sortQuery[0]] ? 1 : (prev[sortQuery[0]] < next[sortQuery[0]] ? -1 : 0)) :
			data.sort((prev, next) => prev[sortQuery[0]] < next[sortQuery[0]] ? 1 : (prev[sortQuery[0]] > next[sortQuery[0]] ? -1 : 0));
	}
	sortedData = sortedData.filter((todo) => todo.title.toLowerCase().indexOf(searchText) != -1 || todo.description.toLowerCase().indexOf(searchText) != -1)
	let dataToBeDisplayed = min == max ? sortedData.slice(min) : sortedData.slice(min, max);
	const [priorityFilters, statusFilters] = [getFilters('priorityFilter'), getFilters('statusFilter')];
	dataToBeDisplayed = dataToBeDisplayed.filter((data) => priorityFilters.length != 0 ? priorityFilters.includes(data.priority) : true);
	dataToBeDisplayed = dataToBeDisplayed.filter((data) => statusFilters.length != 0 ? statusFilters.includes(data.status) : true);

	if (viewMode == 'cardsView') {
		document.getElementById('todoTable').style.display = 'none';
		document.getElementById('todo-cards').style.display = 'flex';
		createOrUpdateTodoCards(dataToBeDisplayed);
		return;
	}
	// default view is table as always.
	document.getElementById('todoTable').style.display = 'table';
	document.getElementById('todo-cards').style.display = 'none';
	this.createOrUpdateTodoTable(dataToBeDisplayed);
}

window.createOrUpdateTodoTable = (dataToBeDisplayed) => {
	let table = document.getElementById('todoTable');

	for (var i = 1; i < table.rows.length;) {
		table.deleteRow(i);
	}

	dataToBeDisplayed.forEach((_) => {
		const key = _.id;
		let row = table.insertRow();
		let { name, priorityClass } = getPriorityInfo(_['priority']);
		let rowData = `
			<td><span class="ms-2">${key}</span></td>
			<td> ${_['title']}</td>
			<td><select class='form-select-sm status-selection' key="${key}"> 
				${getOptions(_['status'])}
			</select></td>
			<td><h6><span class="badge ${priorityClass} badge-secondary">${name}</span></h6></td>
			<td id='modal-toggler-${key}'></td>
			<td id='information-${key}' ></td>`;
		row.innerHTML = rowData;
		const linkToModal = getLinkToModal(key);
		document.getElementById(`modal-toggler-${key}`).appendChild(linkToModal);
		const linkToPopup = getLinkToPopup(key);
		document.getElementById(`information-${key}`).appendChild(linkToPopup);
	});
}

window.createOrUpdateTodoCards = (dataToBeDisplayed) => {
	let todoCards = document.getElementById('todo-cards');
	todoCards.innerHTML = '';
	dataToBeDisplayed.forEach((_) => {
		const key = _.id;
		const priority = getPriorityInfo(_['priority']);
		const status = getStatusInfo(_['status']);
		const cardDiv = document.createElement('div');
		cardDiv.setAttribute('class', 'card todo-card');

		cardDiv.innerHTML = `
			<div class="card-body" >
				<h5 class="card-title">
					<span class="d-flex d-flex justify-content-between"  id='card-action-${key}'>
						<div class='d-flex justify-content-between my-auto'>
							<h6 class='mb-0'><span class="badge ${priority.priorityClass} badge-secondary">${priority.name}</span></h6>	
							<h6 class='mb-0 ms-2'><span class="badge ${status.statusClass} badge-secondary" />${status.name}</span></h6>
						</div>	
					</span>
				</h5>
				<p class="card-text more-details" id='card-${key}'  key='${key}' >${_['title']}</p>
			</div>
			
		`;
		todoCards.appendChild(cardDiv);
		let button = document.createElement('button');
		button.setAttribute('key', key);
		button.setAttribute('id', `action-btn-${key}`);
		button.addEventListener('click', handleTakeAction);

		button.setAttribute('data-bs-target', "#todoModal");
		button.setAttribute('data-bs-toggle', "modal");
		button.innerHTML = `<i class="bi bi-card-text" key='${key}' ></i>`;
		button.setAttribute('class', 'btn btn-light');
		document.getElementById(`card-action-${key}`).append(button);
		document.getElementById(`card-${key}`).addEventListener('click', showMoreInfo);
	});
}


window.getOptions = (defaultSelectionId) => {
	let options = '';
	statuses.forEach((status) => {
		options += `<option value="${status.id}" ${defaultSelectionId == status.id ? 'selected' : ''} >${status.name}</option>`;
	})
	return options;
}
window.initApp = () => {
	let request = indexedDB.open('todo', 2);
	request.onsuccess = (event) => {
		const db = event.target.result;
		const [store] = getObjectStore(db, 'appSettings');
		const query = store.getAll()
		query.onsuccess = (event) => {
			const settings = event.target.result;
			settings.forEach((setting) => {
				if (setting.property == "viewMode") {
					viewMode = setting.value;
					const viewModeSetter = document.getElementsByName('viewMode');
					viewModeSetter.forEach((element) => {
						if (element.id == setting.value) {
							element.checked = true;
						}
						element.setAttribute('settingid', setting.id);
					});
				}
				if (setting.property == "displayTodos") {
					const displayTodos = document.getElementById(setting.property);
					displayTodos.setAttribute('settingid', setting.id);
					displayTodos.checked = JSON.parse(setting.value);
					toggleTodoPanel(JSON.parse(setting.value));
				}

				if (setting.property == "dynamicBackground") {

				}
			});
		}
	}
	this.updateTable(0, 5, '', '');
	this.createQuickLinks();

	navigator.serviceWorker.controller.postMessage({
		type: 'START_PROCESS',
	});
}

this.initApp();
