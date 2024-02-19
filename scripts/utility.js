function dismissModal(modalId){
	const myModal = bootstrap.Modal.getOrCreateInstance(modalId);
	myModal.hide();
}

function showModal(modalId){
	const myModal = bootstrap.Modal.getOrCreateInstance(modalId);
	myModal.show();
}

function getObjectStore(dbInstance) {
	const txn = dbInstance.transaction('todo', 'readwrite');
	return [txn.objectStore('todo'), txn]
}

function showMoreInfo(){
	const id = Number(this.getAttribute('key'));
	let request = indexedDB.open('todo', 2);
	request.onsuccess = (event) =>{
		const database = event.target.result;
		const [store] = getObjectStore(database);
		const query = store.get(id);
		query.onsuccess = (event) =>{
			console.log(event.target);
			const data = event.target.result;
			console.log(data);
			document.getElementById('todoInfo').textContent = data.description;
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
