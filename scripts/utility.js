function dismissModal(modalId) {
	const myModal = bootstrap.Modal.getOrCreateInstance(modalId);
	myModal.hide();
}

function showModal(modalId) {
	const myModal = bootstrap.Modal.getOrCreateInstance(modalId);
	myModal.show();
}

function getObjectStore(dbInstance, storeName) {
	const txn = dbInstance.transaction(storeName, 'readwrite');
	return [txn.objectStore(storeName), txn]
}

function showMoreInfo() {
	const id = Number(this.getAttribute('key'));
	let request = indexedDB.open('todo', 2);
	request.onsuccess = (event) => {
		const database = event.target.result;
		const [store] = getObjectStore(database, 'todo');
		const query = store.get(id);
		query.onsuccess = (event) => {
			const data = event.target.result;
			const todoInfo = document.getElementById('todoInfo');
			todoInfo.innerText = data.description;
			historicalTodoInfoInnerText = data.description
			todoInfo.setAttribute('todoid', id);
			showModal('#infoModal');
		}
	}
}

function showToast(message, classType) {
	document.getElementById('toast').classList.add(classType, 'show');
	document.getElementById('toastMessage').textContent = message;
	setTimeout(() => {
		document.getElementById('toast').classList.remove(classType, 'show');
	}, 2000)
}

function getFilters(inputName) {
	let filters = [];
	document.getElementsByName(inputName).forEach((element) => {
		if (element.checked) {
			filters.push(+element.value);
		}
	});
	return filters;
}

function updateSetting(id, property, value) {
	const request = indexedDB.open('todo', 2);
	request.onsuccess = (event) => {
		const database = event.target.result;
		const [store] = getObjectStore(database, 'appSettings');
		store.put({
			id: +id,
			property: property,
			value: value
		});
	}
}

function getLinkToPopup(key) {
	let linkToPopup = document.createElement('a');
	linkToPopup.setAttribute('key', `${key}`);
	linkToPopup.addEventListener('click', showMoreInfo);
	linkToPopup.setAttribute('class', 'link m-1')
	linkToPopup.textContent = 'Details';
	return linkToPopup;
}
function getLinkToModal(key) {
	let linkToModal = document.createElement('a');
	linkToModal.setAttribute('data-bs-target', "#todoModal");
	linkToModal.setAttribute('data-bs-toggle', "modal");
	linkToModal.setAttribute('class', 'link m-1')
	linkToModal.setAttribute('key', `${key}`)
	linkToModal.addEventListener('click', handleTakeAction);
	linkToModal.textContent = 'Take Action';
	return linkToModal;
}


function getPriorityInfo(id) {
	return priorities.find((priority) => priority.id == id);
}
function getStatusInfo(id){
	return statuses.find((status) => status.id == id);
}