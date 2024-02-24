document.getElementById('todoForm').addEventListener('submit', (e) => {
	e.preventDefault();
	const data = new FormData(e.target);
	const formData = Object.fromEntries(data.entries());
	let request = indexedDB.open('todo', 2);
	request.onsuccess = (event) =>{
		const database = event.target.result
		const [store, txn] =getObjectStore(database, 'todo')
		formData.id = +formData.id  
		formData.priority = +formData.priority  
		formData.status = +formData.status 
		if(formData.mode == 'update'){
			delete formData.mode;
			let query = store.put(formData)
			query.onsuccess = (event) => {
				if(!isNaN(event.target.result)){
					document.getElementById('mode').value='create';
					showToast('Todo updated successfully!', 'text-bg-warning');
				}
			}
		}else{
			delete formData.id;
			delete formData.mode;
			let query = store.add(formData)
			query.onsuccess = (event) => {
				if(!isNaN(event.target.result)){
					showToast('Todo created successfully!', 'text-bg-success');
				}
			}
		}
		dismissModal('#todoModal');
		txn.oncomplete = function () {
			updateTable(0, 5, '', '');
			database.close();
		};
	}
	document.getElementById('deleteBtn').style.display = 'none';
	document.getElementById('sorter').value = '-';
	e.target.reset();
});


document.getElementById('deleteBtn').addEventListener('click', (e) => {
	const key = e.target.getAttribute('key');
	if(confirm('Are you sure you want to delete this item?')){
		let request = indexedDB.open('todo', 2);
		request.onsuccess = (event) =>{
			const database = event.target.result;
			const [store, txn] = getObjectStore(database, 'todo');
			store.delete(Number(key));
			txn.commit();
			database.close();
			showToast('Todo created successfully!', 'text-bg-danger');
		}
		dismissModal('#todoModal');
		updateTable(0, 5, '', '');
	}
});

document.getElementById('modalOpener').addEventListener('click', () => {
	document.getElementById('todoForm').reset();
	document.getElementById('mode').value="create";

})

document.getElementById('sorter').addEventListener('change', (event) => {
	updateTable(0, 5, event.target.value);
})

document.getElementById('search').addEventListener('input', (event) => {
	updateTable(+prevBtn.getAttribute('prev'), 
	+document.getElementById('next').getAttribute('next'), 
	document.getElementById('sorter').value, 
	event.target.value.toLowerCase())
})

document.getElementById('export').addEventListener('click', () => {
	let request = indexedDB.open("todo", 2);
	request.onsuccess = (event) =>{
		const db = event.target.result;
		const [store] = getObjectStore(db, 'todo');
		 store.getAll().onsuccess = (event) => {
			const headers = Object.keys(event.target.result[0]).toString();
			const body = event.target.result.map((todo) => Object.values(todo).toString());
			const csvValue = [headers, ...body].join('\n');
			const blob = new Blob([csvValue], {type: 'application/json'});
			const url = URL.createObjectURL(blob);
			const a  = document.createElement('a');
			a.download = 'todos.csv';
			a.href= url;
			document.body.appendChild(a);
			a.click();
			a.remove();
		}
	}
})


let nextBtn = document.getElementById('next');
nextBtn.addEventListener('click', ( ) =>{
	let nextValue = +nextBtn.getAttribute('next');
	if(nextValue > dataLength - 1){
		return;
	}
	if(nextValue + 5 <= dataLength-1) {
		document.getElementById('prev').setAttribute('prev', nextValue);
		nextBtn.setAttribute('next', nextValue+5);
	}else{
		document.getElementById('prev').setAttribute('prev', nextValue);
		nextBtn.setAttribute('next', dataLength);
	}
	updateTable(+document.getElementById('prev').getAttribute('prev'),
	+nextBtn.getAttribute('next'), 
	document.getElementById('sorter').value,
	document.getElementById('search').value.toLowerCase())
});

let prevBtn = document.getElementById('prev');
prevBtn.addEventListener('click', ()=>{
	let prevValue = +prevBtn.getAttribute('prev');
	if(prevValue == 0){
		return;
	}

	if(prevValue-5 >= 0){
		document.getElementById('next').setAttribute('next', prevValue);
		prevBtn.setAttribute('prev', prevValue-5);
	}else{
		document.getElementById('next').setAttribute('next', prevValue);
		prevBtn.setAttribute('prev', 0);
	}
	updateTable(+prevBtn.getAttribute('prev'), 
	+document.getElementById('next').getAttribute('next'), 
	document.getElementById('sorter').value, 
	document.getElementById('search').value.toLowerCase())

} );


function setHandlers(){
	document.querySelectorAll('.status-selection').forEach((element) => {
		element.addEventListener('change', handleChange);
	})
	document.querySelectorAll('.action-takers').forEach((element) => {
		element.addEventListener('click', handleTakeAction);
	})
}


function handleChange(event) {
	const key = event.target.getAttribute('key');
	const status = event.target.value;
	let request = indexedDB.open('todo', 2);
	request.onsuccess = (event) => {
		const database = event.target.result;
		const [store, txn]  = getObjectStore(database,'todo');
		const getRequest = store.get(Number(key));
		getRequest.onsuccess = (event) => {
			const updatedValue= {...event.target.result, ['status']: +status}
			store.put(updatedValue);
			txn.commit();
			showToast('Status of the todo has been changed.', 'text-bg-warning');
			database.close();
		}
	}
}

