"use strict";
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

document.body.style.backgroundColor = 'darkgrey';	
document.body.style.backgroundRepeat = 'no-repeat';
document.body.style.backgroundSize= 'cover';

const broadcast = new BroadcastChannel('channel-123');

if(localStorage.getItem("myImage")){
	document.body.style.backgroundImage = `url(${localStorage.getItem("myImage")})`;

}
if(localStorage.getItem('quote') != '' || localStorage.getItem('quote')!=undefined){
	document.getElementById('quote').textContent = localStorage.getItem('quote');
}
broadcast.postMessage({type: 'MSG_ID', value: 'test'});
broadcast.onmessage = (event) => {
	if(event.data && event.data.type == 'MSG_BACKGROUND_IMAGE'){
		document.body.style.backgroundImage = `url(${event.data.backGroundImageData})`;
		localStorage.setItem("myImage", event.data.backGroundImageData);
	}
	if(event.data && event.data.type == 'MSG_QUOTE'){
		localStorage.setItem('quote', event.data.quote)
		document.getElementById('quote').textContent = event.data.quote;
	}
}


function createQuickLinks(){

	let quickLinks = document.querySelector('#quickLinks');
	quickLinks.innerHTML = '';
	chrome.bookmarks.getTree((tree) => {
		tree[0].children[1].children.forEach((quickLink) => {
			const url  = new URL(quickLink.url)
			const li = document.createElement('li');
			let linkElement = document.createElement('a');
			linkElement.setAttribute('href',`${quickLink.url}`);
			
			
			linkElement.setAttribute('title',`${quickLink.title}`);
			linkElement.innerHTML = `
				<img src='https://${url.host}/favicon.ico' id='img${quickLink.id}'/>
				<span class='restricted-width' >${quickLink.title}</span>`;

			li.innerHTML = `<button id='editMenuBtn' data-bs-toggle='dropdown' class='btn btn-link p-0'><i class="bi bi-three-dots-vertical"  ></i></button>
			<ul class="dropdown-menu">
				<li><a class="dropdown-item" id='edit-${quickLink.id}' href="#">Edit</a></li>
				<li><a class="dropdown-item" id='delete-${quickLink.id}' href="#">Delete</a></li>
			</ul>`;
			li.setAttribute('class','tinted');
			li.appendChild(linkElement);
			
			quickLinks.appendChild(li);
			document.getElementById(`img${quickLink.id}`).addEventListener("error", function(event) {
				try{
					fetch(event.target.src.replace('favicon.ico', 'favicon.png')).then((response)=>{
						if(response.ok){
							event.target.src = event.target.src.replace('favicon.ico', 'favicon.png')
						}
					}).catch((error)=>{
						event.target.src = "./../question_mark.ico"
					})
				}catch(e){
					event.target.src = "./../question_mark.ico"
				}
			})
			document.getElementById(`edit-${quickLink.id}`).addEventListener('click', manageQuickLinks);
			document.getElementById(`delete-${quickLink.id}`).addEventListener('click', manageQuickLinks);
		});
	});
}


/**
 * handling index db
 */
var viewMode = 'tableView';
var  database = indexedDB.open('todo', 2);

var dataLength = 0;

var statuses = [
	{
		id: 0,
		name: 'new',
		statusClass: 'text-bg-primary'
	},
	{
		id: 1,
		name: 'In Progress',
		statusClass: 'text-bg-info'
	},
	{
		id: 2,
		name: 'Complete',
		statusClass: 'text-bg-success'
	}
]
var priorities = [
	{
		id: 1,
		name: 'High',
		priorityClass: 'text-bg-danger'
	},
	{
		id: 2,
		name: 'Medium',
		priorityClass: 'text-bg-warning'
	},
	{
		id: 3,
		name: 'Low',
		priorityClass: 'text-bg-secondary'
	}
]

function getPriorityInfo(id){
	return priorities.find((priority) => priority.id == id);
}

database.onsuccess = function () {
	let db = database.result;
};

