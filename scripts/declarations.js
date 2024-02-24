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
var historicalTodoInfoInnerText = '';