function handleTakeAction(btnEvent) {
	let request = indexedDB.open('todo', 2);
	request.onsuccess = (event) => {
		const key = btnEvent.target.getAttribute('key');
		const database = event.target.result;
		const [store] = getObjectStore(database, 'todo');

		store.get(Number(key)).onsuccess = (storeEvent) => {
			const data = storeEvent.target.result;
			document.getElementById('deleteBtn').style.display = 'block';
			document.getElementById('todoTitle').value=data.title;
			document.getElementById('todoDescription').value= data.description;
			document.getElementById('todoStatus').value= data.status;
			document.getElementById('mode').value= 'update';
			document.getElementById('todoId').value = key;

			document.getElementsByName('priority').forEach((item) => item.checked = item.value ==  data.priority)

			document.getElementById('deleteBtn').setAttribute('key', `${key}`);
			database.close();
		}
	}
}

function manageQuickLinks() {
	const quickLinkQuery = this.id.split('-');
	if(quickLinkQuery[0] == 'edit'){
		chrome.bookmarks.getTree((tree) => {
			const bookmark = tree[0].children[1].children.find((bookmark) => bookmark.id == quickLinkQuery[1] );
			document.getElementById('bookmarkTitle').value = bookmark.title;
			document.getElementById('bookmarkLink').value = bookmark.url
			document.getElementById('bookmarkId').value = quickLinkQuery[1];
			showModal('#bookmarkModal');
		});
	}else if (quickLinkQuery[0] == 'delete' && confirm('are you sure you want to delete this quick link?')){
		chrome.bookmarks.remove(quickLinkQuery[1]);
		showToast('Quick Link deleted successfully', 'text-bg-danger');
		createQuickLinks();
	}
}

document.getElementById('bookmarkForm').addEventListener('submit', (e) => {
	e.preventDefault();
	
	const formData= new FormData(e.target);
	const value = Object.fromEntries(formData.entries());
	const id =value.id;
	delete value.id;
	chrome.bookmarks.update(id, value)
	dismissModal('#bookmarkModal');
	showToast('Quick Link updated successfully!', 'text-bg-warning');
	createQuickLinks();
})


document.getElementsByName('viewMode').forEach(element => element.addEventListener('change', handleViewModeChange));

function handleViewModeChange(){
	viewMode = this.id;
	const settingId = this.getAttribute('settingid');
	updateSetting(settingId, this.name, this.id);
	updateTable(+prevBtn.getAttribute('prev'), 
	+document.getElementById('next').getAttribute('next'), 
	document.getElementById('sorter').value, 
	document.getElementById('search').value.toLowerCase())
}

['priorityFilter', 'statusFilter' ].forEach((inputName) => {
	document.getElementsByName(inputName).forEach((element) => {
		element.addEventListener('change', handleFilterEvent);
	});
});

function handleFilterEvent(){
	updateTable(+prevBtn.getAttribute('prev'), 
		+document.getElementById('next').getAttribute('next'), 
		document.getElementById('sorter').value, 
		document.getElementById('search').value.toLowerCase())
}



document.getElementById('displayTodos').addEventListener('change', (event) =>{
	const settingId = event.target.getAttribute('settingid');
	updateSetting(settingId, event.target.id, event.target.checked.toString());
	toggleTodoPanel(event.target.checked);
});

function toggleTodoPanel(flag){
	const todoMenu =document.getElementById('todoMenuButton');
	const todoContainerPanel =document.getElementById('todoContainerPanel');
	const todoSearchPanel =document.getElementById('todoSearchPanel');
	if(!flag){
		todoMenu.setAttribute('disabled', 'true');
	}else{
		todoMenu.removeAttribute('disabled');
	}
	todoMenu.title = flag ? '' : 'Enable todo visibility to enable this button';
	
	// make todos invisible
	todoContainerPanel.style.transform = flag ? 'scaleX(1)' : 'scaleX(0)';
	todoSearchPanel.style.transform = flag ? 'scaleY(1)' : 'scaleY(0)';;
}


document.getElementById('footerInfoCloseBtn').addEventListener('click', saveDescriptionOnCloseOfModal);
document.getElementById('headerInfoCloseBtn').addEventListener('click', confirmThenCloseModal);

function saveDescriptionOnCloseOfModal(){
	const todoInfo = document.getElementById('todoInfo');
	const request = indexedDB.open('todo', 2);
	request.onsuccess = (event) =>{
		const db = event.target.result;
		const [store] = getObjectStore(db, 'todo');
		const getQuery = store.get(+todoInfo.getAttribute('todoid'));
		getQuery.onsuccess = (event) => {
			const data = event.target.result;
			if(data != todoInfo.innerText ){
				data.description = todoInfo.innerText;
				store.put(data);
			}
		}
	}
}

function confirmThenCloseModal(){
	const todoInfo = document.getElementById('todoInfo');
	if(historicalTodoInfoInnerText != todoInfo.innerText){
		if(confirm("Are you sure you want to close the modal. Some changes you did will get lost is not saved and closed?")){
			dismissModal('#infoModal');
		}
		return;
	}
	dismissModal('#infoModal');
}