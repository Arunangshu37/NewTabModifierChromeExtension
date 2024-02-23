function dismissModal(modalId){
	const myModal = bootstrap.Modal.getOrCreateInstance(modalId);
	myModal.hide();
}

function showModal(modalId){
	const myModal = bootstrap.Modal.getOrCreateInstance(modalId);
	myModal.show();
}

function getObjectStore(dbInstance, storeName) {
	const txn = dbInstance.transaction(storeName, 'readwrite');
	return [txn.objectStore(storeName), txn]
}

function showMoreInfo(){
	const id = Number(this.getAttribute('key'));
	let request = indexedDB.open('todo', 2);
	request.onsuccess = (event) =>{
		const database = event.target.result;
		const [store] = getObjectStore(database, 'todo');
		const query = store.get(id);
		query.onsuccess = (event) =>{
			const data = event.target.result;
			const todoInfo = document.getElementById('todoInfo');
			todoInfo.textContent = data.description;
			todoInfo.setAttribute('todoid', id);
			showModal('#infoModal');
		}
	}
}

function showToast(message, classType){
	document.getElementById('toast').classList.add(classType, 'show');
	document.getElementById('toastMessage').textContent = message;
	setTimeout(() => {
		document.getElementById('toast').classList.remove(classType, 'show');
	} , 2000)
}

function getFilters(inputName){
	let filters =[] ;
	document.getElementsByName(inputName).forEach((element)=> {
		if(element.checked){
			filters.push(+element.value);
		}
	});
	return filters;
}

function updateSetting(id, property, value){
	const request = indexedDB.open('todo', 2);
	request.onsuccess = (event) =>{
		const database = event.target.result;
		const [store] = getObjectStore(database, 'appSettings');
		store.put({
			id: +id,
			property: property,
			value: value
		});
	}
}

function getLinkToPopup(key){
	let linkToPopup = document.createElement('a');
	linkToPopup.setAttribute('key', `${key}`);
	linkToPopup.addEventListener('click',  showMoreInfo);
	linkToPopup.setAttribute('class', 'link')
	linkToPopup.textContent = 'Details';
	return linkToPopup;
}