database.onupgradeneeded = (event) => {
	let db = event.target.result;
	if(!db.objectStoreNames.contains("todo")){
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

	if(!db.objectStoreNames.contains("appSettings")){
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


function updateTable(min, max, sorter, searchText) {
	let request = indexedDB.open('todo', 2);
	request.onsuccess = (event) =>{
		if(!event.target.result.objectStoreNames.contains("todo")){
			return;
		}
		const database = event.target.result;
		const [store] = getObjectStore(database, 'todo') 
		let getAllQuery = store.getAll();
		getAllQuery.onsuccess = (event) =>{
			renderTodo(event.target.result, min, max, sorter, searchText);
			setHandlers();
		}
		database.close();
	}

}

function renderTodo(data, min, max, sorter, searchText=''){
	dataLength = data.length;
	
	
	let sortedData = data;
	if(sorter!= '-'){
		let sortQuery = sorter.split('-');
		sortedData = sortQuery[1] == '1' ? 
			data.sort((prev, next) => prev[sortQuery[0]] >next[sortQuery[0]] ? 1 : (prev[sortQuery[0]] < next[sortQuery[0]]  ? -1 : 0)) :
			data.sort((prev, next) => prev[sortQuery[0]] < next[sortQuery[0]] ? 1 : (prev[sortQuery[0]] > next[sortQuery[0]]  ? -1 : 0)) ;
	}
	sortedData = sortedData.filter((todo) => todo.title.toLowerCase().indexOf(searchText) != -1 || todo.description.toLowerCase().indexOf(searchText) != -1  )
	let dataToBeDisplayed = min == max ? sortedData.slice(min) : sortedData.slice(min, max);
	const [priorityFilters, statusFilters] =[ getFilters('priorityFilter'), getFilters('statusFilter')] ;
	dataToBeDisplayed = dataToBeDisplayed.filter((data) => priorityFilters.length != 0 ? priorityFilters.includes(data.priority) : true);
	dataToBeDisplayed = dataToBeDisplayed.filter((data) => statusFilters.length != 0 ?  statusFilters.includes(data.status) : true);

	if(viewMode == 'cardsView'){
		document.getElementById('todoTable').style.display='none';
		document.getElementById('todo-cards').style.display='flex';
		createOrUpdateTodoCards(dataToBeDisplayed);
	}else{
		document.getElementById('todoTable').style.display='table';
		document.getElementById('todo-cards').style.display='none';
		createOrUpdateTodoTable(dataToBeDisplayed);
	}
}


function createOrUpdateTodoTable(dataToBeDisplayed){


	let table = document.getElementById('todoTable');
	
	
	for(var i = 1;i<table.rows.length;){
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
		const linkToModal = document.createElement('a');
		linkToModal.setAttribute('data-bs-target', "#todoModal");
		linkToModal.setAttribute('data-bs-toggle', "modal");
		linkToModal.setAttribute('class', 'link')
		linkToModal.setAttribute('key', `${key}`)
		linkToModal.addEventListener('click',  handleTakeAction);
		linkToModal.textContent = 'Take Action';
		
		document.getElementById(`modal-toggler-${key}`).appendChild(linkToModal);

		const linkToPopup = getLinkToPopup(key);
		
		document.getElementById(`information-${key}`).appendChild(linkToPopup);
	});
}


function createOrUpdateTodoCards(dataToBeDisplayed){
	let todoCards = document.getElementById('todo-cards');
	todoCards.innerHTML = '';
	dataToBeDisplayed.forEach((_) => {
		const key = _.id;
		const priority = getPriorityInfo(_['priority']);
		const status = getStatusInfo(_['status']);
		const cardDiv = document.createElement('div');
		cardDiv.setAttribute('class', 'card todo-card');

		cardDiv.innerHTML = `
			<div class="card-body"  >
				<h5 class="card-title">
					<span class="d-flex d-flex justify-content-between">
						<h6><span class="badge ${priority.priorityClass} badge-secondary">${priority.name}</span></h6>	
						<h6><span class="badge ${status.statusClass} badge-secondary" />${status.name}</span></h6>	
					</span>

				</h5>
				<p class="card-text">${_['title']}</p>
			</div>
			<div class='card-footer d-flex justify-content-end' id='card-action-${key}'></div>
		`;
		todoCards.appendChild(cardDiv);
		const linkToModal = document.createElement('a');
		linkToModal.setAttribute('data-bs-target', "#todoModal");
		linkToModal.setAttribute('data-bs-toggle', "modal");
		linkToModal.setAttribute('class', 'link m-1')
		linkToModal.setAttribute('key', `${key}`)
		linkToModal.addEventListener('click',  handleTakeAction);
		linkToModal.textContent = 'Take Action';
		
		document.getElementById(`card-action-${key}`).appendChild(linkToModal);

		const linkToPopup = getLinkToPopup(key);
		
		document.getElementById(`card-action-${key}`).appendChild(linkToPopup);
		
	});
}



function getStatusInfo(id){
	return statuses.find((status) => status.id == id);
}

function getOptions(defaultSelectionId) {
	let options = '';
	statuses.forEach((status) => {
		options += `<option value="${status.id}" ${defaultSelectionId == status.id ? 'selected' :'' } >${status.name}</option>`;
	})
	return options;
}




function initApp(){
	let request = indexedDB.open('todo', 2);
	request.onsuccess = (event) => {
		const db = event.target.result;
		const [store] = getObjectStore(db, 'appSettings');
		const query = store.getAll()
		query.onsuccess = (event)=>{
			const settings = event.target.result;
			settings.forEach((setting) => {
				if(setting.property == "viewMode"){
					viewMode = setting.value;
					const viewModeSetter = document.getElementsByName('viewMode');
					viewModeSetter.forEach((element) => {
						if(element.id == setting.value){
							element.checked = true;
						}
						element.setAttribute('settingid', setting.id);
					});
				}
				if(setting.property == "displayTodos"){
					const displayTodos =  document.getElementById(setting.property);
					displayTodos.setAttribute('settingid', setting.id);
					displayTodos.checked = JSON.parse(setting.value);
					toggleTodoPanel(JSON.parse(setting.value));
				}

				if(setting.property == "dynamicBackground"){

				}
			});
		}
	}
	updateTable(0, 5, '', '');
	createQuickLinks();
}

initApp();
